const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText, filename);
const { EMPTY_LOGBOOK_FILTERS, filterLogbook, validDateRange, parseLocalDate, localDateKey, logbookSummary } = require('../src/lib/logbook.ts');
const now = new Date(2026,8,24,12);
const session = (id,createdAt,updates={}) => ({id,createdAt,typeId:'breath',typeName:'Breathing',status:'completed',duration:10,...updates});
const filters = updates => ({...EMPTY_LOGBOOK_FILTERS,...updates});

test('seven-day range includes exactly seven local days, excluding tomorrow and the eighth day', () => {
  const result = filterLogbook([
    session('old',new Date(2026,8,17,23,59)), session('first',new Date(2026,8,18)),
    session('today',new Date(2026,8,24,23,59,59)), session('tomorrow',new Date(2026,8,25)),
  ],filters({period:'7'}),now);
  assert.deepEqual(result.map(item => item.id),['today','first']);
});

test('custom dates are local and include the final day across DST', () => {
  const previous = process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone;
  process.env.TZ = 'America/New_York';
  try {
    const chosen = filters({period:'custom',from:'2026-03-08',to:'2026-03-08'});
    assert.equal(localDateKey(parseLocalDate(chosen.from)),chosen.from);
    const result = filterLogbook([
      session('before',new Date(2026,2,7,23,59)),session('midnight',new Date(2026,2,8)),
      session('late',new Date(2026,2,8,23,59)),session('after',new Date(2026,2,9)),
    ],chosen,now);
    assert.deepEqual(result.map(item => item.id),['late','midnight']);
  } finally { process.env.TZ = previous; }
});

test('incomplete, impossible and reversed date ranges return validation errors, not all history', () => {
  for (const [from,to] of [['',''],['2026-02-30','2026-03-01'],['2026-09-25','2026-09-24']]) {
    const chosen = filters({period:'custom',from,to});
    assert.equal(validDateRange(chosen),false);
    assert.equal(filterLogbook([session('one',now)],chosen,now).length,0);
  }
});

test('search covers reflections and tags and composes with type/status/mood/rating filters', () => {
  const entries = [
    session('match',now,{notes:'Noticed CALM',mood:'good',rating:4}),
    session('other',now,{notes:'calm',status:'abandoned',mood:'good',rating:4}),
    session('tag',now,{tags:['steady']}),
  ];
  assert.deepEqual(filterLogbook(entries,filters({search:' calm ',type:'breath',status:'completed',mood:'good',rating:'4'}),now).map(item => item.id),['match']);
  assert.deepEqual(filterLogbook(entries,filters({search:'steady'}),now).map(item => item.id),['tag']);
  assert.equal(filterLogbook(entries,filters({search:'   '}),now).length,3);
});

test('summary counts completed practice days once and excludes early/invalid sessions', () => {
  const entries = [session('a',now),session('b',now,{duration:5}),session('c',new Date(2026,8,23)),
    session('early',now,{status:'abandoned',duration:30}),session('invalid',now,{duration:NaN})];
  assert.deepEqual(logbookSummary(entries),{completed:3,minutes:25,days:2});
  assert.deepEqual(logbookSummary([]),{completed:0,minutes:0,days:0});
});
