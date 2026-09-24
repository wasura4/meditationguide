"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export function ProfileSection({
  onEditProfile,
}: {
  onEditProfile: () => void;
}) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  if (!user) return null;
  const rows = [
    [
      t("settings.profile_settings.email"),
      user.email || t("settings_ui.no_email"),
    ],
    [
      t("settings_ui.account_type"),
      t(user.isAnonymous ? "settings_ui.guest" : "settings_ui.full_account"),
    ],
    [
      t("settings_ui.member_since"),
      user.createdAt.toLocaleDateString(language === "si" ? "si-LK" : "en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    ],
  ];
  return (
    <section
      aria-labelledby="profile-heading"
      className="app-card overflow-hidden"
    >
      <div className="flex items-center gap-4 p-5 sm:p-6">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xl font-semibold"
        >
          {(user.displayName || t("settings_ui.guest")).charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <h2
            id="profile-heading"
            className="break-words text-lg font-semibold"
          >
            {user.displayName || t("settings_ui.guest")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("settings.account")}
          </p>
        </div>
      </div>
      <dl className="divide-y divide-border/60 border-t border-border/60 px-5 sm:px-6">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 py-4 sm:grid-cols-2 sm:gap-4">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="break-words text-sm sm:text-right">{value}</dd>
          </div>
        ))}
      </dl>
      {user.isAnonymous && (
        <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">
          {t("settings_ui.guest_help")}
        </p>
      )}
      <button
        onClick={onEditProfile}
        className="min-h-12 w-full border-t border-border/60 px-5 py-3 text-sm font-semibold hover:bg-primary/10"
      >
        {t("settings.edit_profile")}
      </button>
    </section>
  );
}
