"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export function readPracticeNotificationStatus(target: Pick<Window, "AndroidInterface">) {
  try {
    const status = target.AndroidInterface?.getPracticeNotificationStatus?.();
    return status === "blocked" || status === "silent" ? status : null;
  } catch {
    return null;
  }
}

/** Permission prompts only follow a deliberate tap; refresh on return from Settings. */
export function PracticeNotificationNotice() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<"blocked" | "silent" | null>(null);
  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) setStatus(readPracticeNotificationStatus(window));
    };
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    // Permission dialogs can close without a page visibility event in WebViews.
    const interval = window.setInterval(refresh, 2000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  if (!status) return null;
  return (
    <div role="status" className="my-3 rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm">
      <p className="leading-relaxed text-muted-foreground">
        {t(status === "blocked" ? "practice.notifications_blocked" : "practice.notifications_silent")}
      </p>
      <button type="button" className="mt-1 min-h-11 font-semibold text-primary"
        onClick={() => window.AndroidInterface?.enablePracticeNotifications?.()}>
        {t(status === "blocked" ? "practice.enable_notifications" : "practice.notification_settings")}
      </button>
    </div>
  );
}
