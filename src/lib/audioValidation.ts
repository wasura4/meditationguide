export const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
export function validateAudioFile(file: { type: string; size: number }): string | null {
  if (!file.type.startsWith('audio/')) return 'Choose a supported audio file.';
  if (!file.size) return 'This file is empty. Choose another audio file.';
  if (file.size > MAX_AUDIO_BYTES) return 'Audio files must be 50 MB or smaller.';
  return null;
}
export function parseAudioDuration(value: string): number | null {
  if (!/^\d+:[0-5]\d$/.test(value.trim())) return null;
  const [minutes, seconds] = value.trim().split(':').map(Number);
  const total = minutes * 60 + seconds;
  return Number.isSafeInteger(total) && total > 0 ? total : null;
}
