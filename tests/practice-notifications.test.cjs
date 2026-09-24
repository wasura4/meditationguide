const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');

test('blocked or silent native notifications are visible and permission requests require a tap', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url:'http://localhost', pretendToBeVisual:true });
  const previous = {window:global.window,document:global.document,act:global.IS_REACT_ACT_ENVIRONMENT};
  global.window=dom.window; global.document=dom.window.document; global.IS_REACT_ACT_ENVIRONMENT=true;
  let status='blocked', requests=0;
  window.AndroidInterface={getPracticeNotificationStatus:()=>status,enablePracticeNotifications:()=>requests++};
  const file=path.resolve('src/components/meditation/PracticeNotificationNotice.tsx');
  const loaded=new Module(file,module); loaded.filename=file; loaded.paths=module.paths;
  loaded.require=name=>name==='@/contexts/LanguageContext'?{useLanguage:()=>({t:key=>key})}:require(name);
  loaded._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);
  const {PracticeNotificationNotice,readPracticeNotificationStatus}=loaded.exports;
  const root=createRoot(document.getElementById('root'));
  try {
    await React.act(async()=>root.render(React.createElement(PracticeNotificationNotice)));
    assert.match(document.body.textContent,/notifications_blocked/);
    assert.equal(requests,0,'mount must not prompt or open system settings');
    await React.act(async()=>document.querySelector('button').click());
    assert.equal(requests,1);
    status='allowed';
    await React.act(async()=>window.dispatchEvent(new dom.window.Event('focus')));
    assert.equal(document.querySelector('[role="status"]'),null,'warning clears on return after permission granted');
    status='silent';
    await React.act(async()=>window.dispatchEvent(new dom.window.Event('focus')));
    assert.match(document.body.textContent,/notifications_silent/);
    assert.match(document.body.textContent,/notification_settings/);
    assert.equal(readPracticeNotificationStatus({}),null,'ordinary browsers do not get native permission prompts');
    assert.equal(readPracticeNotificationStatus({AndroidInterface:{getPracticeNotificationStatus(){throw Error('old bridge');}}}),null);
  } finally {
    await React.act(async()=>root.unmount()); dom.window.close();
    global.window=previous.window; global.document=previous.document; global.IS_REACT_ACT_ENVIRONMENT=previous.act;
  }
});
