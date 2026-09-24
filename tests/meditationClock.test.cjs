const {test}=require('node:test'); const assert=require('node:assert/strict'); const ts=require('typescript'),fs=require('fs');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText,f);
const {createPractice,practiceElapsed,advancePractice,pausePractice,resumePractice,finishPractice,parsePractice,practiceTime}=require('../src/lib/meditationClock.ts');
const start=(minutes=15,settle=0,now=100000)=>createPractice({id:'practice_test',userId:'owner',typeId:'breath',typeName:'Breathing',bell:false},minutes,settle,now);
test('one timestamp clock catches up without ticking; settling is excluded',()=>{
 const c=start(1,5);assert.equal(practiceElapsed(c,102000),0);assert.equal(practiceElapsed(c,112000),7000);
 const done=advancePractice(c,190000);assert.equal(done.phase,'finished');assert.equal(done.elapsedMs,60000);assert.equal(done.endsAt,165000);assert.equal(done.startedAt,105000);
 assert.equal(advancePractice(done,200000),done);
});
test('paused reload freezes elapsed and reconstructs resume references without counting pause',()=>{
 const paused=pausePractice(start(),114000);assert.equal(paused.elapsedMs,14000);
 const restored=parsePractice(JSON.stringify(paused),'owner');assert.equal(practiceElapsed(restored,600000),14000);
 const resumed=resumePractice(restored,600000);assert.equal(practiceElapsed(resumed,607000),21000);
 assert.equal(finishPractice(resumed,607000).elapsedMs,21000);
});
test('completion and early end are distinct and terminal actions are idempotent',()=>{
 const c=start(1);const ended=finishPractice(c,114000);assert.equal(ended.outcome,'abandoned');assert.equal(ended.elapsedMs,14000);
 assert.equal(finishPractice(ended,180000),ended);assert.equal(resumePractice(ended,180000),ended);
 assert.equal(pausePractice(c,161000).outcome,'completed');
});
test('recovery retains user, type, event, bell and crosses midnight; foreign/corrupt records are refused',()=>{
 const c={...start(),eventId:'retreat'};assert.equal(parsePractice(JSON.stringify(c),'other'),null);
 for(const fields of [{version:3},{targetMs:NaN},{elapsedMs:-1},{phase:'unexpected'},{eventId:'bad/path'},{phase:'finished'}])assert.equal(parsePractice(JSON.stringify({...c,...fields}),'owner'),null);
 assert.equal(parsePractice(JSON.stringify(c),'owner').eventId,'retreat');
 assert.equal(advancePractice(c,100000+86400000).elapsedMs,900000);
});
test('duration bounds, exact seconds and display never add a minimum minute',()=>{
 assert.throws(()=>start(0));assert.throws(()=>start(121));assert.throws(()=>start(1,3));
 assert.equal(practiceTime(14000),'00:14');assert.equal(practiceTime(-1),'00:00');assert.equal(practiceTime(7200000),'120:00');
});
