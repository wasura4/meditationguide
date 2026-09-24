"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Info, Shield, ChevronRight, LogOut } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppPage } from "@/components/app/AppPage";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { PreferencesSection } from "@/components/settings/PreferencesSection";
import { DataPrivacySection } from "@/components/settings/DataPrivacySection";
import { EditProfileModal } from "@/components/settings/EditProfileModal";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState(false);
  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setError(false);
    try {
      await logout();
      router.replace("/");
    } catch {
      setError(true);
      setSigningOut(false);
    }
  }
  return (
    <ProtectedRoute>
      <AppPage
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
        backHref="/dashboard"
        showSettings={false}
      >
        <div className="mx-auto max-w-2xl space-y-8">
          <ProfileSection onEditProfile={() => setEditing(true)} />
          <PreferencesSection />
          <DataPrivacySection />
          <section
            className="app-card divide-y divide-border/60 overflow-hidden"
            aria-label={t("settings_ui.information")}
          >
            {[
              { href: "/about", title: t("settings.about"), icon: Info },
              {
                href: "/privacy",
                title: t("settings_ui.privacy_policy"),
                icon: Shield,
              },
            ].map(({ href, title, icon: Icon }) => (
              <Link key={href} href={href} className="app-row">
                <Icon size={21} className="shrink-0" aria-hidden="true" />
                <span className="flex-1 text-sm font-medium">{title}</span>
                <ChevronRight size={17} aria-hidden="true" />
              </Link>
            ))}
          </section>
          <button
            onClick={() => {
              setError(false);
              setConfirmLogout(true);
            }}
            className="app-card flex min-h-14 w-full items-center justify-center gap-3 px-5 py-4 text-sm font-semibold"
          >
            <LogOut size={18} aria-hidden="true" />
            {t("auth.sign_out")}
          </button>
        </div>
      </AppPage>
      <EditProfileModal isOpen={editing} onClose={() => setEditing(false)} />
      <SettingsDialog
        open={confirmLogout}
        titleId="logout-title"
        busy={signingOut}
        onClose={() => setConfirmLogout(false)}
      >
        <div className="space-y-5 p-6">
          <h2 id="logout-title" className="text-xl font-semibold">
            {t("auth.sign_out")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(
              user?.isAnonymous
                ? "settings_ui.guest_signout"
                : "settings_ui.signout_help",
            )}
          </p>
          {error && (
            <p role="alert" className="text-sm">
              {t("settings_ui.signout_error")}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              disabled={signingOut}
              onClick={() => setConfirmLogout(false)}
              className="min-h-12 flex-1 rounded-xl border border-border px-4 text-sm"
            >
              {t("common.cancel")}
            </button>
            <button
              disabled={signingOut}
              onClick={signOut}
              className="min-h-12 flex-1 rounded-xl bg-primary/20 px-4 text-sm font-semibold"
            >
              {t(signingOut ? "common.loading" : "auth.sign_out")}
            </button>
          </div>
        </div>
      </SettingsDialog>
    </ProtectedRoute>
  );
}
