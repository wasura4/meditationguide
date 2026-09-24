const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const ts = require('typescript'), React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');

test('event editor saves the selected practice ID and display name', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/admin/events' });
  const previous = { window: global.window, document: global.document, form: global.FormData, act: global.IS_REACT_ACT_ENVIRONMENT };
  global.window = dom.window; global.document = dom.window.document; global.FormData = dom.window.FormData; global.IS_REACT_ACT_ENVIRONMENT = true;
  let saved;
  const showToast = () => {};
  const filename = path.resolve('src/app/admin/events/page.tsx');
  const loaded = new Module(filename, module); loaded.filename = filename; loaded.paths = module.paths;
  loaded.require = name => {
    if (name === '@/components/admin/AdminProtectedRoute') return { AdminProtectedRoute: ({ children }) => children };
    if (name === '@/components/admin/AdminLayout') return { AdminLayout: ({ children }) => children };
    if (name === '@/components/ui/button') return { Button: ({ children, variant, size, ...props }) => React.createElement('button', props, children) };
    if (name === '@/contexts/AdminAuthContext') return { useAdminAuth: () => ({ adminUser: { id: 'admin' }, hasPermission: () => true }) };
    if (name === '@/components/ui/toast') return { useToast: () => ({ showToast }) };
    if (name === '@/lib/meditationTypeService') return { MeditationTypeService: { getActiveTypes: async () => [{ id: 'walk', name: 'සක්මන් භාවනාව' }] } };
    if (name === '@/lib/eventService') return { EventService: { getAllEvents: async () => [], createEvent: async value => { saved = value; } } };
    return require(name);
  };
  loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
  const root = createRoot(document.getElementById('root'));
  try {
    await React.act(async () => root.render(React.createElement(loaded.exports.default)));
    const create = [...document.querySelectorAll('button')].find(button => /Create Event/.test(button.textContent));
    assert.ok(create);
    await React.act(async () => create.click());
    const form = document.querySelector('form');
    assert.ok(form);
    const select = form.querySelector('select[name="meditationTypeId"]');
    assert.ok(select);
    assert.equal(select.disabled, false);
    assert.match(select.textContent, /සක්මන් භාවනාව/);
    select.value = 'walk';
    for (const [name, value] of Object.entries({ title: 'Walking week', description: 'Practice together', startDate: '2026-09-24', endDate: '2026-10-01' })) form.elements.namedItem(name).value = value;
    await React.act(async () => form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })));
    assert.equal(saved.meditationTypeId, 'walk');
    assert.equal(saved.meditationType, 'සක්මන් භාවනාව');
  } finally {
    await React.act(async () => root.unmount()); dom.window.close();
    global.window = previous.window; global.document = previous.document; global.FormData = previous.form; global.IS_REACT_ACT_ENVIRONMENT = previous.act;
  }
});
