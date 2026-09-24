"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, CloudOff, RotateCcw } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MeditationSetup } from "@/components/meditation/MeditationSetup";
import { MeditationTimer } from "@/components/meditation/MeditationTimer";
import { SessionReflectionForm } from "@/components/meditation/SessionReflectionForm";
import { AppPage } from "@/components/app/AppPage";
import { usePracticeFocus } from "@/components/app/AppChrome";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayer } from "@/contexts/PlayerContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePracticeClock } from "@/hooks/usePracticeClock";
import { practiceTime } from "@/lib/meditationClock";
import { practiceSession } from "@/lib/practiceTransactions";

export default function MeditatePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const search = useSearchParams();
  const practice = usePracticeClock(user?.id);
  const { clock } = practice;
  const setFocus = usePracticeFocus();
  const player = usePlayer();
  const focused = !!clock && clock.phase !== "finished";
  useEffect(() => {
    setFocus(focused);
    // Setup may have scrolled to Begin; enter and leave focus at the top.
    window.scrollTo({ top: 0, behavior: "instant" });
    return () => setFocus(false);
  }, [focused, setFocus]);
  const storageNotice = practice.storageError && (
    <p
      role="alert"
      className="mx-auto max-w-lg rounded-2xl border border-destructive/30 bg-card p-4 text-sm text-destructive"
    >
      {t("practice.storage_error")}
    </p>
  );
  let content;
  if (!practice.ready)
    content = (
      <AppPage title={t("navigation.meditate")}>
        <p role="status">{t("common.loading")}</p>
      </AppPage>
    );
  else if (clock && clock.phase !== "finished")
    content = (
      <>
        {storageNotice}
        <MeditationTimer {...practice} clock={clock} />
      </>
    );
  else if (clock)
    content = (
      <AppPage
        title={t(
          clock.outcome === "completed"
            ? "practice.complete"
            : "practice.ended",
        )}
      >
        <div className="mx-auto max-w-md space-y-5">
          {storageNotice}
          <section className="app-card px-6 py-8 text-center">
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary">
              <Check size={26} />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {clock.typeName}
            </p>
            <p className="my-4 text-5xl font-light tabular-nums">
              {practiceTime(Math.floor(clock.elapsedMs / 1000) * 1000)}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("practice.time_practised")}
            </p>
            <p className="mt-5 text-sm leading-relaxed">
              {t("practice.finish_hint")}
            </p>
            <div
              role="status"
              className="mt-6 border-t border-border pt-4 text-sm"
            >
              {t(
                practice.saveState === "saved"
                  ? "practice.saved"
                  : practice.saveState === "saving"
                    ? "practice.saving"
                    : "practice.pending",
              )}
            </div>
            {practice.saveState !== "saved" &&
              practice.saveState !== "saving" && (
                <button
                  onClick={() => void practice.retrySave()}
                  className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary/15 px-4 font-semibold"
                >
                  <CloudOff size={17} />
                  {t("practice.retry_save")}
                </button>
              )}
          </section>
          {practice.saveState === "saved" && (
            <SessionReflectionForm
              key={clock.id}
              session={practiceSession(clock)}
            />
          )}
          {practice.saveState === "saved" && (
            <button
              onClick={practice.discard}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-primary-foreground"
            >
              <RotateCcw size={18} />
              {t("practice.new_session")}
            </button>
          )}
          <Link
            href="/logbook"
            className="flex min-h-12 items-center justify-center rounded-2xl border border-border text-sm font-medium"
          >
            {t("practice.logbook")}
          </Link>
          <Link
            href="/dashboard"
            className="flex min-h-11 items-center justify-center text-sm text-muted-foreground"
          >
            {t("navigation.home")}
          </Link>
        </div>
      </AppPage>
    );
  else
    content = (
      <AppPage
        title={t("navigation.meditate")}
        subtitle={t("interface.setup_description")}
      >
        <div className="mx-auto max-w-xl space-y-4">
          {storageNotice}
          <MeditationSetup
            onCancel={() => {}}
            onStart={(type, duration, name, bell, settling) => {
              if (player.isPlaying) player.toggle();
              practice.begin(
                type,
                name,
                duration,
                bell,
                settling,
                search.get("eventId") || undefined,
              );
            }}
          />
        </div>
      </AppPage>
    );
  return <ProtectedRoute>{content}</ProtectedRoute>;
}
