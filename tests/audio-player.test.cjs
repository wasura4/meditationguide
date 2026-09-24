const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');

test('one persistent audio player handles route changes, queue completion, races and account cleanup', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const globals = ['window', 'document', 'localStorage', 'Audio', 'IS_REACT_ACT_ENVIRONMENT'];
  const previous = Object.fromEntries(globals.map(key => [key, global[key]]));
  global.window = dom.window;
  global.document = dom.window.document;
  global.localStorage = dom.window.localStorage;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const audios = [], listens = [];
  class MockAudio extends EventTarget {
    constructor() { super(); this.paused = true; this.duration = NaN; this.currentTime = 0; this.readyState = 0; this.src = ''; this.requests = []; audios.push(this); }
    play() { this.paused = false; this.ended = false; return new Promise((resolve, reject) => this.requests.push({ resolve, reject })); }
    pause() { this.paused = true; this.dispatchEvent(new Event('pause')); }
    load() { this.readyState = 0; this.currentTime = 0; this.duration = NaN; this.error = null; this.ended = false; }
    removeAttribute(key) { if (key === 'src') this.src = ''; }
    getAttribute(key) { return key === 'src' ? this.src : null; }
    ready() { this.duration = 60; this.readyState = 4; this.dispatchEvent(new Event('loadedmetadata')); }
    playing() { this.paused = false; this.dispatchEvent(new Event('playing')); this.requests.at(-1).resolve(); }
    end() { this.currentTime = 60; this.ended = true; this.paused = true; this.dispatchEvent(new Event('ended')); }
  }
  global.Audio = MockAudio;
  let user = { id: 'first' }, state;
  const filename = path.resolve('src/contexts/PlayerContext.tsx');
  const loaded = new Module(filename, module);
  loaded.filename = filename; loaded.paths = module.paths;
  loaded.require = name => {
    if (name === '@/contexts/AuthContext') return { useAuth: () => ({ user }) };
    if (name === '@/lib/metricsService') return { recordAudioListen: async (...args) => listens.push(args) };
    return require(name);
  };
  loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, filename);
  const { PlayerProvider, usePlayer } = loaded.exports;
  function Probe() { state = usePlayer(); return null; }
  const root = createRoot(document.getElementById('root'));
  const render = key => React.act(async () => root.render(React.createElement(PlayerProvider, null, React.createElement(Probe, { key }))));
  const run = fn => React.act(async () => { fn(); });
  const guide = { id: 'guide', name: 'Practice', audioFiles: [{ id: 'a', title: 'First', fileUrl: '/a.wav' }, { id: 'b', title: 'Second', fileUrl: '/b.wav' }] };
  try {
    await render('library');
    const audio = audios[0];
    await run(() => state.start(guide));
    assert.equal(state.isLoading, true);
    assert.equal(audio.src, '/a.wav');
    await run(() => { audio.ready(); audio.playing(); });
    await run(() => { audio.currentTime = 12; audio.dispatchEvent(new Event('timeupdate')); });
    await render('dashboard');
    assert.equal(audios.length, 1, 'client navigation must retain the same audio element');
    assert.equal(state.currentTime, 12);
    await run(() => document.dispatchEvent(new dom.window.Event('visibilitychange')));
    assert.equal(audio.paused, false, 'backgrounding must not pause playback');
    await run(() => { state.setSpeed(1.5); state.seek(999); });
    assert.equal(audio.currentTime, 60);
    await run(() => state.seek(-10));
    assert.equal(audio.currentTime, 0);
    await run(() => state.seek(NaN));
    assert.equal(audio.currentTime, 0);
    await run(() => state.toggle());
    assert.equal(state.isPlaying, false);
    await run(() => state.start(guide));
    await run(() => audio.playing());
    assert.equal(listens.length, 1, 'resuming should not double-count the same recording');
    await run(() => audio.end());
    assert.equal(state.index, 1);
    assert.equal(audio.src, '/b.wav');
    assert.equal(audio.playbackRate, 1.5);
    await run(() => { audio.ready(); audio.playing(); audio.end(); });
    assert.equal(state.isPlaying, false, 'a queue must finish instead of looping unexpectedly');
    await run(() => state.setRepeat(true));
    await run(() => state.toggle());
    await run(() => { audio.playing(); audio.end(); });
    assert.equal(state.index, 0);
    await run(() => state.start({ id: 'single', name: 'One', audioFiles: [guide.audioFiles[0]] }));
    await run(() => { audio.ready(); audio.playing(); audio.end(); });
    assert.equal(state.isPlaying, true, 'repeat also restarts a single recording');
    await run(() => state.setRepeat(false));
    await run(() => { audio.ready(); audio.playing(); audio.end(); });
    assert.equal(state.isPlaying, false);
    await run(() => state.start(guide));
    const stale = audio.requests.at(-1);
    await run(() => state.playAt(1));
    await run(() => stale.reject(new Error('superseded source')));
    assert.equal(state.error, false, 'old play rejection must not break the current track');
    const pending = audio.requests.at(-1);
    await run(() => state.toggle());
    await run(() => pending.reject({ name: 'AbortError' }));
    await run(() => audio.ready());
    await run(() => audio.dispatchEvent(new Event('playing')));
    assert.equal(state.isPlaying, false, 'pausing during load must stay paused when metadata arrives');
    await run(() => state.toggle());
    await run(() => audio.requests.at(-1).reject(new Error('network')));
    assert.equal(state.error, true);
    assert.equal(state.isPlaying, false);
    await run(() => state.toggle());
    await run(() => audio.playing());
    assert.equal(state.error, false, 'a failed play request can be retried');
    await run(() => { audio.error = { code: 2 }; audio.dispatchEvent(new Event('error')); });
    assert.equal(state.error, true);
    await run(() => state.toggle());
    assert.equal(audio.error, null, 'media errors must reload the source on retry');
    await run(() => { audio.ready(); audio.playing(); });
    user = { id: 'second' };
    await render('new-account');
    assert.equal(state.guide, null);
    assert.equal(audio.paused, true);
    await run(() => state.start(guide));
    await run(() => { audio.ready(); audio.playing(); });
    assert.deepEqual(listens.at(-1), ['a', 'second']);
    await run(() => state.stop());
    await run(() => audio.dispatchEvent(new Event('loadedmetadata')));
    assert.equal(state.isPlaying, false);
    assert.equal(audio.src, '');
    await run(() => state.start({ id: 'empty', name: 'Empty', audioFiles: [] }));
    assert.equal(state.guide, null);
  } finally {
    await React.act(async () => root.unmount());
    assert.equal(audios.at(-1).paused, true);
    dom.window.close();
    for (const key of globals) global[key] = previous[key];
  }
});
