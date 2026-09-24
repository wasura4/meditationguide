const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText,filename);
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,getDocs,updateDoc,deleteDoc,writeBatch,collection,query,where,orderBy,documentId,limit,startAfter,serverTimestamp,Timestamp}=require('firebase/firestore');
const {saveArticleVersion,saveAudioMetadata}=require('../../src/lib/editorialTransactions.ts');
let env;
const db=uid=>env.authenticatedContext(uid).firestore();
const original={title:'Original teaching',content:'<p>Original</p>',status:'published',authorId:'teacher',publishedAt:Timestamp.fromMillis(1000),createdAt:Timestamp.fromMillis(500)};
before(async()=>{
 env=await initializeTestEnvironment({projectId:'demo-editorial',firestore:{host:'127.0.0.1',port:8185,rules:readFileSync('firestore.rules','utf8')}});
 await env.clearFirestore();
 await env.withSecurityRulesDisabled(async context=>{
  const store=context.firestore();
  await Promise.all([
   setDoc(doc(store,'admin_users','editor'),{role:'content_admin',isActive:true,permissions:[{resource:'dhamma',actions:['read','create','update']},{resource:'audio',actions:['read','create','update']}]}),
   setDoc(doc(store,'admin_users','reader'),{role:'moderator',isActive:true,permissions:[{resource:'dhamma',actions:['read']},{resource:'audio',actions:['read']}]}),
   ...['article','atomic','race'].map(id=>setDoc(doc(store,'dhamma_posts',id),original)),
   setDoc(doc(store,'kamatahan_audio','recording'),{title:'Practice',status:'active',isPublic:true,fileUrl:'https://example.test/retained.mp3'}),
   setDoc(doc(store,'playlists','versioned'),{name:'Ordered',audioIds:['b','a'],userId:'editor',isPublic:true,version:0}),
   setDoc(doc(store,'playlists','personal'),{userId:'member',isPublic:false,audioFiles:[]}),
   ...Array.from({length:25},(_,i)=>setDoc(doc(store,'kamatahan_audio',`page-${String(i).padStart(2,'0')}`),{title:`Recording ${i}`,status:'draft',isPublic:false})),
  ]);
 });
});
after(async()=>{await env?.cleanup();});

test('legacy articles get an exact checkpoint; restore creates a draft and preserves original attribution and publication date',async()=>{
 const store=db('editor');
 await assertSucceeds(saveArticleVersion(store,'article',{title:'Edited teaching',content:'<p>Edited</p>',status:'published'},'editor',0));
 const checkpoint=await getDoc(doc(store,'dhamma_posts','article','revisions','1'));
 assert.deepEqual(checkpoint.data().snapshot,original);
 assert.equal(checkpoint.data().actorId,'editor');assert.ok(checkpoint.data().createdAt instanceof Timestamp);
 await assertSucceeds(saveArticleVersion(store,'article',{status:'draft'},'editor',1,1));
 const restored=(await getDoc(doc(store,'dhamma_posts','article'))).data();
 assert.equal(restored.title,original.title);assert.equal(restored.status,'draft');assert.equal(restored.version,2);
 assert.equal(restored.authorId,'teacher');assert.ok(restored.publishedAt.isEqual(original.publishedAt));
 assert.equal((await getDoc(doc(store,'dhamma_posts','article','revisions','2'))).data().snapshot.title,'Edited teaching');
 await assertSucceeds(saveArticleVersion(store,'article',{status:'archived'},'editor',2));
 await assertSucceeds(saveArticleVersion(store,'article',{status:'draft'},'editor',3));
 assert.equal((await getDoc(doc(store,'dhamma_posts','article'))).data().version,4);
 await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'dhamma_posts','article')));
});
test('history is private, immutable, and inseparable from a valid article edit',async()=>{
 const store=db('editor'), reference=doc(store,'dhamma_posts','atomic');
 const revision={version:1,snapshot:original,actorId:'editor',createdAt:serverTimestamp(),action:'update'};
 await assertFails(updateDoc(reference,{title:'Untracked',version:1,updatedAt:serverTimestamp(),updatedBy:'editor'}));
 await assertFails(setDoc(doc(reference,'revisions','1'),revision));
 for(const bad of [{snapshot:{...original,title:'Forged'}},{actorId:'reader'},{createdAt:Timestamp.fromMillis(1)},{version:99}]){
  const batch=writeBatch(store);
  batch.update(reference,{title:'Changed',version:1,updatedAt:serverTimestamp(),updatedBy:'editor'});
  batch.set(doc(reference,'revisions','1'),{...revision,...bad});
  await assertFails(batch.commit());
 }
 assert.equal((await getDoc(reference)).data().title,original.title);
 await assertSucceeds(saveArticleVersion(store,'atomic',{status:'draft'},'editor',0));
 await assertSucceeds(getDocs(collection(db('reader'),'dhamma_posts','atomic','revisions')));
 for(const visitor of [env.unauthenticatedContext().firestore(),db('member')])await assertFails(getDocs(collection(visitor,'dhamma_posts','atomic','revisions')));
 await assertFails(updateDoc(doc(reference,'revisions','1'),{action:'restore'}));
 await assertFails(deleteDoc(doc(reference,'revisions','1')));
 await assertFails(deleteDoc(reference));
 await assertFails(saveArticleVersion(db('reader'),'atomic',{status:'archived'},'reader',1));
});
test('two editors saving the same version produce one winner and one checkpoint without losing the winning edit',async()=>{
 const store=db('editor');
 const results=await Promise.allSettled([
  saveArticleVersion(store,'race',{title:'First',content:'First',status:'draft'},'editor',0),
  saveArticleVersion(store,'race',{title:'Second',content:'Second',status:'draft'},'editor',0),
 ]);
 assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
 const failure=results.find(result=>result.status==='rejected');assert.match(failure.reason.message,/changed after you opened/);
 assert.equal((await getDoc(doc(store,'dhamma_posts','race'))).data().version,1);
 assert.equal((await getDocs(collection(store,'dhamma_posts','race','revisions'))).size,1);
});
test('audio archive keeps the asset, restores to drafts, rejects stale or read-only editors and prevents hard deletion',async()=>{
 const store=db('editor'),reference=doc(store,'kamatahan_audio','recording');
 await assertSucceeds(saveAudioMetadata(store,'recording',{status:'archived',isPublic:false},0,'editor'));
 assert.equal((await getDoc(reference)).data().fileUrl,'https://example.test/retained.mp3');
 await assert.rejects(saveAudioMetadata(store,'recording',{title:'Stale'},0,'editor'),/changed after you opened/);
 await assertFails(saveAudioMetadata(db('reader'),'recording',{status:'draft'},1,'reader'));
 await assertFails(saveAudioMetadata(store,'recording',{status:'archived',isPublic:true},1,'editor'));
 await assertSucceeds(saveAudioMetadata(store,'recording',{status:'draft',isPublic:false},1,'editor'));
 await assertFails(deleteDoc(reference));
});
test('playlist rules retain legacy owner edits, enforce versions after upgrade and keep archived playlists private',async()=>{
 const reference=doc(db('editor'),'playlists','versioned');
 await assertSucceeds(updateDoc(doc(db('member'),'playlists','personal'),{audioFiles:[{id:'a'}]}));
 await assertFails(updateDoc(reference,{audioIds:['a','b']}));
 await assertSucceeds(updateDoc(reference,{audioIds:['a','b'],version:1}));
 await assertFails(updateDoc(reference,{archived:true,version:2}));
 await assertSucceeds(updateDoc(reference,{archived:true,isPublic:false,version:2}));
 await assertFails(updateDoc(reference,{version:1}));
});
test('status-filtered library pages have stable non-overlapping cursors',async()=>{
 const reference=collection(db('editor'),'kamatahan_audio');
 const first=await getDocs(query(reference,where('status','==','draft'),orderBy(documentId()),limit(20)));
 const second=await getDocs(query(reference,where('status','==','draft'),orderBy(documentId()),startAfter(first.docs.at(-1)),limit(20)));
 assert.equal(first.size,20);assert.equal(second.size,6);
 assert.equal(new Set([...first.docs,...second.docs].map(item=>item.id)).size,26);
});
