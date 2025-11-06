#!/usr/bin/env node
// Simple i18n key collector: scans src for t('key') usages,
// compares with en/common.json, and reports missing/unused keys.
// Usage:
//   node scripts/i18n/collect-keys.mjs          # prints report
//   node scripts/i18n/collect-keys.mjs --check  # exits 1 if missing keys
//   node scripts/i18n/collect-keys.mjs --write  # writes missing keys into en/common.json with placeholder English

import fs from 'fs';
import path from 'path';

const root = process.cwd();
const SRC_DIR = path.join(root, 'src');
const LOCALE_EN = path.join(root, 'src', 'i18n', 'locales', 'en', 'common.json');

const args = new Set(process.argv.slice(2));

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '.next') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (/\.(t|j)sx?$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function collectKeysFromFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const keys = new Set();
  const re = /\bt\(\s*['"]([^'"\)]+)['"]\s*\)/g; // matches t('key.path')
  let m;
  while ((m = re.exec(text))) {
    keys.add(m[1]);
  }
  return keys;
}

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') {
      flatten(v, key, out);
    } else {
      out[key] = String(v ?? '');
    }
  }
  return out;
}

function unflatten(map) {
  const rootObj = {};
  for (const [fullKey, value] of Object.entries(map)) {
    const parts = fullKey.split('.');
    let curr = rootObj;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (i === parts.length - 1) {
        curr[p] = value;
      } else {
        curr[p] = curr[p] || {};
        curr = curr[p];
      }
    }
  }
  return rootObj;
}

function main() {
  if (!fs.existsSync(LOCALE_EN)) {
    console.error(`Missing ${LOCALE_EN}`);
    process.exit(2);
  }

  const files = walk(SRC_DIR);
  const usedKeys = new Set();
  for (const f of files) {
    collectKeysFromFile(f).forEach(k => usedKeys.add(k));
  }

  let enRaw = fs.readFileSync(LOCALE_EN, 'utf8');
  // Strip UTF-8 BOM if present
  if (enRaw.charCodeAt(0) === 0xFEFF) {
    enRaw = enRaw.slice(1);
  }
  const enJson = JSON.parse(enRaw);
  const enFlat = flatten(enJson);
  const enKeys = new Set(Object.keys(enFlat));

  const missing = [...usedKeys].filter(k => !enKeys.has(k)).sort();
  const unused = [...enKeys].filter(k => !usedKeys.has(k)).sort();

  console.log(`i18n scan complete.`);
  console.log(`  Used keys:    ${usedKeys.size}`);
  console.log(`  EN keys:      ${enKeys.size}`);
  console.log(`  Missing in EN: ${missing.length}`);
  if (missing.length) {
    console.log('\nMissing keys:');
    missing.forEach(k => console.log(' -', k));
  }
  console.log(`\nUnused in EN: ${unused.length}`);

  if (args.has('--write') && missing.length) {
    const updated = { ...enFlat };
    for (const k of missing) {
      updated[k] = k; // placeholder English = key
    }
    const next = unflatten(updated);
    fs.writeFileSync(LOCALE_EN, JSON.stringify(next, null, 2) + '\n', 'utf8');
    console.log(`\nUpdated ${LOCALE_EN} with ${missing.length} new keys.`);
  }

  if (args.has('--check') && missing.length) {
    process.exit(1);
  }
}

main();
