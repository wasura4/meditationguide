"use client";

import React, { useEffect, useState } from 'react';
import { AdminProtectedRoute } from '@/components/admin/AdminProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/components/ui/toast';
import { AdminTheme, DEFAULT_ADMIN_THEME, getAdminTheme, setAdminTheme } from '@/lib/appSettingsService';

const ColorField: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
}> = ({ label, value, onChange }) => (
  <div className="flex items-center gap-3">
    <label className="w-40 text-sm text-muted-foreground">{label}</label>
    <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-10" />
    <input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm" />
  </div>
);

export default function AdminThemePage() {
  const { hasPermission } = useAdminAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<AdminTheme>(DEFAULT_ADMIN_THEME);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const t = await getAdminTheme();
      setTheme(t);
      setLoading(false);
    })();
  }, []);

  const onSave = async () => {
    if (!hasPermission('settings','update') || !hasPermission('settings','create')) return;
    try {
      setSaving(true);
      await setAdminTheme(theme);
      showToast({ type: 'success', title: 'Saved', message: 'Theme updated successfully.' });
    } catch {
      showToast({ type: 'error', title: 'Failed', message: 'Could not save theme.' });
    } finally {
      setSaving(false);
    }
  };

  const onReset = () => setTheme(DEFAULT_ADMIN_THEME);

  return (
    <AdminProtectedRoute>
      <AdminLayout currentPage="/admin/theme">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Theme</h1>
            <p className="text-sm text-muted-foreground">Set brand colors for the entire app. Changes apply instantly for all users.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 rounded-lg border border-border p-4 bg-background">
              <h2 className="font-semibold mb-2">Core</h2>
              <ColorField label="Primary" value={theme.primary} onChange={(v) => setTheme(t => ({ ...t, primary: v }))} />
              <ColorField label="Secondary" value={theme.secondary} onChange={(v) => setTheme(t => ({ ...t, secondary: v }))} />
              <ColorField label="Background" value={theme.background} onChange={(v) => setTheme(t => ({ ...t, background: v }))} />
              <ColorField label="Foreground" value={theme.foreground} onChange={(v) => setTheme(t => ({ ...t, foreground: v }))} />
            </div>

            <div className="space-y-3 rounded-lg border border-border p-4 bg-background">
              <h2 className="font-semibold mb-2">UI</h2>
              <ColorField label="Accent" value={theme.accent} onChange={(v) => setTheme(t => ({ ...t, accent: v }))} />
              <ColorField label="Accent Text" value={theme.accentForeground} onChange={(v) => setTheme(t => ({ ...t, accentForeground: v }))} />
              <ColorField label="Muted" value={theme.muted} onChange={(v) => setTheme(t => ({ ...t, muted: v }))} />
              <ColorField label="Muted Text" value={theme.mutedForeground} onChange={(v) => setTheme(t => ({ ...t, mutedForeground: v }))} />
              <ColorField label="Header Background" value={theme.headerBg || ''} onChange={(v) => setTheme(t => ({ ...t, headerBg: v }))} />
              <ColorField label="Brand Grad From" value={theme.brandGradFrom || ''} onChange={(v) => setTheme(t => ({ ...t, brandGradFrom: v }))} />
              <ColorField label="Brand Grad To" value={theme.brandGradTo || ''} onChange={(v) => setTheme(t => ({ ...t, brandGradTo: v }))} />
            </div>

            <div className="space-y-3 rounded-lg border border-border p-4 bg-background">
              <h2 className="font-semibold mb-2">Borders</h2>
              <ColorField label="Border" value={theme.border} onChange={(v) => setTheme(t => ({ ...t, border: v }))} />
              <ColorField label="Input" value={theme.input} onChange={(v) => setTheme(t => ({ ...t, input: v }))} />
              <ColorField label="Ring" value={theme.ring} onChange={(v) => setTheme(t => ({ ...t, ring: v }))} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onReset}>Reset</Button>
            <Button disabled={loading || !hasPermission('settings','update') || !hasPermission('settings','create')} onClick={onSave} loading={saving}>Save Theme</Button>
          </div>

          <div className="rounded-lg border border-border p-4 bg-background">
            <h2 className="font-semibold mb-3">Preview</h2>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 rounded-md" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>Primary</span>
              <span className="px-3 py-1 rounded-md" style={{ backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)' }}>Secondary</span>
              <span className="px-3 py-1 rounded-md" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}>Accent</span>
              <span className="px-3 py-1 rounded-md border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>Card</span>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
