"use client";

import Link from "next/link";
import { Bookmark, BookMarked, Library, ChevronRight } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppPage } from "@/components/app/AppPage";
import { DhammaArticleList } from "@/components/dhamma/DhammaArticleList";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DhammaPage() {
  const { t } = useLanguage();
  return (
    <ProtectedRoute>
      <AppPage title={t("navigation.dhamma")} subtitle={t("dhamma.subtitle")}>
        <div className="mb-7 grid grid-cols-2 gap-3">
          {[
            {
              href: "/pitaka",
              icon: BookMarked,
              label: t("dashboard.quick_actions_labels.tripitaka"),
            },
            { href: "/books", icon: Library, label: t("interface.books") },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="app-card flex min-h-16 items-center gap-3 px-4 py-3 text-sm font-semibold"
            >
              <Icon
                size={21}
                className="shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="flex-1">{label}</span>
              <ChevronRight size={16} className="shrink-0" aria-hidden="true" />
            </Link>
          ))}
        </div>
        <Link
          href="/dhamma/saved"
          className="app-card mb-6 flex min-h-14 items-center gap-3 px-4 py-3 text-sm font-semibold"
        >
          <Bookmark
            size={20}
            className="text-muted-foreground"
            aria-hidden="true"
          />
          <span className="flex-1">{t("reader.saved_articles")}</span>
          <ChevronRight size={17} aria-hidden="true" />
        </Link>
        <DhammaArticleList />
      </AppPage>
    </ProtectedRoute>
  );
}
