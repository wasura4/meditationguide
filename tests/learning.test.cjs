const {test}=require('node:test');const assert=require('node:assert/strict'),ts=require('typescript'),fs=require('node:fs');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText,f);
const {teacherFields,pathFields,blankTeacher,blankLearningPath,learningProgress,learningText}=require('../src/lib/learning.ts');
const a={id:'article_a',kind:'article',contentId:'a'},b={id:'audio_b',kind:'audio',contentId:'b'};
test('learning validation strips attribution, trims input and requires publishable introductions',()=>{
 assert.deepEqual(teacherFields({...blankTeacher,name:'  Name  ',createdBy:'forged'}),{...blankTeacher,name:'Name'});
 assert.throws(()=>teacherFields({...blankTeacher,name:'Name',status:'published'}));
 assert.throws(()=>teacherFields({...blankTeacher,name:'x'.repeat(161)}));
 const path={...blankLearningPath,title:' Path ',description:'Intro',status:'published',lessons:[b,a]};
 assert.deepEqual(pathFields(path).lessonIds,['audio_b','article_a']);
 for(const bad of [{lessons:[]},{lessons:[a,a]},{lessons:[null]},{lessons:[{...a,id:'fake'}]},{teacherId:42},{teacherId:'../private'},{language:'other'}])assert.throws(()=>pathFields({...path,...bad}));
});
test('completion is unique and tied to content identity rather than sequence or removed lessons',()=>{
 assert.deepEqual(learningProgress([a,b],['article_a','article_a','removed']),{count:1,total:2,percent:50,next:'audio_b'});
 assert.deepEqual(learningProgress([b,a],['article_a']),{count:1,total:2,percent:50,next:'audio_b'});
 assert.deepEqual(learningProgress([],['article_a']),{count:0,total:0,percent:0,next:null});
 assert.equal(learningText('සිංහල','English','en'),'English');assert.equal(learningText('සිංහල','','en'),'සිංහල');assert.equal(learningText('සිංහල','English','si'),'සිංහල');
});
