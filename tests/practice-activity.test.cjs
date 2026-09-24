const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText, filename);
const { practiceWindowStart, summarizePractice } = require('../src/lib/practiceActivity.ts');
const now = new Date(2026, 8, 24, 12);
const session = (id, date, duration = 10, status = 'completed') => ({ id, createdAt: date, duration, status });

test('activity counts only completed sessions inside seven local calendar days', () => {
  const first = session('first', new Date(2026, 8, 18));
  const result = summarizePractice([
    first, first, session('today', new Date(2026, 8, 24, 8), 15),
    session('today2', new Date(2026, 8, 24, 9), 5),
    session('old', new Date(2026, 8, 17, 23, 59)),
    session('future', new Date(2026, 8, 24, 13)),
    session('abandoned', now, 10, 'abandoned'),
    session('active', now, 10, 'active'), session('paused', now, 10, 'paused'),
    session('invalid', now, NaN), session('negative', now, -1),
  ], now);
  assert.equal(result.activeDays, 2);
  assert.equal(result.totalMinutes, 30);
  assert.equal(result.todayMinutes, 20);
  assert.equal(result.totalSessions, 3);
  assert.equal(result.days.length, 7);
  assert.equal(result.days[6].sessions, 2);
});

test('empty activity is zero and local midnight rolls the window across month boundaries', () => {
  const nextMonth = new Date(2026, 9, 1);
  assert.deepEqual(practiceWindowStart(nextMonth), new Date(2026, 8, 25));
  const result = summarizePractice([], nextMonth);
  assert.equal(result.activeDays, 0);
  assert.equal(result.totalMinutes, 0);
  assert.equal(result.todayMinutes, 0);
  assert.equal(result.totalSessions, 0);
  assert.equal(result.days[6].date.getDate(), 1);
});

test('day buckets follow calendar dates across a daylight-saving transition', () => {
  const previous = process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone;
  process.env.TZ = 'America/New_York';
  try {
    const end = new Date(2026, 2, 10, 12);
    const result = summarizePractice([
      session('before', new Date(2026, 2, 7, 23, 59)),
      session('after', new Date(2026, 2, 8, 3, 1)),
    ], end);
    assert.deepEqual(result.days.map(day => day.date.getDate()), [4, 5, 6, 7, 8, 9, 10]);
    assert.equal(result.activeDays, 2);
  } finally {
    process.env.TZ = previous;
  }
});
