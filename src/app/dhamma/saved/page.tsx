"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppPage } from "@/components/app/AppPage";
import { FavoritesLibrary } from "@/components/dhamma/FavoritesLibrary";
import { useLanguage } from "@/contexts/LanguageContext";
export default function SavedArticlesPage() {
  const { t } = useLanguage();
  return (
    <ProtectedRoute>
      <AppPage
        title={t("reader.saved_articles")}
        subtitle={t("reader.saved_subtitle")}
        backHref="/dhamma"
      >
        <FavoritesLibrary />
      </AppPage>
    </ProtectedRoute>
  );
}
