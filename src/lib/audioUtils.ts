let bellContext: AudioContext | null = null;
/** Unlock from a user gesture, not from a timer callback several minutes later. */
export async function prepareBellSound(): Promise<void> {
  try {
    const Audio =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!bellContext || bellContext.state === "closed")
      bellContext = new Audio();
    if (bellContext.state === "suspended") await bellContext.resume();
  } catch {
    /* Timer remains usable without audio. */
  }
}
export function playBellSound(enabled?: boolean): void {
  try {
    if (
      enabled === false ||
      (enabled === undefined &&
        localStorage.getItem("meditation_timer_sound") === "false")
    )
      return;
    if (!bellContext || bellContext.state !== "running") return;
    const context = bellContext;
    const now = context.currentTime;
    const master = context.createGain();
    master.connect(context.destination);
    master.gain.setValueAtTime(0.2, now);
    master.gain.exponentialRampToValueAtTime(0.001, now + 3);
    [1, 2, 3, 4.2].forEach((harmonic, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 523.25 * harmonic;
      gain.gain.value = 0.4 / (index + 1);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(now);
      oscillator.stop(now + 3);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    });
    setTimeout(() => master.disconnect(), 3200);
  } catch {
    /* A blocked bell must not prevent saving practice. */
  }
}
