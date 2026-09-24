const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText,f);
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,getDocs,updateDoc,deleteDoc,collection,query,where,orderBy,documentId,limit,serverTimestamp,Timestamp,deleteField}=require('firebase/firestore');
const {saveTeacher,saveLearningPath,setLearningCompletion}=require('../../src/lib/learningTransactions.ts');
const {blankTeacher,blankLearningPath,pathFields}=require('../../src/lib/learning.ts');
let env;const db=uid=>env.authenticatedContext(uid).firestore();
const teacher={...blankTeacher,name:'Teacher',bio:'Verified biography',status:'published'};
const lesson=(i)=>({id:`article_${i}`,kind:'article',contentId:String(i)});
const fields={...blankLearningPath,title:'Path',description:'Introduction',status:'published',lessons:[lesson(1),lesson(2)]};
const metadata=()=>({version:0,createdBy:'editor',updatedBy:'editor',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-learning',firestore:{host:'127.0.0.1',port:8185,rules:fs.readFileSync('firestore.rules','utf8')}});await env.clearFirestore();await env.withSecurityRulesDisabled(async c=>{const d=c.firestore();await Promise.all([
setDoc(doc(d,'admin_users','editor'),{role:'content_admin',isActive:true,permissions:[{resource:'dhamma',actions:['read']},{resource:'audio',actions:[]},{resource:'users',actions:[]},{resource:'analytics',actions:[]},{resource:'settings',actions:[]},{resource:'content',actions:['read','create','update']}]}),
setDoc(doc(d,'admin_users','reader'),{role:'moderator',isActive:true,permissions:[{resource:'content',actions:['read']}]}),
setDoc(doc(d,'admin_users','inactive'),{role:'super_admin',isActive:false,permissions:[]}),
setDoc(doc(d,'admin_users','wrong-resource'),{role:'moderator',isActive:true,permissions:[{resource:'audio',actions:['read','create','update']}]}),
...Array.from({length:12},(_,i)=>setDoc(doc(d,'dhamma_posts',String(i+1)),{title:'Article '+(i+1),content:'Teaching',status:'published'})),
setDoc(doc(d,'dhamma_posts','draft'),{title:'Private',content:'Private',status:'draft'}),
setDoc(doc(d,'kamatahan_audio','private'),{title:'Private recording',status:'active',isPublic:false}),
setDoc(doc(d,'teachers','published'),{...teacher,...metadata()}),
setDoc(doc(d,'teachers','draft'),{...teacher,...metadata(),status:'draft'}),
...['progress','race','archive'].map(id=>setDoc(doc(d,'learning_paths',id),{...pathFields(fields),...metadata()})),
setDoc(doc(d,'learning_paths','draft'),{...pathFields(fields),...metadata(),status:'draft'})
]);});});
after(async()=>{await env?.cleanup();});

test('learning libraries allow published member queries and authorized drafts, with anonymous and cross-resource access denied',async()=>{
 for(const name of ['teachers','learning_paths']){
  const published=query(collection(db('member'),name),where('status','==','published'),orderBy(documentId()),limit(20));
  assert.ok((await assertSucceeds(getDocs(published))).size>0);
  await assertFails(getDocs(collection(db('member'),name)));
  await assertFails(getDoc(doc(db('member'),name,'draft')));
  await assertFails(getDocs(query(collection(env.unauthenticatedContext().firestore(),name),where('status','==','published'))));
  await assertSucceeds(getDocs(collection(db('reader'),name)));
  await assertFails(getDocs(collection(db('inactive'),name)));
  await assertFails(getDocs(collection(db('wrong-resource'),name)));
 }
 for(const uid of ['member','reader','inactive','wrong-resource'])await assertFails(saveTeacher(db(uid),teacher,uid));
});
test('teacher saves enforce valid schemas, attribution and versions on creation and update',async()=>{
 const store=db('editor'),id=await saveTeacher(store,teacher,'editor'),ref=doc(store,'teachers',id);
 for(const bad of [{name:''},{name:12},{bio:'x'.repeat(5001)},{bio:''},{nameEn:deleteField()},{isAdmin:true},{createdBy:'other'},{createdAt:Timestamp.fromMillis(1)},{updatedBy:'other'},{updatedAt:Timestamp.fromMillis(1)},{status:'invalid'},{version:-1}]){
  await assertFails(updateDoc(ref,{version:1,updatedAt:serverTimestamp(),...bad}));
 }
 for(const bad of [{name:22},{bio:'x'.repeat(5001)},{createdBy:'other'},{createdAt:Timestamp.fromMillis(1)},{unexpected:true},{version:1},{nameEn:undefined}]){
  const values={...teacher,...metadata(),...bad};if(values.nameEn===undefined)delete values.nameEn;
  await assertFails(setDoc(doc(collection(store,'teachers')),values));
 }
 await saveTeacher(store,{...teacher,status:'archived'},'editor',id,0);
 await assert.rejects(saveTeacher(store,teacher,'editor',id,0),/changed after you opened/);
 await assertFails(getDoc(doc(db('member'),'teachers',id)));
 await saveTeacher(store,{...teacher,status:'draft'},'editor',id,1);
 assert.equal((await getDoc(ref)).data().createdBy,'editor');
 await assertFails(deleteDoc(ref));
});
test('path publication checks references, and the maximum-size valid path fits the rules evaluation budget',async()=>{
 const store=db('editor');
 await assert.rejects(saveLearningPath(store,{...fields,teacherId:'draft'},'editor'),/Publish the selected teacher/);
 await assert.rejects(saveLearningPath(store,{...fields,lessons:[lesson('draft')]},'editor'),/Every lesson/);
 await assert.rejects(saveLearningPath(store,{...fields,lessons:[lesson('missing')]},'editor'));
 await assert.rejects(saveLearningPath(store,{...fields,lessons:[{id:'audio_private',kind:'audio',contentId:'private'}]},'editor'),/Every lesson/);
 const id=await assertSucceeds(saveLearningPath(store,{...fields,teacherId:'published',lessons:Array.from({length:12},(_,i)=>lesson(i+1))},'editor'));
 assert.equal((await getDoc(doc(store,'learning_paths',id))).data().lessonIds.length,12);
 await assertSucceeds(saveLearningPath(store,{...fields,teacherId:'published',lessons:Array.from({length:12},(_,i)=>lesson(12-i))},'editor',id,0));
 const reference=doc(store,'learning_paths',id);
 for(const bad of [{lessonIds:Array.from({length:13},(_,i)=>lesson(i).id)},{lessonIds:['article_1','article_1']},{lessons:[lesson(1)]},{lessonIds:['video_1']},{lessonIds:['article_../private']},{lessonIds:[42]},{titleEn:deleteField()},{teacherId:'../private'},{description:'x'.repeat(3001)},{level:'expert'},{lessonIds:[]}])await assertFails(updateDoc(reference,{version:2,updatedAt:serverTimestamp(),...bad}));
 await assertFails(deleteDoc(reference));
});
test('private completion validates identity and current lessons, merges racing changes and survives reordering',async()=>{
 const store=db('member'),ref=doc(store,'users','member','learning_progress','progress');
 await assertSucceeds(setLearningCompletion(store,'member','progress','article_1',true));
 for(const visitor of [db('other'),db('editor'),env.unauthenticatedContext().firestore()]){await assertFails(getDoc(doc(visitor,'users','member','learning_progress','progress')));await assertFails(setDoc(doc(visitor,'users','member','learning_progress','progress'),{completedIds:[],updatedAt:serverTimestamp()}));}
 for(const bad of [{completedIds:['article_1','article_1']},{completedIds:['article_missing']},{completedIds:[12]},{updatedAt:Timestamp.fromMillis(1)},{extra:true},{completedIds:deleteField()}])await assertFails(updateDoc(ref,{updatedAt:serverTimestamp(),...bad}));
 await Promise.all([setLearningCompletion(store,'member','race','article_1',true),setLearningCompletion(store,'member','race','article_2',true)]);
 const race=doc(store,'users','member','learning_progress','race');
 assert.deepEqual(new Set((await getDoc(race)).data().completedIds),new Set(['article_1','article_2']));
 await saveLearningPath(db('editor'),{...fields,lessons:[lesson(2),lesson(1)]},'editor','race',0);
 assert.equal((await getDoc(race)).data().completedIds.length,2);
 await saveLearningPath(db('editor'),{...fields,lessons:[lesson(2),lesson(3)]},'editor','race',1);
 await setLearningCompletion(store,'member','race','article_3',true);
 assert.deepEqual(new Set((await getDoc(race)).data().completedIds),new Set(['article_2','article_3']));
 await setLearningCompletion(store,'member','progress','article_1',false);
 assert.deepEqual((await getDoc(ref)).data().completedIds,[]);
 await assertSucceeds(getDocs(collection(store,'users','member','learning_progress')));
 await assertSucceeds(deleteDoc(ref));
});
test('archived paths reject new completion but preserve private access and owner cleanup',async()=>{
 const store=db('member');await setLearningCompletion(store,'member','archive','article_1',true);
 await saveLearningPath(db('editor'),{...fields,status:'archived'},'editor','archive',0);
 const ref=doc(store,'users','member','learning_progress','archive');await assertSucceeds(getDoc(ref));
 await assertFails(updateDoc(ref,{completedIds:['article_1','article_2'],updatedAt:serverTimestamp()}));
 await assertFails(setLearningCompletion(store,'member','archive','article_2',true));
 await assertFails(setDoc(doc(store,'users','member','learning_progress','missing'),{completedIds:[],updatedAt:serverTimestamp()}));
 await assertSucceeds(deleteDoc(ref));
});

test('learning path creates reject malformed data and concurrent saves retain one winning version',async()=>{
 const store=db('editor');
 for(const bad of [{title:12},{title:'x'.repeat(181)},{descriptionEn:'x'.repeat(3001)},{lessonIds:['article_1','article_1']},{lessonIds:['audio_../bad']},{lessonIds:[false]},{teacherId:42},{createdBy:'forged'},{createdAt:Timestamp.fromMillis(1)},{extra:'pollution'}])await assertFails(setDoc(doc(collection(store,'learning_paths')),{...pathFields(fields),...metadata(),...bad}));
 const id=await saveLearningPath(store,fields,'editor');
 const outcomes=await Promise.allSettled([saveLearningPath(store,{...fields,title:'First'},'editor',id,0),saveLearningPath(store,{...fields,title:'Second'},'editor',id,0)]);
 assert.equal(outcomes.filter(result=>result.status==='fulfilled').length,1);
 assert.match(outcomes.find(result=>result.status==='rejected').reason.message,/changed after you opened/);
 assert.equal((await getDoc(doc(store,'learning_paths',id))).data().version,1);
});
