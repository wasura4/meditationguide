const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText,f);
const {checkinDay,checkinSummary}=require('../src/lib/checkins.ts');
test('local midnight renews the date and handles month/year boundaries',()=>{
 const last=checkinDay(new Date(2026,11,31,23,59,59));
 assert.equal(last.day,'2026-12-31');assert.equal(checkinDay(last.end).day,'2027-01-01');
 assert.equal(last.start.getHours(),0);assert.equal(last.end.getHours(),0);
});
test('local days respect Sri Lanka offset and daylight saving transitions',()=>{
 const original=process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone;
 try {
  process.env.TZ='Asia/Colombo';const colombo=checkinDay(new Date('2026-09-23T20:00:00Z'));
  assert.equal(colombo.day,'2026-09-24');assert.equal(colombo.startOffset,-330);
  process.env.TZ='America/New_York';
  for(const [date,hours] of [[new Date(2026,2,8,12),23],[new Date(2026,10,1,12),25]]) {
   const day=checkinDay(date);assert.equal((day.end-day.start)/3600000,hours);
  }
  process.env.TZ='Antarctica/Troll';const troll=checkinDay(new Date(2026,2,29,12));assert.equal((troll.end-troll.start)/3600000,22);
 } finally {process.env.TZ=original;}
});
test('history counts answered days, preserves question snapshots, and never invents missing No answers',()=>{
 const answers=[{id:'1',day:'2026-09-22',answer:false,titleEn:'Original question'},{id:'2',day:'2026-09-24',answer:true,titleEn:'New question'},{id:'3',day:'2026-09-24',answer:false,titleEn:'Another question'}];
 const summary=checkinSummary(answers);
 assert.equal(summary.days.length,2);assert.equal(summary.yes,1);assert.equal(summary.no,2);
 assert.equal(summary.days[0][0],'2026-09-24');assert.equal(summary.days[1][1].answers[0].titleEn,'Original question');
 assert.deepEqual(checkinSummary([]),{days:[],yes:0,no:0});
});

