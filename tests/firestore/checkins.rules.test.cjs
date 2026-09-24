const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText,f);
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,getDocs,collection,query,where,updateDoc,deleteDoc,serverTimestamp,Timestamp}=require('firebase/firestore');
const {saveCheckin,saveCheckinQuestion}=require('../../src/lib/checkinTransactions.ts');
const {checkinDay}=require('../../src/lib/checkins.ts');
let env;const db=uid=>env.authenticatedContext(uid).firestore();
const question={titleEn:'Did you observe Sil today?',titleSi:'ඔබ අද සීලය රැක්කාද?',order:1,status:'active'};
before(async()=>{
 env=await initializeTestEnvironment({projectId:'demo-checkins',firestore:{host:'127.0.0.1',port:8185,rules:fs.readFileSync('firestore.rules','utf8')}});await env.clearFirestore();
 await env.withSecurityRulesDisabled(async ctx=>{
  for(const [uid,permissions] of [['editor',[{resource:'content',actions:['read','create','update']}]],['reader',[{resource:'content',actions:['read']}]],['analyst',[{resource:'analytics',actions:['read']}]]])
   await setDoc(doc(ctx.firestore(),'admin_users',uid),{isActive:true,role:'admin',permissions});
  await setDoc(doc(ctx.firestore(),'admin_users','super'),{isActive:true,role:'super_admin'});
 });
});
after(async()=>await env?.cleanup());
async function createQuestion(status='active') {
 await saveCheckinQuestion(db('editor'),'editor',{...question,status});
 const docs=await getDocs(collection(db('editor'),'daily_checkin_questions'));
 return docs.docs.map(d=>({...d.data(),id:d.id})).find(d=>d.status===status && d.version===1);
}
test('content permissions control create/edit/archive and deny hard deletion',async()=>{
 await assertFails(saveCheckinQuestion(db('owner'),'owner',question));
 await assertFails(saveCheckinQuestion(db('reader'),'reader',question));
 const q=await createQuestion();
 await assertSucceeds(saveCheckinQuestion(db('editor'),'editor',{...question,status:'archived'},q));
 await assert.rejects(saveCheckinQuestion(db('editor'),'editor',question,q), /conflict/);
 await assertFails(deleteDoc(doc(db('editor'),'daily_checkin_questions',q.id)));
 await assertFails(getDoc(doc(db('owner'),'daily_checkin_questions',q.id)));
 await assertFails(saveCheckinQuestion(db('editor'),'editor',{...question,titleEn:''}));
});
test('concurrent retries create one daily answer; No is valid; same-day edit preserves snapshot',async()=>{
 const q=await createQuestion(),day=checkinDay().day,d=db('owner');
 await Promise.all([saveCheckin(d,'owner',q.id,false,day),saveCheckin(d,'owner',q.id,false,day)]);
 const ref=doc(d,'users','owner','daily_checkins',`${day}_${q.id}`);
 const original=(await getDoc(ref)).data();assert.equal(original.answer,false);
 await saveCheckinQuestion(db('editor'),'editor',{...question,titleEn:'Reworded question'},q);
 await saveCheckin(d,'owner',q.id,true,day);
 const edited=(await getDoc(ref)).data();assert.equal(edited.answer,true);assert.equal(edited.titleEn,question.titleEn);assert.equal(edited.questionVersion,1);assert.equal(edited.createdAt.toMillis(),original.createdAt.toMillis());
 const history=await getDocs(query(collection(d,'users','owner','daily_checkins'),where('day','>=',day),where('day','<=',day)));assert.equal(history.size,1);
 await assertFails(updateDoc(ref,{titleEn:'Tampered'}));
 await assertFails(updateDoc(ref,{answer:'yes'}));
 for(const uid of ['other','editor','analyst','super']) await assertFails(getDoc(doc(db(uid),'users','owner','daily_checkins',`${day}_${q.id}`)));
 await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'users','owner','daily_checkins',`${day}_${q.id}`)));
 await assertFails(saveCheckin(db('other'),'owner',q.id,true,day));
 await assertSucceeds(deleteDoc(ref));
});
test('draft questions, past dates, forged boundaries, document IDs and extra fields are rejected',async()=>{
 const draft=await createQuestion('draft'),day=checkinDay(),d=db('owner');
 await assert.rejects(saveCheckin(d,'owner',draft.id,true,day.day));
 const q=await createQuestion();await saveCheckin(d,'owner',q.id,true,day.day);
 const ref=doc(d,'users','owner','daily_checkins',`${day.day}_${q.id}`),data=(await getDoc(ref)).data();
 await deleteDoc(ref);
 const fresh={...data,createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
 for(const change of [{day:'2001-01-01'},{answer:1},{titleEn:'Forged'},{questionVersion:99},{extra:'secret'},{startOffset:9999},{dayStart:Timestamp.fromMillis(day.start.getTime()-60000)}]) await assertFails(setDoc(ref,{...fresh,...change}));
 await assertFails(setDoc(doc(d,'users','owner','daily_checkins','wrong-id'),fresh));
 await assert.rejects(saveCheckin(d,'owner',q.id,true,'2001-01-01'));
 await env.withSecurityRulesDisabled(async ctx=>setDoc(doc(ctx.firestore(),'users','owner','daily_checkins','past'),{...data,dayStart:Timestamp.fromMillis(Date.now()-172800000),dayEnd:Timestamp.fromMillis(Date.now()-86400000)}));
 await assertFails(updateDoc(doc(d,'users','owner','daily_checkins','past'),{answer:false,updatedAt:serverTimestamp()}));
 await assertSucceeds(deleteDoc(doc(d,'users','owner','daily_checkins','past')));
});
test('archiving a question preserves its private history and allows today’s answer to be revised',async()=>{
 const q=await createQuestion(),day=checkinDay().day,d=db('archive-owner');
 await saveCheckin(d,'archive-owner',q.id,true,day);
 await saveCheckinQuestion(db('editor'),'editor',{...question,status:'archived'},q);
 await saveCheckin(d,'archive-owner',q.id,false,day);
 assert.equal((await getDoc(doc(d,'users','archive-owner','daily_checkins',`${day}_${q.id}`))).data().answer,false);
 await assert.rejects(saveCheckin(db('new-owner'),'new-owner',q.id,true,day));
});
test('a new answer cannot silently accept wording edited after the user read it',async()=>{
 const q=await createQuestion(),day=checkinDay().day;
 await saveCheckinQuestion(db('editor'),'editor',{...question,titleEn:'Updated wording'},q);
 await assert.rejects(saveCheckin(db('fresh-owner'),'fresh-owner',q.id,true,day,q.version),/question-changed/);
 await assertSucceeds(saveCheckin(db('fresh-owner'),'fresh-owner',q.id,true,day,q.version+1));
});
