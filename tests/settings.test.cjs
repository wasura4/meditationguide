const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText, filename);
const { parsePracticePreferences } = require('../src/lib/appPreferences.ts');
const { csvCell, sessionsCSV, hasRecentSignIn, runAccountDeletion } = require('../src/lib/settingsData.ts');

test('preferences recover from malformed data and reject invalid timer durations', () => {
  for (const raw of [null, 'bad json', 'null', '[]', '{"defaultDuration":0}', '{"defaultDuration":121}', '{"defaultDuration":3.5}', '{"defaultDuration":"30"}']) {
    assert.equal(parsePracticePreferences(raw).defaultDuration, 15);
  }
  assert.deepEqual(parsePracticePreferences('{"defaultDuration":30,"timeFormat":"24h"}'), { defaultDuration:30, timeFormat:'24h' });
  assert.equal(parsePracticePreferences('{"timeFormat":"bad"}').timeFormat, '12h');
});

test('CSV quotes every field, preserves Sinhala and neutralizes spreadsheet formulas', () => {
  assert.equal(csvCell('A, "B"\nC'), '"A, ""B""\nC"');
  assert.equal(csvCell('=1+1'), '"\'=1+1"');
  assert.equal(csvCell('  @SUM(1,1)'), '"\'  @SUM(1,1)"');
  assert.equal(csvCell('\t=1+1'), '"\'\t=1+1"');
  const now = new Date('2026-09-24T08:00:00Z');
  const csv = sessionsCSV([{createdAt:now,startTime:now,typeName:'භාවනා, "calm"',duration:10,status:'completed',notes:'=1+1'}]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"භාවනා, ""calm"""'));
  assert.ok(csv.includes('"\'=1+1"'));
  assert.ok(csv.includes(now.toISOString()));
});

test('recent-sign-in guard rejects stale, missing, and future authentication times', () => {
  const now = 1_800_000_000_000;
  assert.equal(hasRecentSignIn(now / 1000 - 60, now), true);
  for (const value of [undefined, '1800000000', NaN, now / 1000 - 300, now / 1000 + 1]) assert.equal(hasRecentSignIn(value, now), false);
});

test('a failed deletion preflight cannot delete any records', async () => {
  const calls = [];
  await assert.rejects(runAccountDeletion({
    verify: async () => { calls.push('verify'); throw new Error('recent-login'); },
    removeSessions: async () => calls.push('sessions'),
    removeProfile: async () => calls.push('profile'),
    removeAuth: async () => calls.push('auth'),
  }));
  assert.deepEqual(calls, ['verify']);
});

test('failed data cleanup stops before authentication deletion', async () => {
  const calls = [];
  await assert.rejects(runAccountDeletion({
    verify: async () => calls.push('verify'),
    removeSessions: async () => { calls.push('sessions'); throw new Error('offline'); },
    removeProfile: async () => calls.push('profile'),
    removeAuth: async () => calls.push('auth'),
  }));
  assert.deepEqual(calls, ['verify', 'sessions']);
});
