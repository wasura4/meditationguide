const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript'), fs = require('fs');
require.extensions['.ts'] = (m, file) => m._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText, file);
const { summarizeDashboardPractice: summarize, dailyPracticeGoal } = require('../src/lib/dashboardPractice.ts');
const date = day => new Date(2026, 8, day, 10);
const session = (id, day, duration=10, status='completed') => ({id,startTime:date(day),createdAt:date(day),duration,status});

test('dashboard totals exclude unfinished/duplicate/future records and retain fractional minutes',()=>{
 const first=session('one',24,1/3);
 const result=summarize([first,first,session('two',23,15),session('early',24,20,'abandoned'),session('future',25),session('invalid',24,NaN)],date(24));
 assert.equal(result.totalMinutes,15+1/3); assert.equal(result.todayMinutes,1/3); assert.equal(result.practiceDays,2); assert.equal(result.streak,2); assert.equal(result.weekDays,2);
 assert.deepEqual(result.days.map(d=>d.date.getDate()),[21,22,23,24,25,26,27]);
 assert.equal(result.days.filter(d=>d.future).length,3);
});
test('streak spans month boundaries, allows today to remain open and expires after a missed day',()=>{
 const sessions=[session('one',29),session('two',30),session('duplicate-day',30)];
 assert.equal(summarize(sessions,new Date(2026,9,1,12)).streak,2);
 assert.equal(summarize(sessions,new Date(2026,9,2,12)).streak,0);
 assert.equal(summarize([],date(24)).streak,0);
});
test('late sync is attributed to practice date and old history remains in lifetime totals',()=>{
 const old={...session('old',1),createdAt:date(24)};
 const result=summarize([old,session('today',24)],date(24));
 assert.equal(result.totalMinutes,20); assert.equal(result.todayMinutes,10); assert.equal(result.weekDays,1); assert.equal(result.practiceDays,2);
});
test('daily goal defaults safely and rejects invalid saved preferences',()=>{
 for(const value of [undefined,null,0,-1,121,1.5,'30',NaN]) assert.equal(dailyPracticeGoal(value),20);
 assert.equal(dailyPracticeGoal(1),1); assert.equal(dailyPracticeGoal(120),120);
});
test('calendar streaks do not break across daylight saving changes',()=>{
 const previous=process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone;process.env.TZ='America/New_York';
 try { const sessions=[7,8,9].map(day=>({id:String(day),status:'completed',duration:5,startTime:new Date(2026,2,day,10)}));assert.equal(summarize(sessions,new Date(2026,2,10,12)).streak,3); }
 finally { process.env.TZ=previous; }
});
