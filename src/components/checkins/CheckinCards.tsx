"use client";
import { ClipboardCheck, ChevronRight } from "lucide-react";
import { useCheckins } from "./CheckinProvider";
import { useLanguage } from "@/contexts/LanguageContext";
import { checkinSummary } from "@/lib/checkins";

export function DailyCheckinCard() {
  const data = useCheckins();
  const { t } = useLanguage();
  if (!data) return null;
  if (data.error)
    return (
      <div className="app-card p-5 text-sm" role="alert">
        <p>{t("checkin.load_error")}</p>
        <button onClick={data.retry} className="min-h-11 underline">
          {t("common.retry")}
        </button>
      </div>
    );
  if (data.loading || !data.questions.length) return null;
  const count = data.questions.filter((question) =>
    data.today.some((answer) => answer.questionId === question.id),
  ).length;
  return (
    <button
      onClick={data.open}
      className="app-card flex w-full items-center gap-4 p-5 text-left"
    >
      <span className="rounded-2xl bg-primary/10 p-3 text-primary">
        <ClipboardCheck size={24} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{t("checkin.daily")}</span>
        <span className="mt-1 block text-sm text-muted-foreground">
          {t("checkin.count", { count, total: data.questions.length })} ·{" "}
          {t(
            count === data.questions.length
              ? "checkin.review"
              : "checkin.begin",
          )}
        </span>
      </span>
      <ChevronRight size={19} className="shrink-0" aria-hidden="true" />
    </button>
  );
}

export function CheckinProgress() {
  const data = useCheckins();
  const { t, language } = useLanguage();
  if (!data) return null;
  if (data.error) return <DailyCheckinCard />;
  if (data.loading)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {t("checkin.loading")}
      </p>
    );
  if (!data.questions.length && !data.answers.length) return null;
  const summary = checkinSummary(data.answers);
  const dateFormat = new Intl.DateTimeFormat(
    language === "si" ? "si-LK" : "en-GB",
    { month: "short", day: "numeric", weekday: "short" },
  );
  const number = new Intl.NumberFormat(language === "si" ? "si-LK" : "en-GB");
  return (
    <section
      className="app-card space-y-5 p-5 sm:p-6"
      aria-labelledby="checkin-progress-title"
    >
      <header>
        <p className="text-xs font-medium text-muted-foreground">
          {t("checkin.last30")}
        </p>
        <h2 id="checkin-progress-title" className="mt-1 text-xl font-semibold">
          {t("checkin.journey")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("checkin.analytics_hint")}
        </p>
      </header>
      <div className="grid grid-cols-3 gap-2">
        {[
          [summary.days.length, "checkin.days"],
          [summary.yes, "checkin.yes_answers"],
          [summary.no, "checkin.no_answers"],
        ].map(([count, label]) => (
          <div key={String(label)} className="rounded-2xl bg-muted/50 p-3">
            <p className="text-2xl font-semibold tabular-nums">
              {number.format(Number(count))}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {t(String(label))}
            </p>
          </div>
        ))}
      </div>
      {!!data.questions.length && (
        <button
          onClick={data.open}
          className="min-h-11 rounded-xl border border-border px-4 text-sm font-medium"
        >
          {t("checkin.today")}
        </button>
      )}
      {!summary.days.length ? (
        <p className="text-sm text-muted-foreground">{t("checkin.empty")}</p>
      ) : (
        <details className="rounded-2xl border border-border p-4">
          <summary className="cursor-pointer py-1 text-sm font-semibold">
            {t("checkin.history")}
          </summary>
          <div className="mt-3 divide-y divide-border">
            {summary.days.map(([day, values]) => (
              <details key={day} className="py-3">
                <summary className="cursor-pointer text-sm">
                  <span className="font-medium">
                    {dateFormat.format(new Date(`${day}T12:00:00`))}
                  </span>
                  <span className="ml-2 text-muted-foreground">
                    {t("checkin.day_summary", {
                      yes: values.yes,
                      no: values.no,
                    })}
                  </span>
                </summary>
                <ul className="mt-3 space-y-3">
                  {values.answers.map((answer) => (
                    <li
                      key={answer.id}
                      className="flex items-start justify-between gap-4 text-sm leading-relaxed"
                    >
                      <span>
                        {language === "si" ? answer.titleSi : answer.titleEn}
                      </span>
                      <span className="shrink-0 rounded-lg bg-muted px-2 py-1 text-xs font-medium">
                        {t(answer.answer ? "checkin.yes" : "checkin.no")}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </details>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">
        {t("checkin.private")}
      </p>
    </section>
  );
}
