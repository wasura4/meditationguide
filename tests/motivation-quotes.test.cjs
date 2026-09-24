const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText, f);
const { currentQuote, nextQuoteDelay, QUOTE_INTERVAL_MS: interval } = require('../src/lib/motivationQuotes.ts');
const rows = [{ id: 'b', order: 2, status: 'published' }, { id: 'draft', order: 0, status: 'draft' }, { id: 'a', order: 1, status: 'published' }, { id: 'old', order: 0, status: 'archived' }];
test('quotes hold for four hours, advance at the boundary and loop', () => {
  assert.equal(currentQuote(rows, 0).id, 'a');
  assert.equal(currentQuote(rows, interval - 1).id, 'a');
  assert.equal(currentQuote(rows, interval).id, 'b');
  assert.equal(currentQuote(rows, interval * 2).id, 'a');
  assert.equal(nextQuoteDelay(interval - 1), 1);
  assert.equal(nextQuoteDelay(interval), interval);
});
test('rotation survives reloads, skipped slots and time zone changes', () => {
  const time = Date.parse('2026-09-24T04:00:00Z');
  assert.equal(currentQuote(rows, time).id, currentQuote([...rows].reverse(), time).id);
  assert.equal(currentQuote(rows, time).id, currentQuote(rows, Date.parse('2026-09-24T09:30:00+05:30')).id);
  assert.equal(currentQuote(rows, time + 3 * interval).id, currentQuote(rows, time + interval).id);
});
test('empty, single, unpublished and equal-order collections behave deterministically', () => {
  assert.equal(currentQuote([], 0), undefined);
  assert.equal(currentQuote(rows.filter(q => q.status !== 'published'), 0), undefined);
  assert.equal(currentQuote([rows[0]], interval * 99).id, 'b');
  assert.equal(currentQuote(rows.map(q => ({ ...q, order: 1 })), 0).id, 'a');
  assert.equal(rows[0].id, 'b');
});
