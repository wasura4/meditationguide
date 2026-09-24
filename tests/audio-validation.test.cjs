const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, filename);
const { validateAudioFile, parseAudioDuration, MAX_AUDIO_BYTES } = require('../src/lib/audioValidation.ts');
test('empty, oversized and non-audio files are rejected by the shared picker/drop validator', () => {
  assert.ok(validateAudioFile({ type: 'audio/mpeg', size: 0 }));
  assert.ok(validateAudioFile({ type: 'audio/mpeg', size: MAX_AUDIO_BYTES + 1 }));
  assert.ok(validateAudioFile({ type: 'text/html', size: 1024 }));
  assert.equal(validateAudioFile({ type: 'audio/mpeg', size: MAX_AUDIO_BYTES }), null);
});
test('duration validation prevents NaN, zero and malformed durations from reaching Firestore', () => {
  for (const value of ['', '5', '1:99', '1:2', '-1:00', 'Infinity:00', '0:00']) assert.equal(parseAudioDuration(value), null);
  assert.equal(parseAudioDuration('0:01'), 1);
  assert.equal(parseAudioDuration('120:30'), 7230);
});
