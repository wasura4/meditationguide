"use client";
import { useEffect, useRef, useState } from "react";
import type { MeditationSession } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { MeditationService } from "@/lib/meditationService";

export function SessionReflectionForm({
  session,
}: {
  session: MeditationSession;
}) {
  const { t } = useLanguage();
  const key = `nirvanaya.reflection:${session.userId}:${session.id}`;
  const [notes, setNotes] = useState(() => {
    try {
      return localStorage.getItem(key) || "";
    } catch {
      return "";
    }
  });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const edited = useRef(false);
  useEffect(() => {
    let cancelled = false;
    void MeditationService.getSession(session.id)
      .then((saved) => {
        if (!cancelled && !edited.current && saved?.notes) {
          let draft: string | null = null;
          try {
            draft = localStorage.getItem(key);
          } catch {
            /* Use server notes. */
          }
          if (!draft) {
            setNotes(saved.notes);
            setState("saved");
          }
        }
      })
      .catch(() => {
        /* Keep the durable local draft available. */
      });
    return () => {
      cancelled = true;
    };
  }, [session.id, key]);
  const save = async () => {
    if (state === "saving") return;
    setState("saving");
    try {
      await MeditationService.updateSession(session.id, {
        notes: notes.trim(),
      });
      try {
        localStorage.removeItem(key);
      } catch {
        /* Saved remotely. */
      }
      setState("saved");
    } catch {
      setState("error");
    }
  };
  return (
    <details className="app-card p-5">
      <summary className="min-h-8 cursor-pointer text-sm font-semibold">
        {t("practice.reflection_optional")}
      </summary>
      <div className="mt-4 space-y-3">
        <label
          htmlFor="practice-reflection"
          className="block text-sm text-muted-foreground"
        >
          {t("practice.reflection_prompt")}
        </label>
        <textarea
          id="practice-reflection"
          rows={4}
          maxLength={5000}
          value={notes}
          onChange={(e) => {
            edited.current = true;
            setNotes(e.target.value);
            setState("idle");
            try {
              localStorage.setItem(key, e.target.value);
            } catch {
              /* Keep the current form. */
            }
          }}
          className="w-full rounded-2xl border border-border bg-background p-3 text-base"
        />
        <button
          disabled={state === "saving" || !notes.trim()}
          onClick={save}
          className="min-h-11 rounded-xl bg-primary/15 px-4 font-medium disabled:opacity-40"
        >
          {t(
            state === "saving" ? "practice.saving" : "practice.save_reflection",
          )}
        </button>
        {state === "saved" && (
          <p role="status" className="text-sm text-primary">
            {t("practice.reflection_saved")}
          </p>
        )}
        {state === "error" && (
          <p role="alert" className="text-sm text-destructive">
            {t("practice.reflection_error")}
          </p>
        )}
      </div>
    </details>
  );
}
