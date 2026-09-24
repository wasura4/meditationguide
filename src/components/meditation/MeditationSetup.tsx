"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Check, Play, Bell } from "lucide-react";
import { TIMER_SETTINGS } from "@/constants";
import { MeditationTypeService } from "@/lib/meditationTypeService";
import { MeditationCategoryService } from "@/lib/meditationCategoryService";
import type { MeditationType } from "@/types";
import type { MeditationCategory } from "@/types/admin";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  readPracticePreferences,
  savePracticePreferences,
} from "@/lib/appPreferences";
import { prepareBellSound, playBellSound } from "@/lib/audioUtils";
import { PracticeNotificationNotice } from "./PracticeNotificationNotice";

interface MeditationSetupProps {
  onStart: (
    type: string,
    duration: number,
    name: string,
    bell: boolean,
    settling: number,
  ) => void | Promise<void>;
  onCancel: () => void;
}

export function MeditationSetup({ onStart }: MeditationSetupProps) {
  const { t } = useLanguage();
  const [selectedType, setSelectedType] = useState("");
  const [durationInput, setDurationInput] = useState("15");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [types, setTypes] = useState<MeditationType[]>([]);
  const [categories, setCategories] = useState<MeditationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [starting, setStarting] = useState(false);
  const [bell, setBell] = useState(true);
  const [settling, setSettling] = useState(5);

  useEffect(() => {
    try {
      setBell(localStorage.getItem("meditation_timer_sound") !== "false");
    } catch {
      /* Storage can be unavailable in a WebView. */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    Promise.all([
      MeditationTypeService.getActiveTypes(),
      MeditationCategoryService.getActiveCategories(),
    ])
      .then(([available, groups]) => {
        if (cancelled) return;
        setTypes(available);
        setCategories(groups);
        if (available.length) {
          let previous: {
            type?: string;
            settling?: number;
          } = {};
          try {
            const parsed = JSON.parse(
              localStorage.getItem("nirvanaya.practice.preferences") || "{}",
            );
            if (parsed && typeof parsed === "object") previous = parsed;
          } catch {
            /* Use defaults. */
          }
          setSelectedType(
            available.some((type) => type.id === previous.type)
              ? previous.type!
              : available[0].id,
          );
          setDurationInput(String(readPracticePreferences().defaultDuration));
          setSettling(
            [0, 5, 10, 15].includes(previous.settling!)
              ? previous.settling!
              : 5,
          );
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const filtered = useMemo(
    () =>
      types.filter((type) => {
        const query = search.trim().toLocaleLowerCase();
        return (
          (!query ||
            `${type.name} ${type.description} ${(type.tags || []).join(" ")}`
              .toLocaleLowerCase()
              .includes(query)) &&
          (selectedCategory === "all" || type.category === selectedCategory)
        );
      }),
    [types, search, selectedCategory],
  );
  const filtering = search.trim() !== "" || selectedCategory !== "all";
  const visible = filtering || showAll ? filtered : filtered.slice(0, 6);
  const selected = types.find((type) => type.id === selectedType);
  const duration = Number(durationInput);
  const validDuration =
    durationInput.trim() !== "" &&
    Number.isInteger(duration) &&
    duration >= TIMER_SETTINGS.minDuration &&
    duration <= TIMER_SETTINGS.maxDuration;
  const start = async () => {
    if (!selected || !validDuration || starting) return;
    setStarting(true);
    try {
      try {
        savePracticePreferences({
          ...readPracticePreferences(),
          defaultDuration: duration,
        });
        localStorage.setItem(
          "nirvanaya.practice.preferences",
          JSON.stringify({ type: selectedType, duration, settling }),
        );
      } catch {
        /* The clock reports recovery storage errors. */
      }
      await onStart(selectedType, duration, selected.name, bell, settling);
    } finally {
      setStarting(false);
    }
  };

  if (loading)
    return (
      <p
        role="status"
        className="app-card p-8 text-center text-muted-foreground"
      >
        {t("common.loading")}
      </p>
    );
  if (error)
    return (
      <div role="alert" className="app-card p-6">
        <p>{t("interface.practice_error")}</p>
        <button
          onClick={() => setAttempt((value) => value + 1)}
          className="mt-3 min-h-11 font-semibold underline"
        >
          {t("common.retry")}
        </button>
      </div>
    );

  return (
    <div className="space-y-6">
      <details className="app-card p-5">
        <summary className="cursor-pointer list-none space-y-2">
          <span className="block text-xs font-medium text-muted-foreground">
            {t("interface.choose_practice")}
          </span>
          <span className="flex items-center justify-between gap-4 font-semibold">
            <span>{selected?.name || t("interface.choose_practice")}</span>
            <span className="shrink-0 text-sm text-primary">
              {t("practice.change")}
            </span>
          </span>
        </summary>
        <div className="mt-5 space-y-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label={t("interface.search_practices")}
                placeholder={t("interface.search_practices")}
                className="min-h-12 w-full rounded-2xl border border-border bg-background py-3 pl-12 pr-4 text-base focus-visible:outline-ring"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              aria-label={t("dhamma.categories")}
              className="min-h-12 rounded-2xl border border-border bg-background px-4 text-sm"
            >
              <option value="all">{t("interface.all_categories")}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <section aria-labelledby="practice-options">
            <h2 id="practice-options" className="app-section-title mb-3">
              {t("interface.choose_practice")}
            </h2>
            {visible.length === 0 ? (
              <p
                role="status"
                className="app-card p-6 text-sm text-muted-foreground"
              >
                {t("interface.no_practices")}
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {visible.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    aria-pressed={selectedType === type.id}
                    onClick={() => {
                      setSelectedType(type.id);
                      // Keep the user's chosen duration when switching practice type.
                    }}
                    className={`app-card flex gap-3 p-4 text-left ${selectedType === type.id ? "border-primary/60 ring-1 ring-primary/30" : ""}`}
                  >
                    <span
                      className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selectedType === type.id ? "border-primary bg-primary/20" : "border-border"}`}
                    >
                      {selectedType === type.id && (
                        <Check size={16} aria-hidden="true" />
                      )}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold leading-relaxed">
                        {type.name}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
                        {type.description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {!filtering && filtered.length > 6 && (
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                aria-expanded={showAll}
                className="mt-2 min-h-11 text-sm font-semibold"
              >
                {showAll ? t("common.show_less") : t("common.view_all")}
              </button>
            )}
          </section>
        </div>
      </details>
      <section className="app-card p-5 sm:p-6" aria-labelledby="duration-title">
        <h2 id="duration-title" className="app-section-title mb-4">
          {t("interface.duration")}
        </h2>
        <div
          role="group"
          aria-label={t("interface.duration")}
          className="mb-5 flex flex-wrap gap-2"
        >
          {[5, 10, 15, 20, 30, 45, 60].map((minutes) => (
            <button
              key={minutes}
              type="button"
              aria-pressed={duration === minutes}
              onClick={() => setDurationInput(String(minutes))}
              className={`min-h-11 min-w-11 rounded-xl border px-3 text-sm font-semibold ${duration === minutes ? "border-primary/50 bg-primary/15" : "border-border bg-background text-muted-foreground"}`}
            >
              {minutes}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label
            htmlFor="meditation-duration"
            className="text-sm text-muted-foreground"
          >
            {t("interface.custom_minutes")}
          </label>
          <input
            id="meditation-duration"
            type="number"
            inputMode="numeric"
            min={TIMER_SETTINGS.minDuration}
            max={TIMER_SETTINGS.maxDuration}
            step="1"
            value={durationInput}
            aria-invalid={!validDuration}
            aria-describedby={!validDuration ? "duration-error" : undefined}
            onChange={(event) => setDurationInput(event.target.value)}
            className="min-h-11 w-24 rounded-xl border border-border bg-background px-3 text-center tabular-nums focus-visible:outline-ring"
          />
        </div>
        {!validDuration && (
          <p
            id="duration-error"
            role="alert"
            className="mt-3 text-sm text-destructive"
          >
            {t("interface.duration_error", {
              min: TIMER_SETTINGS.minDuration,
              max: TIMER_SETTINGS.maxDuration,
            })}
          </p>
        )}
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
          <span id="bell-label" className="flex items-center gap-2 text-sm">
            <Bell size={18} aria-hidden="true" />
            {t("interface.bell")}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={bell}
            aria-labelledby="bell-label"
            onClick={() => {
              const next = !bell;
              setBell(next);
              try {
                localStorage.setItem("meditation_timer_sound", String(next));
              } catch {
                /* Keep the control usable when storage is unavailable. */
              }
            }}
            className="flex min-h-11 min-w-14 items-center justify-center rounded-full"
          >
            <span
              className={`relative block h-7 w-12 rounded-full transition-colors ${bell ? "bg-primary" : "bg-muted-foreground/30"}`}
            >
              <span
                className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-background shadow-sm transition-transform ${bell ? "translate-x-5" : ""}`}
              />
            </span>
          </button>
        </div>
        <button
          type="button"
          onClick={async () => {
            await prepareBellSound();
            playBellSound(true);
          }}
          className="min-h-11 text-sm font-medium text-primary"
        >
          {t("practice.preview_bell")}
        </button>
        {bell && <PracticeNotificationNotice />}
        <div className="mt-3 flex items-center justify-between gap-4 border-t border-border/60 pt-4">
          <label htmlFor="settling-time" className="text-sm">
            {t("practice.settling_time")}
          </label>
          <select
            id="settling-time"
            value={settling}
            onChange={(e) => setSettling(Number(e.target.value))}
            className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm"
          >
            {[0, 5, 10, 15].map((value) => (
              <option key={value} value={value}>
                {value
                  ? t("practice.seconds", { count: value })
                  : t("practice.none")}
              </option>
            ))}
          </select>
        </div>
      </section>
      <div className="space-y-3">
        {selected && (
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            {selected.name}
            {validDuration &&
              ` · ${t("interface.minutes", { count: duration })}`}
          </p>
        )}
        <button
          type="button"
          onClick={start}
          disabled={!selected || !validDuration || starting}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary/20 px-5 py-3 font-semibold hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Play size={18} fill="currentColor" aria-hidden="true" />
          {starting ? t("common.loading") : t("practice.begin")}
        </button>
      </div>
    </div>
  );
}
