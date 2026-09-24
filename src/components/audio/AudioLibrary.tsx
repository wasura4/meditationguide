"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Search } from "lucide-react";
import { db } from "@/lib/firebase";
import { isPublishedAudio } from "@/lib/editorial";
import { audioMatchesDuration } from "@/lib/audioPresentation";
import type { KamatahanAudio } from "@/types/admin";
import { useLanguage } from "@/contexts/LanguageContext";
import { AudioPlayer } from "./AudioPlayer";
import { ListeningState } from "./ListeningState";

export function AudioLibrary() {
  const { t, language } = useLanguage();
  const [tracks, setTracks] = useState<KamatahanAudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [audioLanguage, setAudioLanguage] = useState("all");
  const [length, setLength] = useState("all");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    getDocs(collection(db, "kamatahan_audio"))
      .then((snapshot) => {
        if (active)
          setTracks(
            snapshot.docs
              .map(
                (item) => ({ ...item.data(), id: item.id }) as KamatahanAudio,
              )
              .filter(isPublishedAudio),
          );
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  const results = useMemo(
    () =>
      tracks
        .filter(
          (track) =>
            (category === "all" || track.category === category) &&
            (audioLanguage === "all" || track.language === audioLanguage) &&
            audioMatchesDuration(track.duration, length) &&
            `${track.title} ${track.description}`
              .toLocaleLowerCase()
              .includes(search.trim().toLocaleLowerCase()),
        )
        .sort((a, b) => a.title.localeCompare(b.title, language)),
    [tracks, category, audioLanguage, length, search, language],
  );
  const filtered =
    !!search ||
    category !== "all" ||
    audioLanguage !== "all" ||
    length !== "all";
  const clear = () => {
    setSearch("");
    setCategory("all");
    setAudioLanguage("all");
    setLength("all");
  };
  return (
    <div className="space-y-5">
      <label className="listen-search">
        <Search size={19} aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("listen.search_recordings")}
          aria-label={t("listen.search_recordings")}
        />
      </label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="listen-filter">
          {t("listen.topic")}
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">{t("listen.all_topics")}</option>
            {[
              "meditation",
              "dhamma_talk",
              "chanting",
              "guided_meditation",
              "background",
            ].map((item) => (
              <option key={item} value={item}>
                {t(`listen.category.${item}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="listen-filter">
          {t("listen.language_label")}
          <select
            value={audioLanguage}
            onChange={(event) => setAudioLanguage(event.target.value)}
          >
            <option value="all">{t("listen.all_languages")}</option>
            {["si", "en", "pa"].map((item) => (
              <option key={item} value={item}>
                {t(`listen.language.${item}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="listen-filter col-span-2 sm:col-span-1">
          {t("listen.length")}
          <select
            value={length}
            onChange={(event) => setLength(event.target.value)}
          >
            {["all", "short", "medium", "long"].map((item) => (
              <option key={item} value={item}>
                {t(`listen.length_${item}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {loading || error ? (
        <ListeningState
          loading={loading}
          error={error}
          retry={() => setAttempt((value) => value + 1)}
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" role="status">
              {t("listen.recording_count", { count: results.length })}
            </p>
            {filtered && (
              <button
                type="button"
                className="min-h-11 text-sm font-medium underline underline-offset-4"
                onClick={clear}
              >
                {t("listen.clear_filters")}
              </button>
            )}
          </div>
          {results.length ? (
            <div className="divide-y divide-border rounded-3xl border border-border bg-card p-2">
              {results.map((track) => (
                <AudioPlayer key={track.id} audio={track} />
              ))}
            </div>
          ) : (
            <ListeningState
              empty={filtered ? "listen.no_matches" : "listen.no_recordings"}
            />
          )}
        </>
      )}
    </div>
  );
}
