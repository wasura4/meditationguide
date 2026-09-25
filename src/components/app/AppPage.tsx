"use client";

import Link from "next/link";
import { ChevronLeft, Settings } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArtworkHeader, type PageArtwork } from "./ArtworkHeader";

/** Shared large-title screen for the web app and both native WebViews. */
export function AppPage({
  title,
  subtitle,
  artwork,
  backHref,
  showSettings = true,
  children,
}: {
  title: string;
  subtitle?: string;
  artwork?: PageArtwork;
  backHref?: string;
  showSettings?: boolean;
  children: React.ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <div className="app-screen">
      <header className="app-toolbar">
        <div className="mx-auto flex min-h-14 max-w-5xl items-center justify-between px-5 sm:px-8">
          {backHref ? (
            <Link
              href={backHref}
              className="inline-flex min-h-11 items-center gap-1 text-sm font-medium"
            >
              <ChevronLeft size={20} aria-hidden="true" />
              {t("common.back")}
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center text-sm font-semibold tracking-wide"
            >
              {t("app.name")}
            </Link>
          )}
          {showSettings && (
            <Link
              href="/settings"
              aria-label={t("navigation.settings")}
              className="app-icon-button"
            >
              <Settings size={21} strokeWidth={1.7} aria-hidden="true" />
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-8 pt-6 sm:px-8 sm:pt-8">
        {artwork ? <ArtworkHeader artwork={artwork} title={title} subtitle={subtitle} /> : <div className="mb-7 space-y-2">
          <h1 className="text-[2rem] font-bold leading-snug tracking-tight sm:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>}
        {children}
      </main>
    </div>
  );
}
