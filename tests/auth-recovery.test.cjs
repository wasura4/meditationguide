const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');

test('authenticated recovery tolerates profile outages and ignores stale account responses', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const previous = { window: global.window, document: global.document, act: global.IS_REACT_ACT_ENVIRONMENT };
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const auth = { currentUser: null };
  const reads = [];
  let listener, state, writes = 0;
  const filename = path.resolve('src/contexts/AuthContext.tsx');
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = module.paths;
  loaded.require = name => {
    if (name === '@/lib/firebase') return { auth, db: {} };
    if (name === 'firebase/auth') return { onAuthStateChanged: (_, callback) => { listener = callback; return () => {}; } };
    if (name === 'firebase/firestore') return {
      doc: (_, collection, id) => ({ collection, id }),
      getDoc: ref => new Promise((resolve, reject) => reads.push({ ref, resolve, reject })),
      setDoc: async () => { writes++; },
    };
    return require(name);
  };
  loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, filename);
  const { AuthProvider, useAuth } = loaded.exports;
  function Probe() { state = useAuth(); return null; }
  const root = createRoot(document.getElementById('root'));
  const identity = uid => ({ uid, email: `${uid}@example.test`, displayName: uid, isAnonymous: false, metadata: {} });
  const emit = async value => React.act(async () => { auth.currentUser = value; listener(value); });
  const profile = name => ({ exists: () => true, data: () => ({ displayName: name, role: 'editor' }) });
  const originalError = console.error;
  try {
    await React.act(async () => root.render(React.createElement(AuthProvider, null, React.createElement(Probe))));
    await emit(identity('first'));
    assert.equal(state.loading, false, 'a stalled profile read must not block clock hydration');
    assert.equal(state.user.id, 'first');
    assert.equal(state.user.role, 'user', 'fallback cannot grant elevated privileges');
    assert.equal(state.firebaseUser.uid, 'first');
    console.error = () => {};
    await React.act(async () => reads[0].reject(new Error('unavailable')));
    console.error = originalError;
    assert.equal(state.user.id, 'first', 'profile failure must not impersonate a sign-out');
    assert.equal(writes, 0, 'fallback must never overwrite the stored profile');
    await React.act(async () => window.dispatchEvent(new dom.window.Event('online')));
    await React.act(async () => reads[1].resolve(profile('Recovered')));
    assert.equal(state.user.role, 'editor', 'reconnection can restore the real profile');
    await React.act(async () => window.dispatchEvent(new dom.window.Event('online')));
    await emit(identity('second'));
    await React.act(async () => reads[2].resolve(profile('Stale first')));
    assert.equal(state.user.id, 'second', 'old account response cannot replace the current account');
    await emit(null);
    await React.act(async () => reads[3].resolve(profile('Stale second')));
    assert.equal(state.user, null, 'late response cannot sign a user back in');
    assert.equal(state.firebaseUser, null);
  } finally {
    console.error = originalError;
    await React.act(async () => root.unmount());
    dom.window.close();
    global.window = previous.window;
    global.document = previous.document;
    global.IS_REACT_ACT_ENVIRONMENT = previous.act;
  }
});
