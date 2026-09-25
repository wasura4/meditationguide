"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppPage } from "@/components/app/AppPage";
import { AudioLibrary } from "@/components/audio/AudioLibrary";
import { PlaylistManager } from "@/components/audio/PlaylistManager";
import { Headphones, Library } from "lucide-react";

export default function KamatahanPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"library" | "playlists">(
    "playlists",
  );
  return (
    <ProtectedRoute>
      <AppPage
        artwork="listen"
        title={t("interface.tabs.listen")}
        subtitle={t("interface.audio_description")}
      >
        <div
          role="group"
          aria-label={t("audio.title")}
          className="mb-6 grid grid-cols-2 rounded-2xl bg-muted p-1"
        >
          <button
            type="button"
            aria-pressed={activeTab === "playlists"}
            aria-controls="audio-content"
            onClick={() => setActiveTab("playlists")}
            className="app-segment flex items-center justify-center gap-2 text-muted-foreground"
          >
            <Headphones size={17} aria-hidden="true" />
            {t("interface.guides")}
          </button>
          <button
            type="button"
            aria-pressed={activeTab === "library"}
            aria-controls="audio-content"
            onClick={() => setActiveTab("library")}
            className="app-segment flex items-center justify-center gap-2 text-muted-foreground"
          >
            <Library size={17} aria-hidden="true" />
            {t("audio.title")}
          </button>
        </div>
        <section
          id="audio-content"
          aria-label={
            activeTab === "library" ? t("audio.title") : t("interface.guides")
          }
        >
          <div hidden={activeTab !== "playlists"}>
            <PlaylistManager />
          </div>
          <div hidden={activeTab !== "library"}>
            <AudioLibrary />
          </div>
        </section>
      </AppPage>
    </ProtectedRoute>
  );
}
