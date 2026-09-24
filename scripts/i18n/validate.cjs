const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const flatten = (object, prefix = '', result = {}) => {
  for (const [name, value] of Object.entries(object)) {
    const key = prefix ? `${prefix}.${name}` : name;
    if (value && typeof value === 'object') flatten(value, key, result);
    else result[key] = value;
  }
  return result;
};
const read = lang => flatten(JSON.parse(fs.readFileSync(`src/i18n/locales/${lang}/common.json`, 'utf8').replace(/^\uFEFF/, '')));
const en = read('en'), si = read('si');
const errors = [];
const params = text => [...new Set(text.match(/\{\w+\}/g) || [])].sort().join(',');
for (const [key, value] of Object.entries(en)) {
  if (typeof si[key] !== 'string' || !si[key].trim()) errors.push(`Missing Sinhala: ${key}`);
  else if (params(value) !== params(si[key])) errors.push(`Placeholder mismatch: ${key}`);
}
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { scan(file); continue; }
    if (!/\.tsx?$/.test(file)) continue;
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    function visit(node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 't' && node.arguments.length && ts.isStringLiteralLike(node.arguments[0])) {
        const key = node.arguments[0].text;
        if (!en[key]) errors.push(`Missing English: ${key} (${file})`);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}
scan('src');
console.log(`${Object.keys(en).length} English keys; ${Object.keys(si).length} Sinhala keys.`);
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Translation keys and placeholders passed.');
