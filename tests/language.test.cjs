const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, filename);
const { translate, isLanguage } = require('../src/i18n/runtime.ts');
test('Sinhala is available without Firebase, and switching has no asynchronous dependency', () => {
  assert.equal(translate('si', 'common.retry'), 'නැවත උත්සාහ කරන්න');
  assert.equal(translate('en', 'common.retry'), 'Retry');
  assert.equal(translate('si', 'common.retry'), 'නැවත උත්සාහ කරන්න');
});
test('an incomplete or blank remote dictionary retains bundled Sinhala', () => {
  assert.equal(translate('si', 'common.retry', {}, { 'common.retry': ' ' }), 'නැවත උත්සාහ කරන්න');
});
test('interpolation preserves zero and rejects incompatible remote placeholders', () => {
  assert.equal(translate('en', 'mypath.stage_info', { current: 0, total: 7 }), 'Stage 0 of 7');
  assert.equal(translate('si', 'mypath.stage_info', { current: 0, total: 7 }, { 'mypath.stage_info': 'wrong {count}' }), 'අදියර 7න් 0');
});
test('only supported language preferences are accepted', () => {
  for (const invalid of [undefined, null, '', 'de', 'SI', '__proto__']) assert.equal(isLanguage(invalid), false);
  assert.equal(isLanguage('si'), true);
  assert.equal(isLanguage('en'), true);
});
