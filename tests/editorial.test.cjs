const {test}=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript');
const fs=require('node:fs');
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText,filename);
const {playlistTrackIds,orderedTracks,moveTrack,isPublishedAudio,articleFields,assertVersion}=require('../src/lib/editorial.ts');

test('playlist IDs preserve editorial order, including unavailable references and explicit removal of every track',()=>{
 const legacy={audioFiles:[{id:'a'},{id:'b'}]};
 assert.deepEqual(playlistTrackIds(legacy),['a','b']);
 assert.deepEqual(playlistTrackIds({...legacy,audioIds:[]}),[]);
 const ids=playlistTrackIds({...legacy,audioIds:['b','missing','a','b']});
 assert.deepEqual(ids,['b','missing','a']);
 assert.deepEqual(orderedTracks(ids,[{id:'a'},{id:'b'}]),[{id:'b'},{id:'a'}]);
 assert.deepEqual(ids,['b','missing','a']);
});
test('track moves change only the chosen adjacent positions and never mutate the original selection',()=>{
 const ids=['a','b','c'];
 assert.deepEqual(moveTrack(ids,'b',-1),['b','a','c']);
 assert.deepEqual(moveTrack(ids,'b',1),['a','c','b']);
 for(const [id,direction] of [['a',-1],['c',1],['missing',1]]) assert.deepEqual(moveTrack(ids,id,direction),ids);
 assert.deepEqual(ids,['a','b','c']);
});
test('public playback excludes archived, private, draft and inactive recordings',()=>{
 assert.equal(isPublishedAudio({status:'active'}),true);
 assert.equal(isPublishedAudio({status:'active',isPublic:false}),false);
 for(const status of ['archived','draft','inactive',undefined]) assert.equal(isPublishedAudio({status,isPublic:true}),false);
});
test('restoration cannot replace identity or attribution and stale versions are rejected',()=>{
 const fields=articleFields({title:'Before',content:'Teaching',authorId:'original',createdAt:42,publishedAt:42,version:9,updatedBy:'other',tags:['a',42]});
 assert.equal(fields.authorId,undefined);assert.equal(fields.version,undefined);assert.equal(fields.publishedAt,undefined);
 assert.deepEqual(fields.tags,['a']);
 assert.doesNotThrow(()=>assertVersion(undefined,0));
 assert.throws(()=>assertVersion(2,1),/changed after you opened/);
});
