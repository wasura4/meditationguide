// Three-second PCM rendering of the same harmonics/envelope as audioUtils.ts.
// Usage: node scripts/generate-practice-bell.cjs <output.wav>
const fs = require('node:fs');
const path = require('node:path');
const output = process.argv[2];
if (!output?.endsWith('.wav')) throw Error('Provide an output .wav path');
const rate = 44100, samples = rate * 3;
const wav = Buffer.alloc(44 + samples * 2);
wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28);
wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(samples * 2, 40);
for (let n = 0; n < samples; n++) {
  const time = n / rate;
  const envelope = 0.2 * Math.pow(0.001 / 0.2, time / 3);
  const value = [1, 2, 3, 4.2].reduce((sum, harmonic, index) =>
    sum + Math.sin(2 * Math.PI * 523.25 * harmonic * time) * (0.4 / (index + 1)), 0);
  wav.writeInt16LE(Math.round(value * envelope * 32767), 44 + n * 2);
}
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, wav);
console.log(`Generated ${samples / rate}s bell: ${output}`);
