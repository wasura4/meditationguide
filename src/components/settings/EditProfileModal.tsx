"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { SettingsDialog } from "./SettingsDialog";

export function EditProfileModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user, updateUserProfile } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const pending = useRef(false);
  useEffect(() => {
    if (isOpen) {
      setName(user?.displayName || "");
      setError(false);
    }
  }, [isOpen, user?.displayName]);
  const valid = name.trim().length > 0 && name.trim().length <= 50;
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || pending.current) return;
    pending.current = true;
    setSaving(true);
    setError(false);
    try {
      await updateUserProfile({ displayName: name.trim() });
      onClose();
    } catch {
      setError(true);
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }
  return (
    <SettingsDialog
      open={isOpen}
      titleId="edit-profile-title"
      busy={saving}
      onClose={onClose}
    >
      <form onSubmit={save} className="space-y-5 p-5 sm:p-6">
        <h2 id="edit-profile-title" className="text-xl font-semibold">
          {t("settings.edit_profile")}
        </h2>
        <div>
          <label
            htmlFor="profile-name"
            className="mb-2 block text-sm font-medium"
          >
            {t("settings.profile_settings.display_name")}
          </label>
          <input
            id="profile-name"
            autoComplete="nickname"
            required
            maxLength={50}
            value={name}
            disabled={saving}
            onChange={(event) => setName(event.target.value)}
            className="min-h-12 w-full rounded-xl border border-border bg-background px-3"
            aria-describedby="profile-name-help"
          />
          <p
            id="profile-name-help"
            className="mt-2 text-xs text-muted-foreground"
          >
            {t("settings_ui.name_help")}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">
            {t("settings.profile_settings.email")}
          </p>
          <p className="mt-1 break-words text-sm text-muted-foreground">
            {user?.email || t("settings_ui.no_email")}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {t("settings_ui.email_readonly")}
          </p>
        </div>
        {error && (
          <p role="alert" className="text-sm">
            {t("settings_ui.profile_error")}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="min-h-12 flex-1 rounded-xl border border-border px-4 text-sm disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={saving || !valid || name.trim() === user?.displayName}
            className="min-h-12 flex-1 rounded-xl bg-primary/20 px-4 text-sm font-semibold disabled:opacity-50"
          >
            {t(saving ? "settings_ui.saving" : "settings.save_changes")}
          </button>
        </div>
      </form>
    </SettingsDialog>
  );
}
