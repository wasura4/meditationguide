export const PREFERENCES_KEY = "nirvanaya-preferences";
export type PracticePreferences = {
  defaultDuration: number;
  timeFormat: "12h" | "24h";
};
export function parsePracticePreferences(
  raw: string | null,
): PracticePreferences {
  let value: Partial<PracticePreferences> = {};
  try {
    const parsed = JSON.parse(raw || "{}");
    if (parsed && typeof parsed === "object") value = parsed;
  } catch {
    /* Use defaults. */
  }
  return {
    defaultDuration:
      Number.isInteger(value.defaultDuration) &&
      value.defaultDuration! >= 1 &&
      value.defaultDuration! <= 120
        ? value.defaultDuration!
        : 15,
    timeFormat: value.timeFormat === "24h" ? "24h" : "12h",
  };
}
export function readPracticePreferences(): PracticePreferences {
  try {
    return parsePracticePreferences(localStorage.getItem(PREFERENCES_KEY));
  } catch {
    return parsePracticePreferences(null);
  }
}
export function savePracticePreferences(value: PracticePreferences) {
  // Preserve other existing keys for compatibility with older clients.
  let existing = {};
  try {
    const parsed = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || "{}");
    if (parsed && typeof parsed === "object") existing = parsed;
  } catch {
    /* Replace malformed data. */
  }
  localStorage.setItem(
    PREFERENCES_KEY,
    JSON.stringify({ ...existing, ...value }),
  );
  window.dispatchEvent(new Event("nirvanaya-preferences-updated"));
}
