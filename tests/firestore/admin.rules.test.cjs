const { test, before, after } = require('node:test');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(readFileSync(filename, 'utf8'), {compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText,filename);
const {saveArticleVersion} = require('../../src/lib/editorialTransactions.ts');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, collection, query, where, serverTimestamp, Timestamp } = require('firebase/firestore');
let env;
const db = uid => env.authenticatedContext(uid).firestore();
const post = { title: 'Meditation', content: '<p>Practice</p>', status: 'draft' };
const event = { title: 'Practice together', startDate: Timestamp.fromMillis(1000), endDate: Timestamp.fromMillis(2000), isActive: true };
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-nirvanaya', firestore: {host:'127.0.0.1',port:8185,rules:readFileSync('firestore.rules','utf8')} });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const store = context.firestore();
    await Promise.all([
      setDoc(doc(store,'admin_users','editor'),{role:'admin',isActive:true,permissions:[{resource:'dhamma',actions:['read','create','update']},{resource:'content',actions:['read','create','update']}]}),
      setDoc(doc(store,'admin_users','reader'),{role:'content_admin',isActive:true,permissions:[{resource:'dhamma',actions:['read']}]}),
      setDoc(doc(store,'admin_users','inactive'),{role:'super_admin',isActive:false,permissions:[]}),
      setDoc(doc(store,'admin_users','empty'),{role:'admin',isActive:true,permissions:[]}),
      setDoc(doc(store,'admin_users','super'),{role:'super_admin',isActive:true,permissions:[]}),
      setDoc(doc(store,'admin_users','analyst'),{role:'moderator',isActive:true,permissions:[{resource:'analytics',actions:['read']}]}),
      setDoc(doc(store,'admin_users','audio-reader'),{role:'admin',isActive:true,permissions:[{resource:'audio',actions:['read']}]}),
      setDoc(doc(store,'dhamma_posts','private'),post),
      setDoc(doc(store,'dhamma_posts','public'),{...post,status:'published'}),
      setDoc(doc(store,'meditation_sessions','own'),{userId:'member',duration:10}),
      setDoc(doc(store,'playlists','own'),{userId:'member',isPublic:false}),
      setDoc(doc(store,'playlists','legacy'),{createdBy:'super',isPublic:false}),
      setDoc(doc(store,'event_participation','own'),{userId:'member',eventId:'event'}),
      setDoc(doc(store,'users','member'),{role:'user',isActive:true,displayName:'Member'}),
    ]);
  });
});
after(async () => { await env?.cleanup(); });
test('members cannot self-enrol as admin or grant themselves privileges', async () => {
  await assertFails(setDoc(doc(db('member'),'admin_users','member'),{role:'super_admin',isActive:true}));
  await assertFails(updateDoc(doc(db('editor'),'admin_users','editor'),{role:'super_admin'}));
  await assertFails(deleteDoc(doc(db('editor'),'admin_users','editor')));
  await assertSucceeds(updateDoc(doc(db('editor'),'admin_users','editor'),{lastLogin:serverTimestamp()}));
  await assertFails(updateDoc(doc(db('editor'),'admin_users','editor'),{lastLogin:Timestamp.fromMillis(0)}));
});
test('explicit actions, inactive accounts and empty roles are enforced by Firebase', async () => {
  await assertSucceeds(setDoc(doc(db('editor'),'dhamma_posts','new'),post));
  await assertSucceeds(saveArticleVersion(db('editor'),'new',{...post,title:'Updated'},'editor',0));
  await assertFails(deleteDoc(doc(db('editor'),'dhamma_posts','new')));
  for (const uid of ['member','reader','inactive','empty']) await assertFails(setDoc(doc(db(uid),'dhamma_posts',uid),post));
  await assertFails(setDoc(doc(db('editor'),'kamatahan_audio','cross-resource'),{title:'Denied'}));
  await assertSucceeds(setDoc(doc(db('super'),'kamatahan_audio','super-audio'),{title:'Allowed'}));
});
test('public readers only see published posts, including saved-post queries', async () => {
  const publicDb = env.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(publicDb,'dhamma_posts','public')));
  await assertFails(getDoc(doc(publicDb,'dhamma_posts','private')));
  await assertFails(getDocs(collection(publicDb,'dhamma_posts')));
  await assertSucceeds(getDocs(query(collection(publicDb,'dhamma_posts'),where('status','==','published'))));
  await assertFails(getDocs(query(collection(publicDb,'dhamma_posts'),where('__name__','==','private'),where('status','==','published'))));
  await assertSucceeds(getDoc(doc(db('reader'),'dhamma_posts','private')));
});
test('only permitted content admins manage valid events and posts', async () => {
  await assertFails(setDoc(doc(db('member'),'meditation_events','event'),event));
  await assertSucceeds(setDoc(doc(db('editor'),'meditation_events','event'),event));
  await assertFails(updateDoc(doc(db('editor'),'meditation_events','event'),{endDate:Timestamp.fromMillis(0)}));
  await assertFails(setDoc(doc(db('editor'),'dhamma_posts','invalid'),{...post,status:'unknown'}));
  await assertFails(updateDoc(doc(db('editor'),'dhamma_posts','new'),{content:42}));
});
test('owners keep normal edits but cannot transfer records or elevate user roles', async () => {
  const member = db('member');
  await assertSucceeds(updateDoc(doc(member,'users','member'),{displayName:'Updated'}));
  await assertFails(updateDoc(doc(member,'users','member'),{role:'admin'}));
  await assertFails(updateDoc(doc(member,'users','member'),{isActive:false}));
  await assertSucceeds(updateDoc(doc(member,'meditation_sessions','own'),{duration:15}));
  for (const name of ['meditation_sessions','playlists','event_participation']) await assertFails(updateDoc(doc(member,name,'own'),{userId:'other'}));
  await assertSucceeds(setDoc(doc(member,'dhamma_reads','own'),{userId:'member',postId:'public',createdAt:serverTimestamp()}));
  await assertFails(setDoc(doc(member,'dhamma_reads','spoof'),{userId:'other',postId:'public',createdAt:serverTimestamp()}));
});
test('analytics and legacy playlist queries retain their explicit read permissions', async () => {
  await assertSucceeds(getDocs(collection(db('analyst'),'users')));
  await assertSucceeds(getDocs(collection(db('analyst'),'meditation_sessions')));
  await assertSucceeds(getDocs(collection(db('analyst'),'dhamma_posts')));
  await assertSucceeds(getDocs(collection(db('audio-reader'),'playlists')));
  await assertSucceeds(getDoc(doc(db('audio-reader'),'playlists','legacy')));
  await assertFails(getDocs(collection(db('reader'),'users')));
  await assertFails(getDocs(collection(db('inactive'),'meditation_sessions')));
});

test('event statistics retain signed-in access without exposing private meditation sessions', async () => {
  const member = db('member'), visitor = env.unauthenticatedContext().firestore();
  await assertSucceeds(getDocs(collection(member,'meditation_events')));
  await assertSucceeds(getDocs(query(collection(member,'event_participation'),where('eventId','==','event'))));
  await assertFails(getDocs(collection(visitor,'meditation_events')));
  await assertFails(getDocs(collection(visitor,'event_participation')));
  await assertFails(getDocs(query(collection(member,'meditation_sessions'),where('eventId','==','event'))));
  await assertSucceeds(getDocs(query(collection(member,'meditation_sessions'),where('userId','==','member'))));
});
