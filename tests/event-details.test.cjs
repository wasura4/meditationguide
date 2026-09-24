const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const ts = require('typescript'), React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');

test('event details survive statistics failures and distinguish retryable errors from missing events', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/events/test' });
  const previous = { window: global.window, document: global.document, act: global.IS_REACT_ACT_ENVIRONMENT };
  global.window = dom.window; global.document = dom.window.document; global.IS_REACT_ACT_ENVIRONMENT = true;
  let failEvent = false;
  const event = { id: 'test', title: 'Walking week', description: 'First paragraph\n\nSecond paragraph', startDate: new Date(Date.now() - 60000), endDate: new Date(Date.now() + 600000), isActive: true };
  const filename = path.resolve('src/app/events/[id]/page.tsx');
  const loaded = new Module(filename, module); loaded.filename = filename; loaded.paths = module.paths;
  const MotionDiv = ({ children, className }) => React.createElement('div', { className }, children);
  loaded.require = name => {
    if (name === 'next/navigation') return { useParams: () => ({ id: 'test' }), useRouter: () => ({ push() {} }) };
    if (name === '@/contexts/AuthContext') return { useAuth: () => ({ user: { id: 'owner' } }) };
    if (name === '@/components/auth/ProtectedRoute') return { ProtectedRoute: ({ children }) => children };
    if (name === '@/components/ui/button') return { Button: ({ children, size, ...props }) => React.createElement('button', props, children) };
    if (name === 'framer-motion') return { motion: { div: MotionDiv } };
    if (name === '@/lib/eventTiming') {
      const timing = new Module(path.resolve('src/lib/eventTiming.ts'), module);
      timing._compile(ts.transpileModule(fs.readFileSync('src/lib/eventTiming.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, timing.id);
      return timing.exports;
    }
    if (name === '@/lib/eventService') return { EventService: {
      getEvent: async () => { if (failEvent) throw new Error('offline'); return event; },
      getEventStats: async () => { throw new Error('stats offline'); },
      getUserParticipation: async () => null,
    } };
    return require(name);
  };
  loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
  const root = createRoot(document.getElementById('root'));
  const retry = () => [...document.querySelectorAll('button')].find(button => button.textContent === 'Retry').click();
  try {
    await React.act(async () => root.render(React.createElement(loaded.exports.default)));
    assert.match(document.body.textContent, /Walking week/);
    assert.match(document.body.textContent, /Some event statistics could not be loaded/);
    assert.doesNotMatch(document.body.textContent, /Event not found/);
    assert.ok([...document.querySelectorAll('p')].some(p => p.textContent.includes('\n\n') && p.className.includes('whitespace-pre-wrap')));
    failEvent = true;
    await React.act(async () => retry());
    assert.match(document.body.textContent, /Unable to load this event/);
    assert.doesNotMatch(document.body.textContent, /Event not found/);
    failEvent = false; event.isActive = false;
    await React.act(async () => retry());
    assert.match(document.body.textContent, /Walking week/);
    assert.match(document.body.textContent, /Event unavailable/);
    assert.doesNotMatch(document.body.textContent, /Meditate for This Event/);
  } finally {
    await React.act(async () => root.unmount()); dom.window.close();
    global.window = previous.window; global.document = previous.document; global.IS_REACT_ACT_ENVIRONMENT = previous.act;
  }
});
