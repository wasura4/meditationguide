export interface CheckinQuestion {
  id: string;
  titleEn: string;
  titleSi: string;
  order: number;
  status: "draft" | "active" | "archived";
  version: number;
}

export interface CheckinAnswer {
  id: string;
  day: string;
  questionId: string;
  questionVersion: number;
  titleEn: string;
  titleSi: string;
  answer: boolean;
}

export function checkinDay(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const day = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  return {
    day,
    start,
    end,
    startOffset: start.getTimezoneOffset(),
    endOffset: end.getTimezoneOffset(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "local",
  };
}

export function checkinSummary(answers: CheckinAnswer[]) {
  const days = new Map<
    string,
    { yes: number; no: number; answers: CheckinAnswer[] }
  >();
  for (const answer of answers) {
    const entry = days.get(answer.day) || { yes: 0, no: 0, answers: [] };
    entry[answer.answer ? "yes" : "no"]++;
    entry.answers.push(answer);
    days.set(answer.day, entry);
  }
  return {
    days: [...days].sort(([a], [b]) => b.localeCompare(a)),
    yes: answers.filter((answer) => answer.answer).length,
    no: answers.filter((answer) => !answer.answer).length,
  };
}
