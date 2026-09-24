"use client";
import { useEffect, useRef, useState } from "react";
import { X, Pencil, Trash2 } from "lucide-react";
import type { MeditationSession } from "@/types";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { useLogbookFormat } from "./useLogbookFormat";

export function SessionDetails({
  session,
  onClose,
  onSaveNote,
  onDelete,
}: {
  session: MeditationSession;
  onClose: () => void;
  onSaveNote: (id: string, notes: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { date, time, number, t } = useLogbookFormat();
  const [mode, setMode] = useState<"view" | "edit" | "delete" | "discard">(
    "view",
  );
  const [note, setNote] = useState(session.notes || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);
  const pending = useRef(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const safeActionRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (mode === "edit") noteRef.current?.focus();
    else if (mode === "delete" || mode === "discard")
      safeActionRef.current?.focus();
    else closeRef.current?.focus();
  }, [mode]);
  const dirty = note !== (session.notes || "");
  const close = () => {
    if (busy) return;
    if (mode === "edit" && dirty) setMode("discard");
    else if (mode === "discard") setMode("edit");
    else onClose();
  };
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (pending.current || note.length > 5000) return;
    pending.current = true;
    setBusy(true);
    setError(false);
    try {
      await onSaveNote(session.id, note.trim());
      setNote(note.trim());
      setMode("view");
      setSaved(true);
    } catch {
      setError(true);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function remove() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(false);
    try {
      await onDelete(session.id);
    } catch {
      setError(true);
      pending.current = false;
      setBusy(false);
    }
  }
  const action =
    "min-h-12 rounded-xl border border-border px-4 py-3 text-sm font-medium disabled:opacity-40";
  return (
    <SettingsDialog open titleId="session-title" busy={busy} onClose={close}>
      <div className="p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
              {date(session.createdAt)} · {time(session.createdAt)}
            </p>
            <h2
              id="session-title"
              className="break-words text-lg font-semibold"
            >
              {session.typeName}
            </h2>
          </div>
          <button
            ref={closeRef}
            onClick={close}
            disabled={busy}
            className="app-icon-button shrink-0"
            aria-label={t("common.close")}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {mode === "discard" ? (
          <div className="space-y-4">
            <p className="text-sm">{t("journal.discard_prompt")}</p>
            <div className="grid gap-3">
              <button
                ref={safeActionRef}
                className={action}
                onClick={() => setMode("edit")}
              >
                {t("journal.keep_editing")}
              </button>
              <button className={action} onClick={onClose}>
                {t("journal.discard")}
              </button>
            </div>
          </div>
        ) : mode === "delete" ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed">
              {t("journal.delete_warning")}
            </p>
            {error && (
              <p role="alert" className="text-sm">
                {t("journal.delete_error")}
              </p>
            )}
            <div className="grid gap-3">
              <button
                ref={safeActionRef}
                className={action}
                disabled={busy}
                onClick={() => {
                  setMode("view");
                  setError(false);
                }}
              >
                {t("common.cancel")}
              </button>
              <button
                className={`${action} text-destructive`}
                disabled={busy}
                onClick={remove}
              >
                {t(busy ? "settings_ui.deleting" : "journal.delete_session")}
              </button>
            </div>
          </div>
        ) : mode === "edit" ? (
          <form onSubmit={save} className="space-y-4">
            <label htmlFor="session-note" className="block text-sm font-medium">
              {t("journal.reflection")}
            </label>
            <textarea
              ref={noteRef}
              id="session-note"
              rows={8}
              maxLength={5000}
              value={note}
              disabled={busy}
              onChange={(event) => setNote(event.target.value)}
              className="w-full resize-y rounded-xl border border-border bg-background p-3 text-sm leading-relaxed"
              aria-describedby="note-help"
            />
            <p id="note-help" className="text-xs text-muted-foreground">
              {t("journal.note_help")} · {number(note.length)} / 5,000
            </p>
            {error && (
              <p role="alert" className="text-sm">
                {t("journal.save_error")}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={`${action} flex-1`}
                disabled={busy}
                onClick={() => {
                  setNote(session.notes || "");
                  setMode("view");
                  setError(false);
                }}
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                className={`${action} flex-1 bg-primary/15`}
                disabled={busy || !dirty}
              >
                {t(busy ? "settings_ui.saving" : "settings.save_changes")}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            {saved && (
              <p role="status" className="text-sm">
                {t("journal.note_saved")}
              </p>
            )}
            <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-primary/5 p-4 text-sm">
              {[
                [
                  t("logbook.session_details.duration"),
                  t("interface.minutes", { count: number(session.duration) }),
                ],
                [t("journal.status"), t(`journal.status_${session.status}`)],
                [
                  t("journal.started"),
                  `${date(session.startTime)} · ${time(session.startTime)}`,
                ],
                [
                  t("journal.ended"),
                  session.endTime
                    ? `${date(session.endTime)} · ${time(session.endTime)}`
                    : t("journal.not_recorded"),
                ],
                [
                  t("journal.mood"),
                  session.mood
                    ? t(`journal.mood_${session.mood}`)
                    : t("journal.not_recorded"),
                ],
                [
                  t("journal.rating"),
                  session.rating
                    ? `${session.rating} / 5`
                    : t("journal.not_recorded"),
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-1 break-words leading-relaxed">{value}</dd>
                </div>
              ))}
            </dl>
            <section>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">
                  {t("journal.reflection")}
                </h3>
                <button
                  onClick={() => {
                    setError(false);
                    setMode("edit");
                    setSaved(false);
                  }}
                  className="flex min-h-11 items-center gap-2 text-sm font-medium"
                >
                  <Pencil size={15} aria-hidden="true" />
                  {t(session.notes ? "journal.edit_note" : "journal.add_note")}
                </button>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                {session.notes || t("journal.no_reflection")}
              </p>
            </section>
            {(["insights", "distractions"] as const).map((field) =>
              session[field]?.length ? (
                <section key={field}>
                  <h3 className="mb-2 text-sm font-semibold">
                    {t(`journal.${field}`)}
                  </h3>
                  <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
                    {session[field]!.map((value, index) => (
                      <li key={index} className="break-words">
                        {value}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null,
            )}
            <button
              className={`${action} flex w-full items-center justify-center gap-2 text-destructive`}
              onClick={() => {
                setError(false);
                setMode("delete");
              }}
            >
              <Trash2 size={16} aria-hidden="true" />
              {t("journal.delete_session")}
            </button>
          </div>
        )}
      </div>
    </SettingsDialog>
  );
}
