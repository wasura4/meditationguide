const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (m, file) => m._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText, file);
const { eventTiming, qualifiesForEvent } = require('../src/lib/eventTiming.ts');
const event = { isActive: true, startDate: new Date('2026-09-24T00:00:00+05:30'), endDate: new Date('2026-10-01T00:00:00+05:30') };
test('timeline uses elapsed time instead of rounded days', () => {
  const timing = eventTiming(event, new Date('2026-09-24T18:32:00+05:30'));
  assert.equal(Math.floor(timing.elapsedPercent), 11);
  assert.equal(timing.daysRemaining, 7);
  assert.equal(timing.active, true);
});
test('short events have finite progress; invalid windows are unavailable', () => {
  const short = { ...event, startDate: new Date(0), endDate: new Date(3600000) };
  assert.equal(eventTiming(short, new Date(1800000)).elapsedPercent, 50);
  for (const endDate of [new Date(0), new Date(-1), new Date(NaN)]) {
    const timing = eventTiming({ ...short, endDate });
    assert.equal(timing.active, false);
    assert.equal(timing.elapsedPercent, 0);
  }
});
test('credit uses session time and rejects disabled, future and expired events', () => {
  const start = event.startDate.getTime(), end = event.endDate.getTime();
  assert.equal(qualifiesForEvent(event, start, start + 60000), true);
  assert.equal(qualifiesForEvent({ ...event, isActive: false }, start, start + 60000), false);
  assert.equal(qualifiesForEvent(event, start - 1, start + 60000), false);
  assert.equal(qualifiesForEvent(event, end, end + 60000), false);
  assert.equal(qualifiesForEvent(event, start, start - 1), false);
});
