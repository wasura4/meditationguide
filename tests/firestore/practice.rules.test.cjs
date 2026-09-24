const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText,f);
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const {doc,getDoc,getDocs,collection,updateDoc,query,where,setDoc}=require('firebase/firestore');
const {savePractice}=require('../../src/lib/practiceTransactions.ts');
const {createPractice,finishPractice}=require('../../src/lib/meditationClock.ts');
let env;const db=uid=>env.authenticatedContext(uid).firestore();
before(async()=>{
 env=await initializeTestEnvironment({projectId:'demo-practice',firestore:{host:'127.0.0.1',port:8185,rules:fs.readFileSync('firestore.rules','utf8')}});await env.clearFirestore();
 await env.withSecurityRulesDisabled(async context => {
  for (const id of ['retreat','late','short']) await setDoc(doc(context.firestore(),'meditation_events',id),{isActive:true,startDate:new Date(0),endDate:new Date(1000000)});
 });
});
after(async()=>await env?.cleanup());
function result(id,eventId){return finishPractice(createPractice({id,userId:'owner',typeId:'breath',typeName:'Breathing',bell:false,...(eventId?{eventId}:{})},1,0,100000),160000);}
test('concurrent completion retries write one session and one event contribution; retry preserves reflection',async()=>{
 const d=db('owner'),c=result('practice_race','retreat');
 await Promise.all([savePractice(d,c),savePractice(d,c)]);
 const ref=doc(d,'meditation_sessions',c.id);await updateDoc(ref,{notes:'Original reflection'});await savePractice(d,c);
 assert.equal((await getDoc(ref)).data().notes,'Original reflection');
 const event=(await getDoc(doc(d,'event_participation','retreat_owner'))).data();assert.equal(event.sessionCount,1);assert.equal(event.totalMinutes,1);
 assert.equal((await getDocs(query(collection(d,'meditation_sessions'),where('userId','==','owner')))).size,1);
});
test('early end stores fractional minutes, no event credit, and another user cannot read or overwrite it',async()=>{
 const d=db('owner');const c=finishPractice(createPractice({id:'practice_short',userId:'owner',typeId:'breath',typeName:'Breathing',bell:false,eventId:'short'},1,0,100000),114000);
 await savePractice(d,c);const stored=(await getDoc(doc(d,'meditation_sessions',c.id))).data();assert.equal(stored.duration,14/60);assert.equal(stored.status,'abandoned');
 assert.equal((await getDoc(doc(d,'event_participation','short_owner'))).exists(),false);
 await assertFails(getDoc(doc(db('other'),'meditation_sessions',c.id)));await assertFails(savePractice(db('other'),c));
 await assertSucceeds(getDoc(doc(db('other'),'meditation_sessions','practice_missing')));
 await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'meditation_sessions','practice_missing')));
 await assertFails(getDocs(collection(db('other'),'meditation_sessions')));
});

test('a rejected save can be retried by its owner with the same stable result without duplicates',async()=>{
 const d=db('owner'),c=result('practice_offline');
 await assert.rejects(savePractice(db('other'),c));
 await savePractice(d,c);await savePractice(d,c);
 assert.equal((await getDoc(doc(d,'meditation_sessions',c.id))).data().duration,1);
});

test('competing results acknowledge the saved duration, and late sync preserves event time bounds',async()=>{
 const d=db('owner'),c=result('practice_existing','late');
 await savePractice(d,c);
 const acknowledged=await savePractice(d,{...c,elapsedMs:10000,outcome:'abandoned'});
 assert.equal(acknowledged.duration,1);assert.equal(acknowledged.status,'completed');
 const earlier={...result('practice_earlier','late'),startedAt:20000,endsAt:80000};await savePractice(d,earlier);
 const participation=(await getDoc(doc(d,'event_participation','late_owner'))).data();
 assert.equal(participation.firstSessionAt.toMillis(),80000);assert.equal(participation.lastSessionAt.toMillis(),160000);assert.equal(participation.sessionCount,2);
});
