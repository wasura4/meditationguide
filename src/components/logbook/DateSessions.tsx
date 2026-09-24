"use client";
import { ChevronRight, Flower2, MessageSquare } from "lucide-react";
import type { MeditationSession } from "@/types";
import { localDateKey } from "@/lib/logbook";
import { useLogbookFormat } from "./useLogbookFormat";

export function DateSessions({
  sessions,
  onOpen,
}: {
  sessions: MeditationSession[];
  onOpen: (session: MeditationSession) => void;
}) {
  const { date, time, number, t } = useLogbookFormat();
  const groups = new Map<string, MeditationSession[]>();
  sessions.forEach((session) => {
    const key = localDateKey(session.createdAt);
    groups.set(key, [...(groups.get(key) || []), session]);
  });
  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([key, group]) => (
        <section key={key} aria-labelledby={`date-${key}`}>
          <h3
            id={`date-${key}`}
            className="mb-3 px-1 text-sm font-semibold text-muted-foreground"
          >
            {date(group[0].createdAt)}
          </h3>
          <div className="app-card divide-y divide-border/60 overflow-hidden">
            {group.map((session) => (
              <button
                key={session.id}
                onClick={() => onOpen(session)}
                className="flex w-full items-start gap-3 p-4 text-left hover:bg-primary/5 sm:p-5"
                aria-label={t("journal.open_session", {
                  name: session.typeName,
                  date: date(session.createdAt),
                  time: time(session.createdAt),
                })}
              >
                <span
                  aria-hidden="true"
                  className="mt-1 hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 min-[360px]:flex"
                >
                  <Flower2 size={21} strokeWidth={1.5} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-relaxed">
                    {session.typeName}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {time(session.createdAt)} ·{" "}
                    {t("interface.minutes", {
                      count: number(session.duration),
                    })}
                  </span>
                  <span className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1">
                      {t(`journal.status_${session.status}`)}
                    </span>
                    {session.mood && (
                      <span className="text-muted-foreground">
                        {t(`journal.mood_${session.mood}`)}
                      </span>
                    )}
                  </span>
                  {session.notes && (
                    <span className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                      <MessageSquare
                        size={13}
                        className="mt-1 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="line-clamp-2 break-words">
                        {session.notes}
                      </span>
                    </span>
                  )}
                </span>
                <ChevronRight
                  size={17}
                  className="mt-2 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
