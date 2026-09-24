"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { MeditationService } from "@/lib/meditationService";
import {
  hasRecentSignIn,
  runAccountDeletion,
  sessionsCSV,
} from "@/lib/settingsData";
import { SettingsDialog } from "./SettingsDialog";

export function DataPrivacySection() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [exporting, setExporting] = useState<"json" | "csv" | null>(null);
  const [exportStatus, setExportStatus] = useState<"success" | "error" | null>(
    null,
  );
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const pending = useRef(false);

  async function download(kind: "json" | "csv") {
    if (!user || pending.current) return;
    pending.current = true;
    setExporting(kind);
    setExportStatus(null);
    try {
      const sessions = await MeditationService.getAllUserSessions(user.id);
      let learningProgress: unknown[] = [];
      if (kind === "json") {
        const { db } = await import("@/lib/firebase");
        const { collection, getDocs } = await import("firebase/firestore");
        const progress = await getDocs(
          collection(db, "users", user.id, "learning_progress"),
        );
        learningProgress = progress.docs.map((item) => ({
          pathId: item.id,
          ...item.data(),
        }));
      }
      const content =
        kind === "csv"
          ? sessionsCSV(sessions)
          : JSON.stringify(
              {
                user: {
                  id: user.id,
                  displayName: user.displayName,
                  email: user.email,
                  createdAt: user.createdAt,
                  isAnonymous: user.isAnonymous,
                },
                sessions,
                learningProgress,
                exportDate: new Date().toISOString(),
                totalSessions: sessions.length,
                totalMinutes: sessions.reduce(
                  (total, session) => total + session.duration,
                  0,
                ),
              },
              null,
              2,
            );
      const url = URL.createObjectURL(
        new Blob([content], {
          type: kind === "csv" ? "text/csv;charset=utf-8" : "application/json",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `nirvanaya-${kind === "csv" ? "sessions" : "data"}-${new Date().toISOString().slice(0, 10)}.${kind}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Allow browsers/WebViews time to consume the download URL.
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setExportStatus("success");
    } catch {
      setExportStatus("error");
    } finally {
      pending.current = false;
      setExporting(null);
    }
  }

  async function deleteAccount(event: React.FormEvent) {
    event.preventDefault();
    if (!user || confirmation !== "DELETE" || pending.current) return;
    pending.current = true;
    setDeleting(true);
    setDeleteError(null);
    let started = false;
    try {
      const { auth, db } = await import("@/lib/firebase");
      const { deleteUser, getIdTokenResult } = await import("firebase/auth");
      const {
        collection,
        doc,
        getDocs,
        query,
        where,
        writeBatch,
        deleteDoc,
        limit,
      } = await import("firebase/firestore");
      const current = auth.currentUser;
      if (!current || current.uid !== user.id) throw new Error("recent-login");
      await runAccountDeletion({
        verify: async () => {
          const token = await getIdTokenResult(current, true);
          if (!current.isAnonymous && !hasRecentSignIn(token.claims.auth_time))
            throw new Error("recent-login");
          if (auth.currentUser?.uid !== user.id)
            throw new Error("recent-login");
        },
        removeSessions: async () => {
          const snapshot = await getDocs(
            query(
              collection(db, "meditation_sessions"),
              where("userId", "==", user.id),
            ),
          );
          if (auth.currentUser?.uid !== user.id)
            throw new Error("recent-login");
          for (let index = 0; index < snapshot.docs.length; index += 400) {
            const batch = writeBatch(db);
            snapshot.docs
              .slice(index, index + 400)
              .forEach((session) => batch.delete(session.ref));
            started = true;
            await batch.commit();
          }
        },
        removeProfile: async () => {
          // Firestore does not cascade deletion into subcollections.
          while (true) {
            const progress = await getDocs(
              query(
                collection(db, "users", user.id, "learning_progress"),
                limit(400),
              ),
            );
            if (auth.currentUser?.uid !== user.id)
              throw new Error("recent-login");
            if (progress.empty) break;
            const batch = writeBatch(db);
            progress.docs.forEach((item) => batch.delete(item.ref));
            started = true;
            await batch.commit();
          }
          started = true;
          await deleteDoc(doc(db, "users", user.id));
        },
        removeAuth: async () => {
          await deleteUser(current);
        },
      });
      router.replace("/");
    } catch (error) {
      const needsLogin =
        error instanceof Error && error.message === "recent-login";
      setDeleteError(
        needsLogin && !started
          ? "settings_ui.recent_login"
          : started
            ? "settings_ui.delete_partial"
            : "settings_ui.delete_error",
      );
    } finally {
      pending.current = false;
      setDeleting(false);
    }
  }

  return (
    <section aria-labelledby="settings-data-title" className="space-y-3">
      <h2 id="settings-data-title" className="app-section-title">
        {t("settings.sections.data")}
      </h2>
      <div className="app-card divide-y divide-border/60 overflow-hidden">
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Download size={20} aria-hidden="true" />
            <h3 className="font-semibold">
              {t("settings.privacy_settings.export_data")}
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("settings_ui.export_help")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(["json", "csv"] as const).map((kind) => (
              <button
                key={kind}
                disabled={!!exporting || deleting}
                onClick={() => download(kind)}
                className="min-h-12 rounded-xl border border-border px-3 py-3 text-sm font-medium disabled:opacity-50"
              >
                {exporting === kind
                  ? t("settings_ui.exporting")
                  : t("settings_ui.export_format", {
                      format: kind.toUpperCase(),
                    })}
              </button>
            ))}
          </div>
          {exportStatus && (
            <p
              role={exportStatus === "error" ? "alert" : "status"}
              className="text-sm leading-relaxed"
            >
              {t(
                exportStatus === "error"
                  ? "settings_ui.export_error"
                  : "settings_ui.export_ready",
              )}
            </p>
          )}
        </div>
        <div className="space-y-3 p-5 sm:p-6">
          <h3 className="font-semibold">
            {t("settings.privacy_settings.delete_account")}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("settings_ui.delete_scope")}
          </p>
          <button
            onClick={() => {
              setConfirmation("");
              setDeleteError(null);
              setConfirming(true);
            }}
            disabled={!!exporting}
            className="flex min-h-12 items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-destructive disabled:opacity-50"
          >
            <Trash2 size={17} aria-hidden="true" />
            {t("settings.privacy_settings.delete_account")}
          </button>
        </div>
      </div>
      <SettingsDialog
        open={confirming}
        titleId="delete-title"
        busy={deleting}
        onClose={() => setConfirming(false)}
      >
        <form onSubmit={deleteAccount} className="space-y-5 p-5 sm:p-6">
          <h2 id="delete-title" className="text-xl font-semibold">
            {t("settings.privacy_settings.delete_account")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("settings_ui.delete_warning")}
          </p>
          <div>
            <label
              htmlFor="delete-confirmation"
              className="mb-2 block text-sm font-medium"
            >
              {t("settings_ui.type_delete")}
            </label>
            <input
              id="delete-confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              disabled={deleting}
              className="min-h-12 w-full rounded-xl border border-border bg-background px-3"
            />
          </div>
          {deleteError && (
            <p role="alert" className="text-sm leading-relaxed">
              {t(deleteError)}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={deleting}
              onClick={() => setConfirming(false)}
              className="min-h-12 flex-1 rounded-xl border border-border px-3 text-sm"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={deleting || confirmation !== "DELETE"}
              className="min-h-12 flex-1 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive disabled:opacity-40"
            >
              {t(
                deleting
                  ? "settings_ui.deleting"
                  : "settings.privacy_settings.delete_account",
              )}
            </button>
          </div>
        </form>
      </SettingsDialog>
    </section>
  );
}
