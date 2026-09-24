const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,filename);
const { normalizeAdmin, canAdminAccess, adminResourceForPath } = require('../src/lib/adminAccess.ts');
const { buildAdminAnalytics } = require('../src/lib/adminAnalytics.ts');
test('admin access fails closed and preserves existing explicit legacy permissions',()=>{
  assert.equal(normalizeAdmin('member',{role:'admin',isActive:true,permissions:[]}),null);
  assert.equal(normalizeAdmin('member',{role:'super_admin',isActive:false}),null);
  assert.equal(normalizeAdmin('member',{role:'unknown',isActive:true}),null);
  const editor=normalizeAdmin('editor',{id:'spoof',role:'admin',isActive:true,lastLogin:'invalid',permissions:[{resource:'dhamma',actions:['read','update']}]});
  assert.equal(editor.id,'editor');assert.equal(editor.lastLogin,undefined);
  assert.equal(canAdminAccess(editor,'dhamma','read'),true);
  assert.equal(canAdminAccess(editor,'dhamma','delete'),false);
  assert.equal(canAdminAccess(editor,'users','read'),false);
  assert.equal(canAdminAccess(null,'dhamma','read'),false);
  assert.equal(adminResourceForPath('/admin/dhamma'),'dhamma');
  assert.equal(adminResourceForPath('/admin/unknown'),null);
});
const now=new Date(2026,8,24,12);
const user=(id,date)=>({id,createdAt:date,displayName:id});
const session=(userId,date,duration,status='completed')=>({userId,createdAt:date,duration,status,typeName:'Mindfulness'});
test('selected-period metrics exclude older, future, incomplete and invalid-duration practice',()=>{
  const users=[user('a',new Date(2020,0,1)),user('b',new Date(2026,8,24,10))];
  const sessions=[session('a',new Date(2020,0,1),100),session('a',new Date(2026,8,18),20),session('b',new Date(2026,8,24),10),session('b',new Date(2026,8,24),200,'cancelled'),session('a',new Date(2026,8,24),-30),session('a',new Date(2026,8,25),500)];
  const result=buildAdminAnalytics(users,sessions,'7d',now);
  assert.equal(result.users.total,2);assert.equal(result.users.new,1);assert.equal(result.users.active,2);
  assert.equal(result.sessions.total,4);assert.equal(result.sessions.completed,2);
  assert.equal(result.meditation.totalMinutes,30);assert.equal(result.sessions.average,15);
  assert.equal(result.sessions.growth,null);
  assert.equal(result.topUsers.reduce((sum,row)=>sum+row.totalMinutes,0),30);
  assert.equal(result.trends.sessionGrowth.length,7);
  assert.equal(result.trends.sessionGrowth[0].date,'2026-09-18');
  assert.equal(result.engagement.dailyActive.at(-1),1);
});
test('all time includes history beyond a year and does not invent growth',()=>{
  const result=buildAdminAnalytics([user('old',new Date(2020,0,1))],[session('old',new Date(2020,0,1),45)],'all',now);
  assert.equal(result.meditation.totalMinutes,45);assert.equal(result.trends.userGrowth[0].date,'2020-01-01');
  assert.equal(result.users.growth,null);assert.equal(result.engagement.monthlyActive,0);
});
test('growth uses preceding period and empty data produces finite zero totals',()=>{
  const result=buildAdminAnalytics([],[], '30d',now);
  assert.equal(result.meditation.averageSession,0);assert.equal(result.engagement.participationRate,0);
  const previous=session('a',new Date(2026,8,17),10);
  const current=session('a',new Date(2026,8,24),10);
  assert.equal(buildAdminAnalytics([], [previous,current,current], '7d',now).sessions.growth,100);
});
