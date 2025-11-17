/**
 * Plays a meditation bell sound using Web Audio API
 * This creates a pleasant bell-like tone without needing external audio files
 */
export const playBellSound = (): void => {
  try {
    // Check if sound is enabled
    const soundEnabled = localStorage.getItem('meditation_timer_sound') !== 'false';
    if (!soundEnabled) {
      return;
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Create oscillators for a bell-like sound (multiple harmonics)
    const now = audioContext.currentTime;
    const duration = 2.5; // 2.5 seconds

    // Fundamental frequency (around C5)
    const fundamental = 523.25;

    // Create multiple oscillators for harmonics (bell-like sound)
    const oscillators = [
      { freq: fundamental, gain: 0.4 },
      { freq: fundamental * 2, gain: 0.2 },
      { freq: fundamental * 3, gain: 0.15 },
      { freq: fundamental * 4.2, gain: 0.1 },
    ];

    const masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);
    masterGain.gain.setValueAtTime(0.3, now);
    masterGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    oscillators.forEach(({ freq, gain }) => {
      const osc = audioContext.createOscillator();
      const oscGain = audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      oscGain.gain.setValueAtTime(gain, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc.connect(oscGain);
      oscGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + duration);
    });

    // Clean up after sound finishes
    setTimeout(() => {
      audioContext.close();
    }, duration * 1000 + 100);
  } catch (error) {
    console.error('Failed to play bell sound:', error);
  }
};
