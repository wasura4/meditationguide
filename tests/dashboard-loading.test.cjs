const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');

test('dashboard sections settle independently and background refresh keeps content visible', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/dashboard' });
  const previous = { window: global.window, document: global.document, act: global.IS_REACT_ACT_ENVIRONMENT };
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  Object.defineProperty(document, 'hidden', { value: false, configurable: true });
  const sessions = [], posts = [];
  const deferred = queue => new Promise((resolve, reject) => queue.push({ resolve, reject }));
  const filename = path.resolve('src/app/dashboard/page.tsx');
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = module.paths;
  loaded.require = name => {
    if (name === 'next/image') return { __esModule: true, default: () => null };
    if (name === 'next/link') return { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) };
    if (name === '@/contexts/AuthContext') return { useAuth: () => ({ user: { id: 'reader' } }) };
    if (name === '@/contexts/LanguageContext') return { useLanguage: () => ({ t: key => key, language: 'en' }) };
    if (name === '@/components/auth/ProtectedRoute') return { ProtectedRoute: ({ children }) => children };
    if (name === '@/components/dashboard/DashboardPractice') return { DashboardPractice: ({ loading, error, retry }) => React.createElement('button', { onClick: retry, 'data-testid': 'practice' }, loading ? 'loading' : error ? 'error' : 'ready') };
    if (name === '@/components/dashboard/DashboardSkeleton') return { DashboardSkeleton: () => null, ReadingSkeleton: () => React.createElement('span', null, 'reading-loading') };
    if (name === '@/components/events/EventBanner') return { EventBanner: () => null };
    if (name === '@/components/checkins/CheckinCards') return { DailyCheckinCard: () => null };
    if (name === '@/lib/meditationService') return { MeditationService: { getAllUserSessions: () => deferred(sessions) } };
    if (name === '@/lib/dhammaService') return { DhammaService: { getPublishedPosts: () => deferred(posts) } };
    return require(name);
  };
  loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, filename);
  const root = createRoot(document.getElementById('root'));
  const practice = () => document.querySelector('[data-testid="practice"]');
  const reading = () => document.querySelector('[aria-labelledby="home-reading-title"]');
  try {
    await React.act(async () => root.render(React.createElement(loaded.exports.default)));
    assert.equal(practice().textContent, 'loading');
    await React.act(async () => sessions[0].resolve([]));
    assert.equal(practice().textContent, 'ready', 'practice must not wait for reading');
    assert.match(reading().textContent, /reading-loading/);
    await React.act(async () => posts[0].resolve([{ id: 'one', title: 'First reading' }]));
    assert.match(reading().textContent, /First reading/);

    await React.act(async () => document.dispatchEvent(new dom.window.Event('visibilitychange')));
    assert.equal(practice().textContent, 'ready');
    assert.match(reading().textContent, /First reading/, 'background refresh must retain content');
    await React.act(async () => sessions[1].reject(new Error('offline')));
    assert.equal(practice().textContent, 'error', 'errors must surface even while reading is pending');

    await React.act(async () => practice().click());
    await React.act(async () => posts[2].resolve([{ id: 'two', title: 'New reading' }]));
    assert.equal(practice().textContent, 'loading');
    assert.match(reading().textContent, /New reading/, 'reading must not wait for practice');
    await React.act(async () => posts[1].resolve([{ id: 'old', title: 'Stale reading' }]));
    assert.doesNotMatch(reading().textContent, /Stale reading/, 'superseded responses must be ignored');
    await React.act(async () => sessions[2].resolve([]));
    assert.equal(practice().textContent, 'ready');
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
    global.window = previous.window;
    global.document = previous.document;
    global.IS_REACT_ACT_ENVIRONMENT = previous.act;
  }
});
