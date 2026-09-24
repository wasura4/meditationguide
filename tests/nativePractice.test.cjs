const {test}=require('node:test'),assert=require('node:assert/strict'),ts=require('typescript'),fs=require('fs');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText,f);
const {sendPracticeToNative}=require('../src/hooks/useNativeBridge.ts');
const {createPractice,pausePractice,resumePractice}=require('../src/lib/meditationClock.ts');
test('native v2 Android and iOS receive the same deadline, stable identity and silent preference',()=>{
 const clock=resumePractice(pausePractice(createPractice({id:'practice_bridge',userId:'u',typeId:'a',typeName:'Practice',bell:false},1,5,100000),115000),200000);
 let android,ios;assert.equal(sendPracticeToNative(clock,{AndroidInterface:{syncPractice:s=>android=JSON.parse(s)}}),true);
 assert.equal(sendPracticeToNative(clock,{webkit:{messageHandlers:{syncPractice:{postMessage:s=>ios=s}}}}),true);
 assert.deepEqual(android,ios);assert.equal(android.deadlineMs,250000);assert.equal(android.bell,false);assert.equal(android.protocolVersion,2);
});
test('legacy or broken native bridges fall back without calling incompatible methods',()=>{
 const clock=createPractice({id:'practice_bridge',userId:'u',typeId:'a',typeName:'Practice',bell:true},1,0,100000);
 assert.equal(sendPracticeToNative(clock,{}),false);
 assert.equal(sendPracticeToNative(clock,{AndroidInterface:{syncPractice(){throw Error('unavailable');}}}),false);
});
