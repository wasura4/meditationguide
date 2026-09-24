import type { MeditationSession } from "@/types";

export function csvCell(value: unknown): string {
  let text = String(value ?? "");
  // Prevent text fields being executed as spreadsheet formulas, including
  // formulas hidden behind leading whitespace, tabs or line breaks.
  if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
export function sessionsCSV(sessions: MeditationSession[]): string {
  const rows: unknown[][] = [
    [
      "Date",
      "Type",
      "Duration (minutes)",
      "Status",
      "Rating",
      "Mood",
      "Notes",
      "Distractions",
      "Insights",
      "Start Time",
      "End Time",
    ],
  ];
  for (const session of sessions)
    rows.push([
      session.createdAt.toISOString(),
      session.typeName,
      session.duration,
      session.status,
      session.rating ?? "",
      session.mood ?? "",
      session.notes ?? "",
      (session.distractions ?? []).join("; "),
      (session.insights ?? []).join("; "),
      session.startTime.toISOString(),
      session.endTime?.toISOString() ?? "",
    ]);
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function hasRecentSignIn(authTime: unknown, now = Date.now()): boolean {
  return (
    typeof authTime === "number" &&
    Number.isFinite(authTime) &&
    now - authTime * 1000 >= 0 &&
    now - authTime * 1000 < 5 * 60 * 1000
  );
}

// Keep the authentication preflight ahead of every destructive operation.
export async function runAccountDeletion(steps: {
  verify: () => Promise<void>;
  removeSessions: () => Promise<void>;
  removeProfile: () => Promise<void>;
  removeAuth: () => Promise<void>;
}) {
  await steps.verify();
  await steps.removeSessions();
  await steps.removeProfile();
  await steps.removeAuth();
}
