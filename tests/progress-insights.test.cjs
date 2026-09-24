const {test}=require('node:test'),assert=require('node:assert/strict'),ts=require('typescript'),fs=require('fs');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText,f);
const {progressInsights,periodBounds,progressTrend}=require('../src/lib/progressInsights.ts');
const date=(d,h=10)=>new Date(2026,8,d,h);
const session=(id,d,duration=10,status='completed')=>({id,typeId:'breath',typeName:'Breathing',startTime:date(d),createdAt:date(d),duration,status});

test('matching periods include exactly seven local days and compare through the same clock time',()=>{
 const bounds=periodBounds('7',date(24,12));
 assert.equal(bounds.start.getDate(),18);assert.equal(bounds.start.getHours(),0);
 assert.equal(bounds.previousStart.getDate(),11);assert.equal(bounds.previousEnd.getDate(),17);assert.equal(bounds.previousEnd.getHours(),12);
 const late={...session('late',17),startTime:date(17,13)};
 const stats=progressInsights([session('first',18),session('before',17),late,session('today',24),session('old',10)],'7',date(24,12));
 assert.equal(stats.summary.sessions,2);assert.equal(stats.previous.sessions,1);
 assert.equal(progressTrend(stats.current,'7',date(24,12)).length,7);
});
test('Progress and Home share completed totals; early practice stays separate and source order stays unchanged',()=>{
 const late={...session('late',18,5),createdAt:date(24)};
 const input=[session('old',5),session('early',24,1/3,'abandoned'),session('today',24,20),late,session('future',25),session('invalid',24,NaN)];
 const ids=input.map(s=>s.id); const result=progressInsights([...input,input[2]],'7',date(24));
 assert.equal(result.summary.minutes,25);assert.equal(result.summary.typical,12.5);assert.equal(result.summary.earlyMinutes,1/3);assert.equal(result.summary.earlySessions,1);assert.equal(result.lifetime.totalMinutes,35);assert.equal(result.lifetime.todayMinutes,20);assert.equal(result.types[0].minutes,25);assert.deepEqual(input.map(s=>s.id),ids);
});
test('an old longest streak does not become current; empty period does not hide lifetime streaks',()=>{
 const input=[1,2,3,4,5].map(d=>session(String(d),d));
 const result=progressInsights(input,'7',date(24));
 assert.equal(result.longest,5);assert.equal(result.lifetime.streak,0);assert.equal(result.summary.sessions,0);
 const active=progressInsights([...input,session('yesterday',23),session('today',24)],'7',date(24));
 assert.equal(active.longest,5);assert.equal(active.lifetime.streak,2);
});
test('all-time includes more than 1000 sessions and aggregated bars preserve all minutes',()=>{
 const input=Array.from({length:1100},(_,i)=>({...session(String(i),24,1),startTime:new Date(2023,0,i+1,10)}));
 const result=progressInsights(input,'all',date(24));
 assert.equal(result.summary.sessions,1100);assert.equal(result.previous.minutes,0);
 const bars=progressTrend(result.current,'all',date(24));assert.ok(bars.length<=12);assert.equal(bars.reduce((s,b)=>s+b.minutes,0),1100);
});
test('90-day grouping preserves fractional minutes and empty charts are valid',()=>{
 const result=progressInsights([session('one',24,1/3),session('two',23,2/3)],'90',date(24));
 const bars=progressTrend(result.current,'90',date(24));assert.equal(bars.length,13);assert.equal(bars.reduce((s,b)=>s+b.minutes,0),1);
 assert.equal(progressTrend([],'all',date(24)).length,1);
});
test('calendar comparisons and streaks survive DST and month boundaries',()=>{
 const old=process.env.TZ||Intl.DateTimeFormat().resolvedOptions().timeZone;process.env.TZ='America/New_York';
 try {const now=new Date(2026,2,10,12);const input=[7,8,9].map(d=>({...session(String(d),d),startTime:new Date(2026,2,d,10)}));const result=progressInsights(input,'7',now);assert.equal(result.longest,3);assert.equal(result.lifetime.streak,3);assert.equal(progressTrend(result.current,'7',now).length,7);assert.equal(periodBounds('7',now).previousEnd.getHours(),12);}
 finally {process.env.TZ=old;}
});
