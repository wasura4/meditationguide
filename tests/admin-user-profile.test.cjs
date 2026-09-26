const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, filename);
const { normalizeAdminProfile } = require('../src/lib/adminUserProfile.ts');
const { memberPracticeInsights } = require('../src/lib/adminMemberInsights.ts');
const timestamp = date => ({ toDate: () => date });

test('member profiles retain preferences and nested path dates without inventing missing activity', () => {
  const date = new Date(2026,8,26);
  const profile = normalizeAdminProfile('real-id', { id:'spoof', displayName:'Member', lastLoginAt:timestamp(date), preferences:{dailyGoalMinutes:30}, pathProgress:{currentStage:3, updatedAt:timestamp(date), history:[{stage:2,updatedAt:timestamp(date),notes:'A milestone'},{stage:99}]} });
  assert.equal(profile.id,'real-id');
  assert.equal(profile.lastLoginAt,date);
  assert.ok(Number.isNaN(profile.createdAt.getTime()));
  assert.equal(profile.preferences.dailyGoalMinutes,30);
  assert.equal(profile.preferences.theme,undefined);
  assert.equal(profile.pathProgress.currentStage,3);
  assert.equal(profile.pathProgress.history.length,1);
  assert.equal(profile.pathProgress.history[0].updatedAt,date);
  assert.equal(profile.pathProgress.history[0].notes,'A milestone');
  assert.equal(normalizeAdminProfile('id',{pathProgress:{currentStage:9}}).pathProgress,undefined);
});
const now = new Date(2026,8,26,12);
const session = (id,day,duration=20,status='completed') => ({id,userId:'member',typeId:'breath',typeName:'Breathing',startTime:new Date(2026,8,day,9),createdAt:new Date(2026,8,day,10),duration,status});
test('profile totals exclude invalid, future, duplicate, and unfinished sessions and use practice dates', () => {
  const data = memberPracticeInsights([session('a',24),session('a',24),session('b',25),session('c',26,30),session('bad',26,-10),session('future',27),session('paused',26,80,'paused'),session('abandoned',26,5,'abandoned')],now);
  assert.equal(data.completed,3); assert.equal(data.totalMinutes,70); assert.equal(data.average,23);
  assert.equal(data.streak,3); assert.equal(data.longest,3); assert.equal(data.practiceDays,3);
  assert.equal(data.days.length,30); assert.equal(data.days.at(-1).minutes,30);
  assert.equal(data.recentMinutes,70); assert.equal(data.types[0].count,3);
});
test('full history is not capped at 50 and older practice is absent from the 30 day grid', () => {
  const sessions = Array.from({length:75},(_,i) => ({...session(String(i),26,10),startTime:new Date(2025,0,1,9),createdAt:new Date(2026,8,26)}));
  const data=memberPracticeInsights(sessions,now);
  assert.equal(data.completed,75); assert.equal(data.totalMinutes,750); assert.equal(data.recentMinutes,0); assert.equal(data.streak,0); assert.equal(data.longest,1);
  const empty=memberPracticeInsights([],now); assert.equal(empty.average,0); assert.equal(empty.completed,0); assert.equal(empty.lastPractice,undefined);
});
