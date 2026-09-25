"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import { AppPage } from "@/components/app/AppPage";
import { useLanguage } from "@/contexts/LanguageContext";
export default function AnalyticsPage() {
  const { t } = useLanguage();
  return (
    <ProtectedRoute>
      <AppPage
        artwork="progress"
        title={t("interface.tabs.progress")}
        subtitle={t("progress.subtitle")}
      >
        <AnalyticsDashboard />
      </AppPage>
    </ProtectedRoute>
  );
}
