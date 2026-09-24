"use client";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor, Bell } from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/contexts/LanguageContext";
import { LANGUAGE_STORAGE_KEY } from "@/i18n/runtime";
import {
  readPracticePreferences,
  savePracticePreferences,
  type PracticePreferences,
} from "@/lib/appPreferences";

export function PreferencesSection() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [preferences, setPreferences] = useState<PracticePreferences>({
    defaultDuration: 15,
    timeFormat: "12h",
  });
  const [bell, setBell] = useState(true);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<"saved" | "error" | null>(null);
  useEffect(() => {
    setPreferences(readPracticePreferences());
    try {
      setBell(localStorage.getItem("meditation_timer_sound") !== "false");
    } catch {
      /* Save reports unavailable storage. */
    }
    setReady(true);
  }, []);
  const apply = (action: () => void) => {
    try {
      action();
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };
  const update = (next: PracticePreferences) =>
    apply(() => {
      savePracticePreferences(next);
      setPreferences(next);
    });
  const choice = (selected: boolean) =>
    `min-h-12 rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${selected ? "border-primary bg-primary/15" : "border-border hover:bg-muted/40"}`;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="app-section-title">{t("settings.preferences")}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {t("settings_ui.device_preferences")}
        </p>
        <p
          role={status === "error" ? "alert" : "status"}
          className="mt-2 min-h-5 text-sm"
        >
          {status &&
            t(
              status === "error"
                ? "settings.storage_error"
                : "settings_ui.saved",
            )}
        </p>
      </div>
      <fieldset
        disabled={!ready}
        className="app-card min-w-0 space-y-5 p-5 sm:p-6"
      >
        <legend className="sr-only">{t("settings_ui.appearance")}</legend>
        <h3 className="font-semibold">{t("settings_ui.appearance")}</h3>
        <fieldset className="min-w-0">
          <legend className="mb-3 text-sm text-muted-foreground">
            {t("settings.theme_mode")}
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { value: "light", label: "settings.light", icon: Sun },
                { value: "dark", label: "settings.dark", icon: Moon },
                { value: "system", label: "settings.system", icon: Monitor },
              ] as const
            ).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={theme === value}
                className={choice(theme === value)}
                onClick={() =>
                  apply(() => {
                    localStorage.setItem("theme", value);
                    setTheme(value);
                  })
                }
              >
                <Icon size={20} className="mx-auto mb-2" aria-hidden="true" />
                <span className="break-words">{t(label)}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="min-w-0">
          <legend className="mb-3 text-sm text-muted-foreground">
            {t("common.language")}
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {(["si", "en"] as const).map((code) => (
              <button
                type="button"
                key={code}
                lang={code}
                aria-pressed={language === code}
                className={choice(language === code)}
                onClick={() =>
                  apply(() => {
                    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
                    setLanguage(code);
                  })
                }
              >
                {code === "si" ? "සිංහල" : "English"}
              </button>
            ))}
          </div>
        </fieldset>
      </fieldset>
      <fieldset
        disabled={!ready}
        className="app-card min-w-0 space-y-5 p-5 sm:p-6"
      >
        <legend className="sr-only">{t("settings.meditation_heading")}</legend>
        <h3 className="font-semibold">{t("settings.meditation_heading")}</h3>
        <div>
          <label
            htmlFor="default-duration"
            className="mb-2 block text-sm text-muted-foreground"
          >
            {t("settings.meditation_settings.default_duration")}
          </label>
          <select
            id="default-duration"
            className="min-h-12 w-full rounded-xl border border-border bg-background px-3 text-sm"
            value={preferences.defaultDuration}
            onChange={(event) =>
              update({
                ...preferences,
                defaultDuration: Number(event.target.value),
              })
            }
          >
            {Array.from(
              new Set([5, 10, 15, 20, 30, 45, 60, preferences.defaultDuration]),
            )
              .sort((a, b) => a - b)
              .map((value) => (
                <option key={value} value={value}>
                  {t("interface.minutes", { count: value })}
                </option>
              ))}
          </select>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {t("settings_ui.duration_help")}
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-5">
          <div className="flex min-w-0 items-start gap-3">
            <Bell size={20} className="mt-1 shrink-0" aria-hidden="true" />
            <div>
              <p id="bell-label" className="text-sm font-medium">
                {t("settings_ui.bell")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t("settings_ui.bell_help")}
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-labelledby="bell-label"
            aria-checked={bell}
            className="flex min-h-11 min-w-12 shrink-0 items-center"
            onClick={() =>
              apply(() => {
                localStorage.setItem("meditation_timer_sound", String(!bell));
                setBell(!bell);
              })
            }
          >
            <span
              className={`flex h-7 w-12 items-center rounded-full p-1 ${bell ? "bg-primary" : "bg-muted-foreground/40"}`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-background shadow-sm transition-transform ${bell ? "translate-x-5" : ""}`}
              />
            </span>
          </button>
        </div>
        <fieldset className="min-w-0 border-t border-border/60 pt-5">
          <legend className="sr-only">{t("settings_ui.logbook_time")}</legend>
          <p className="mb-3 text-sm text-muted-foreground">
            {t("settings_ui.logbook_time")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(["12h", "24h"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={preferences.timeFormat === value}
                className={choice(preferences.timeFormat === value)}
                onClick={() => update({ ...preferences, timeFormat: value })}
              >
                {t(value === "12h" ? "settings.time_12h" : "settings.time_24h")}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="border-t border-border/60 pt-4 text-xs leading-relaxed text-muted-foreground">
          {t("settings_ui.autosave_info")}
        </p>
      </fieldset>
    </div>
  );
}
