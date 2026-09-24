"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Languages,
  Palette,
  ShieldCheck,
  Database,
  Clock,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { LanguageManagement } from "@/components/admin/LanguageManagement";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
export default function AdminSettingsPage() {
  const { adminUser, hasPermission } = useAdminAuth();
  const [tab, setTab] = useState<"system" | "languages">("system");
  return (
    <AdminLayout currentPage="/admin/settings">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Administration
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Manage app appearance, translations, and administrator access.
          </p>
        </div>
        <div
          role="group"
          aria-label="Settings sections"
          className="app-segment inline-flex gap-1 p-1"
        >
          {(["system", "languages"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={tab === value}
              onClick={() => setTab(value)}
              className={`min-h-11 rounded-xl px-5 text-sm font-medium ${tab === value ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >
              {value === "system" ? "Overview" : "Translations"}
            </button>
          ))}
        </div>
        {tab === "languages" ? (
          <LanguageManagement />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <section className="app-card p-6">
                <ShieldCheck
                  size={23}
                  className="mb-4 text-primary"
                  aria-hidden="true"
                />
                <h2 className="text-lg font-semibold">
                  Your administrator account
                </h2>
                <dl className="mt-5 space-y-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="mt-1 font-medium">
                      {adminUser?.displayName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Role</dt>
                    <dd className="mt-1 capitalize">
                      {adminUser?.role.replaceAll("_", " ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">
                      Last sign-in recorded
                    </dt>
                    <dd className="mt-1">
                      {adminUser?.lastLogin?.toLocaleString() || "Not recorded"}
                    </dd>
                  </div>
                </dl>
                <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                  Access is verified against your administrator record. Role
                  changes require trusted administrator provisioning.
                </p>
              </section>
              <section className="app-card p-6">
                <Palette
                  size={23}
                  className="mb-4 text-primary"
                  aria-hidden="true"
                />
                <h2 className="text-lg font-semibold">
                  Appearance and language
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Brand colors and approved Sinhala translations are shared with
                  the app.
                </p>
                <div className="mt-5 space-y-3">
                  {hasPermission("settings", "update") && (
                    <Link
                      href="/admin/theme"
                      className="app-row flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border px-4 text-sm font-medium"
                    >
                      Manage theme
                      <ArrowUpRight size={18} aria-hidden="true" />
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setTab("languages")}
                    className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-border px-4 text-sm font-medium"
                  >
                    Review translations
                    <Languages size={18} aria-hidden="true" />
                  </button>
                </div>
              </section>
            </div>
            <section className="app-card p-6">
              <div className="flex items-center gap-3">
                <Database
                  size={22}
                  className="text-primary"
                  aria-hidden="true"
                />
                <h2 className="text-lg font-semibold">Firebase operations</h2>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Backup schedules, recovery, usage, and service diagnostics are
                managed in Firebase. This panel does not currently monitor their
                live status.
              </p>
              <a
                href="https://console.firebase.google.com/project/nirvanaya-web/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4"
              >
                Open Firebase console
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </section>
            <section className="rounded-2xl border border-dashed border-border p-6">
              <div className="flex items-center gap-3">
                <Clock
                  size={21}
                  className="text-muted-foreground"
                  aria-hidden="true"
                />
                <h2 className="font-semibold">Operations to connect</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Maintenance mode, announcement delivery, automatic sign-out,
                backup controls, and exports need backend workflows before they
                can be managed here. Previous browser-only switches did not
                enable these services.
              </p>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
