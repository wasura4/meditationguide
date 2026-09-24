const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const ts = require('typescript'), React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');

test('event practice overrides saved preference, permits changes, and never silently substitutes a missing type', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const previous = { window: global.window, document: global.document, storage: global.localStorage, act: global.IS_REACT_ACT_ENVIRONMENT };
  global.window = dom.window; global.document = dom.window.document; global.localStorage = dom.window.localStorage; global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.setItem('nirvanaya.practice.preferences', JSON.stringify({ type: 'breath', settling: 0 }));
  const types = [{ id: 'breath', name: 'ආනාපානසති භාවනාව' }, { id: 'walk', name: 'සක්මන් භාවනාව' }];
  let recommendation = 'සක්මන් භාවනාව', recommendationId, fail = false, started;
  const filename = path.resolve('src/components/meditation/MeditationSetup.tsx');
  const loaded = new Module(filename, module); loaded.filename = filename; loaded.paths = module.paths;
  loaded.require = name => {
    if (name === '@/constants') return { TIMER_SETTINGS: { minDuration: 1, maxDuration: 120 } };
    if (name === '@/lib/meditationTypeService') return { MeditationTypeService: { getActiveTypes: async () => types } };
    if (name === '@/lib/meditationCategoryService') return { MeditationCategoryService: { getActiveCategories: async () => [] } };
    if (name === '@/lib/eventService') return { EventService: { getEvent: async () => { if (fail) throw new Error('offline'); return { meditationType: recommendation, meditationTypeId: recommendationId }; } } };
    if (name === '@/contexts/LanguageContext') return { useLanguage: () => ({ t: key => key }) };
    if (name === '@/lib/appPreferences') return { readPracticePreferences: () => ({ defaultDuration: 15 }), savePracticePreferences() {} };
    if (name === '@/lib/audioUtils') return { prepareBellSound() {}, playBellSound() {} };
    if (name === './PracticeNotificationNotice') return { PracticeNotificationNotice: () => null };
    return require(name);
  };
  loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
  const root = createRoot(document.getElementById('root'));
  let key = 0;
  const render = eventId => React.act(async () => root.render(React.createElement(loaded.exports.MeditationSetup, { key: ++key, eventId, onCancel() {}, onStart: (...args) => { started = args; } })));
  const summary = () => document.querySelector('summary').textContent;
  const begin = () => [...document.querySelectorAll('button')].find(button => button.textContent === 'practice.begin');
  try {
    await render('walking-event');
    assert.match(summary(), /සක්මන් භාවනාව/);
    await React.act(async () => begin().click());
    assert.equal(started[0], 'walk'); assert.equal(started[2], 'සක්මන් භාවනාව');
    const breath = [...document.querySelectorAll('button[aria-pressed]')].find(button => button.textContent.includes(types[0].name));
    await React.act(async () => breath.click());
    assert.match(summary(), /ආනාපානසති භාවනාව/);
    localStorage.setItem('nirvanaya.practice.preferences', JSON.stringify({ type: 'breath' }));
    await render(undefined);
    assert.match(summary(), /ආනාපානසති භාවනාව/);
    recommendation = 'walk'; await render('event-by-id');
    assert.match(summary(), /සක්මන් භාවනාව/);
    recommendation = 'Old walking practice name'; recommendationId = 'walk';
    await render('event-with-stable-id');
    assert.match(summary(), /සක්මන් භාවනාව/, 'renames must not break the stored link');
    recommendationId = 'deleted'; recommendation = types[0].name;
    await render('deleted-type');
    assert.equal(begin().disabled, true, 'a deleted ID must not silently match another type by name');
    recommendationId = undefined;
    recommendation = 'missing practice'; await render('unmatched-event');
    assert.equal(begin().disabled, true);
    assert.match(document.body.textContent, /eventInvite.practiceUnavailable/);
    fail = true; await render('offline-event');
    assert.match(document.body.textContent, /interface.practice_error/);
    assert.equal(begin(), undefined);
  } finally {
    await React.act(async () => root.unmount()); dom.window.close();
    global.window = previous.window; global.document = previous.document; global.localStorage = previous.storage; global.IS_REACT_ACT_ENVIRONMENT = previous.act;
  }
});
