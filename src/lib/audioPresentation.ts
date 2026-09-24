export function audioTime(seconds: number): string {
  const total = Math.floor(Number.isFinite(seconds) ? Math.max(0, seconds) : 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = String(total % 60).padStart(2, "0");
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${remainder}`
    : `${minutes}:${remainder}`;
}

export function audioMatchesDuration(seconds: number, filter: string): boolean {
  if (filter === "all") return true;
  if (!Number.isFinite(seconds) || seconds <= 0) return false;
  if (filter === "short") return seconds < 600;
  if (filter === "medium") return seconds >= 600 && seconds <= 1800;
  return seconds > 1800;
}
