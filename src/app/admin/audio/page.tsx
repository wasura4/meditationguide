"use client";
import { useState } from "react";
import { Plus, Headphones, ArrowLeft } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Button } from "@/components/ui/button";
import AudioUploadForm from "@/components/admin/AudioUploadForm";
import AudioLibrary from "@/components/admin/AudioLibrary";
export default function AudioManagementPage() {
  const { hasPermission } = useAdminAuth();
  const [upload, setUpload] = useState(false),
    [revision, setRevision] = useState(0);
  return (
    <AdminLayout currentPage="/admin/audio">
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Content studio
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Audio library
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Care for your collection of meditations, chanting, and Dhamma
              talks.
            </p>
          </div>
          <Button
            variant={upload ? "outline" : "meditation"}
            disabled={!upload && !hasPermission("audio", "create")}
            onClick={() => setUpload((value) => !value)}
          >
            {upload ? (
              <ArrowLeft size={18} className="mr-2" />
            ) : (
              <Plus size={18} className="mr-2" />
            )}
            {upload ? "Back to library" : "Upload recording"}
          </Button>
        </header>
        <div hidden={!upload} className="app-card p-5 sm:p-6">
          <h2 className="mb-5 flex items-center gap-2 font-semibold">
            <Headphones size={20} />
            Add a recording
          </h2>
          <AudioUploadForm
            onUploadSuccess={() => {
              setUpload(false);
              setRevision((value) => value + 1);
            }}
          />
        </div>
        {!upload && <AudioLibrary key={revision} />}
      </div>
    </AdminLayout>
  );
}
