// scripts/color-guard.js
const { execSync } = require('child_process');
const { globSync } = require('glob');
const fs = require('fs');
const patterns = [
  /bg-\[#/,
  /text-\[#/,
  /border-\[#/,
  /ring-\[#/,
  /from-\[#/,
  /to-\[#/,
  /\btext-(blue|green|purple|red|emerald|indigo|violet)-\d+\b/,
  /\bbg-(blue|green|purple|red|emerald|indigo|violet)-\d+\b/,
  /\bborder-(blue|green|purple|red)-\d+\b/,
];
let violations = [];
for (const file of globSync('src/**/*.{ts,tsx,css}')) {
  const data = fs.readFileSync(file, 'utf8');
  const lines = data.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (patterns.some((re) => re.test(line))) {
      violations.push(`${file}:${i + 1}: ${line.trim()}`);
    }
  });
}
if (violations.length) {
  console.error('\nHardcoded colors detected. Use theme tokens instead.');
  console.error(violations.slice(0, 100).join('\n'));
  console.error(`\nTotal matches: ${violations.length}`);
  process.exit(1);
}
console.log('No hardcoded color classes found.');
