"use client";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PREFERENCES_KEY, readPracticePreferences } from "@/lib/appPreferences";

const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];
export function useLogbookFormat() {
  const { t, language } = useLanguage();
  const [hour12, setHour12] = useState(true);
  useEffect(() => {
    const update = () =>
      setHour12(readPracticePreferences().timeFormat === "12h");
    const storage = (event: StorageEvent) => {
      if (event.key === PREFERENCES_KEY) update();
    };
    update();
    window.addEventListener("storage", storage);
    window.addEventListener("nirvanaya-preferences-updated", update);
    return () => {
      window.removeEventListener("storage", storage);
      window.removeEventListener("nirvanaya-preferences-updated", update);
    };
  }, []);
  const month = (date: Date) =>
    `${t(`journal.${MONTHS[date.getMonth()]}`)} ${date.getFullYear()}`;
  const date = (value: Date) => `${value.getDate()} ${month(value)}`;
  const time = (value: Date) =>
    value.toLocaleTimeString(language === "si" ? "si-LK" : "en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12,
    });
  const number = (value: number) =>
    new Intl.NumberFormat(language === "si" ? "si-LK" : "en-GB", {
      maximumFractionDigits: 1,
    }).format(value);
  return { date, month, time, number, t };
}
