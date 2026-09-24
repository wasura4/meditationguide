"use client";

import Link from "next/link";
import { BookOpen, Route, ChevronRight } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import { AppPage } from "@/components/app/AppPage";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AnalyticsPage() {
  const { t } = useLanguage();
  return (
    <ProtectedRoute>
      <AppPage
        title={t("interface.tabs.progress")}
        subtitle={t("interface.progress_description")}
      >
        <div className="mb-7 grid grid-cols-2 gap-3">
          {[
            {
              href: "/logbook",
              icon: BookOpen,
              label: t("navigation.logbook"),
            },
            {
              href: "/mypath",
              icon: Route,
              label: t("dashboard.quick_actions_labels.my_path"),
            },
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
        <AnalyticsDashboard />
      </AppPage>
    </ProtectedRoute>
  );
}
