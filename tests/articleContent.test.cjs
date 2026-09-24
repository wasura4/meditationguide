const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop:true } }).outputText, filename);
const { prepareArticle } = require('../src/lib/articleContent.ts');
function prepare(html) {
  const window = new JSDOM('',{url:'https://example.com'}).window;
  try {
    const result = prepareArticle(html,window);
    const document = new JSDOM(result.html).window.document;
    return { ...result, document };
  } finally { window.close(); }
}
test('article HTML strips executable markup, event handlers and unsafe URLs', () => {
  const { document,html } = prepare('<script>alert(1)</script><svg onload="alert(1)"></svg><img src="javascript:alert(1)" onerror="alert(1)"><a href="data:text/html,evil">unsafe</a><form id="location"><input name="href"></form><p style="position:fixed;inset:0;background:url(javascript:evil)">text</p>');
  assert.equal(document.querySelector('script,svg,form,input,[onerror],[onload],[style]'),null);
  assert.equal(document.querySelector('img').hasAttribute('src'),false);
  assert.equal(document.querySelector('a').hasAttribute('href'),false);
  assert.ok(!html.includes('javascript:'));
});
test('only real YouTube embed hosts survive, without autoplay or srcdoc', () => {
  const {document} = prepare('<iframe src="https://www.youtube.com/embed/JQEB-AQeu0U?autoplay=1" srcdoc="<script>evil</script>"></iframe><iframe src="https://youtube.com.evil.test/embed/JQEB-AQeu0U"></iframe><iframe src="https://evil.test"></iframe><iframe src="//youtube.com/embed/JQEB-AQeu0U"></iframe>');
  const frames = document.querySelectorAll('iframe');
  assert.equal(frames.length,1);
  assert.equal(frames[0].getAttribute('src'),'https://www.youtube-nocookie.com/embed/JQEB-AQeu0U');
  assert.equal(frames[0].hasAttribute('srcdoc'),false);
  assert.equal(frames[0].getAttribute('loading'),'lazy');
});
test('article formatting and Sinhala text survive, with safe unique section links', () => {
  const {document,sections} = prepare('<h2 id="practice">පුහුණුව</h2><h3 id="practice">පුහුණුව</h3><a href="#practice">jump</a><p style="color:red;text-align: center">සිහිය <strong>today</strong></p><table><tr><th>One</th><td colspan="2">Two</td></tr></table><details><summary>More</summary><p>Text</p></details><img src="https://example.com/image.jpg" alt="Image">');
  assert.equal(sections.length,2);
  assert.notEqual(sections[0].id,sections[1].id);
  assert.equal(document.querySelector('h2').textContent,'පුහුණුව');
  assert.equal(document.querySelector('p').getAttribute('style'),'text-align: center');
  assert.ok(document.querySelector('table th'));
  assert.ok(document.querySelector('details summary'));
  assert.equal(document.querySelector('img').getAttribute('alt'),'Image');
  assert.equal(document.querySelector('img').getAttribute('loading'),'lazy');
  assert.ok(document.getElementById(document.querySelector('a').getAttribute('href').slice(1)));
});
test('untrusted IDs, attributes and SVG mutation payloads cannot escape article content', () => {
  const {document} = prepare('<p id="reader-options" class="fixed" data-danger="true">Hello</p><math><mtext><table><mglyph><style><!--</style><img title="--><img src=1 onerror=alert(1)>"></mglyph></table></mtext></math><a href="https://example.com" target="_blank" rel="opener">safe link</a>');
  assert.equal(document.querySelector('[id],[class],[data-danger],[onerror],math,svg,style'),null);
  assert.equal(document.querySelector('a').getAttribute('rel'),'noopener noreferrer');
  assert.equal(document.querySelector('a').hasAttribute('target'),false);
});


test('video teachings avoid a duplicate cover, while illustrated articles keep theirs', () => {
  assert.equal(prepare('<div><iframe src="https://www.youtube.com/embed/JQEB-AQeu0U"></iframe></div><p> </p>').videoOnly,true);
  assert.equal(prepare('<p>Teaching</p><iframe src="https://www.youtube.com/embed/JQEB-AQeu0U"></iframe>').videoOnly,false);
  assert.equal(prepare('<iframe src="https://evil.test/embed/JQEB-AQeu0U"></iframe>').videoOnly,false);
});
