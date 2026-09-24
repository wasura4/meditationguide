const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
require.extensions['.ts'] = (m, file) => m._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText, file);
const { createPractice, finishPractice } = require('../src/lib/meditationClock.ts');

test('event validation preserves logbook saves and credits only eligible sessions', async () => {
  const filename = path.resolve('src/lib/practiceTransactions.ts');
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = module.paths;
  let event;
  let writes;
  loaded.require = name => name === 'firebase/firestore' ? {
    doc: (_, collection, id) => ({ collection, id }),
    runTransaction: async (_, callback) => callback({
      get: async ref => ({ exists: () => ref.collection === 'meditation_events' && !!event, data: () => ref.collection === 'meditation_events' ? event : undefined }),
      set: (ref, data) => writes.push({ ref, data }),
    }),
  } : name === './eventTiming' ? require('../src/lib/eventTiming.ts') : require(name);
  loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText, filename);
  const clock = finishPractice(createPractice({ id: 'practice_event', userId: 'owner', typeId: 'breath', typeName: 'Breathing', bell: false, eventId: 'retreat' }, 1, 0, 100000), 160000);
  const timestamp = ms => ({ toDate: () => new Date(ms) });
  for (const [record, expected] of [
    [undefined, false],
    [{ isActive: false, startDate: timestamp(0), endDate: timestamp(200000) }, false],
    [{ isActive: true, startDate: timestamp(0), endDate: timestamp(90000) }, false],
    [{ isActive: true, startDate: timestamp(0), endDate: timestamp(200000) }, true],
  ]) {
    event = record; writes = [];
    const result = await loaded.exports.savePractice({}, clock);
    assert.equal(writes[0].ref.collection, 'meditation_sessions');
    assert.equal(result.duration, 1);
    assert.equal(result.eventId, expected ? 'retreat' : undefined);
    assert.equal(writes.length, expected ? 2 : 1);
  }
});
