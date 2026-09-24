"use client";
import { useEffect, useRef, useState } from "react";
import type { KamatahanAudio } from "@/types/admin";
import { AdminAudioService, type AudioMetadata } from "@/lib/adminAudioService";
import { parseAudioDuration } from "@/lib/audioValidation";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { AdminDialog } from "./AdminDialog";
import { adminInput } from "./LibraryToolbar";
import { Button } from "@/components/ui/button";
export const audioCategories = [
  "meditation",
  "dhamma_talk",
  "chanting",
  "guided_meditation",
  "background",
] as const;
export function AudioInspector({
  audio,
  archive = false,
  onClose,
  onSaved,
}: {
  audio: KamatahanAudio;
  archive?: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { adminUser, hasPermission } = useAdminAuth();
  const [values, setValues] = useState<AudioMetadata>({
    title: audio.title || "",
    description: audio.description || "",
    category: audio.category || "meditation",
    language: audio.language || "si",
    duration: audio.duration || 0,
    durationFormatted:
      audio.durationFormatted ||
      `${Math.floor((audio.duration || 0) / 60)}:${String((audio.duration || 0) % 60).padStart(2, "0")}`,
    status:
      audio.status === "active" && audio.isPublic === false
        ? "inactive"
        : audio.status || "draft",
    isPublic: audio.isPublic !== false,
  });
  const [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [dependencyError, setDependencyError] = useState(false),
    [dependencies, setDependencies] = useState<{ id: string; name: string }[]>(
      [],
    ),
    [checking, setChecking] = useState(archive);
  const busy = useRef(false);
  useEffect(() => {
    if (!archive) return;
    let cancelled = false;
    AdminAudioService.dependencies(audio.id)
      .then((items) => {
        if (!cancelled) setDependencies(items);
      })
      .catch(() => {
        if (!cancelled) {
          setDependencyError(true);
          setError(
            "Playlist references could not be checked. Close this panel and try again.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [archive, audio.id]);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!adminUser || busy.current || !hasPermission("audio", "update")) return;
    if (archive && (checking || dependencyError)) return;
    let updates: Partial<AudioMetadata>;
    if (archive)
      updates = {
        status: audio.status === "archived" ? "draft" : "archived",
        isPublic: false,
      };
    else {
      const duration = parseAudioDuration(values.durationFormatted || "");
      if (!values.title.trim() || duration === null) {
        setError("Add a title and a valid duration in minutes:seconds.");
        return;
      }
      updates = {
        ...values,
        title: values.title.trim(),
        duration,
        isPublic: values.status === "active",
      };
    }
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      await AdminAudioService.update(audio, updates, adminUser.id);
      onSaved();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "The recording could not be saved.",
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  return (
    <AdminDialog
      title={
        archive
          ? audio.status === "archived"
            ? "Restore recording"
            : "Archive recording"
          : "Recording details"
      }
      onClose={onClose}
      busy={saving}
    >
      <form onSubmit={save} className="space-y-5">
        <fieldset
          disabled={saving || !hasPermission("audio", "update")}
          className="min-w-0 space-y-5"
        >
          <p className="font-medium leading-relaxed">{audio.title}</p>
          {archive ? (
            <>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {audio.status === "archived"
                  ? "This returns the recording to drafts. Publish it from Recording details when it is ready."
                  : "Archiving hides this recording from the app catalog and public playlist playback. The file and playlist references are retained for restoration. Existing downloaded copies and direct file links remain available."}
              </p>
              <div className="rounded-2xl bg-muted p-4 text-sm">
                <p className="font-medium">
                  {checking
                    ? "Checking playlist references…"
                    : `${dependencies.length} playlist reference${dependencies.length === 1 ? "" : "s"}`}
                </p>
                <ul className="mt-2 space-y-1">
                  {dependencies.map((item) => (
                    <li key={item.id}>{item.name}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <>
              <audio
                controls
                preload="none"
                src={audio.fileUrl}
                className="w-full"
              >
                Your browser does not support audio playback.
              </audio>
              <label className="block space-y-2 text-sm">
                <span>Title</span>
                <input
                  required
                  value={values.title}
                  onChange={(event) =>
                    setValues({ ...values, title: event.target.value })
                  }
                  className={adminInput}
                />
              </label>
              <label className="block space-y-2 text-sm">
                <span>Description</span>
                <textarea
                  rows={4}
                  value={values.description}
                  onChange={(event) =>
                    setValues({ ...values, description: event.target.value })
                  }
                  className={adminInput}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2 text-sm">
                  <span>Category</span>
                  <select
                    value={values.category}
                    onChange={(event) =>
                      setValues({
                        ...values,
                        category: event.target
                          .value as AudioMetadata["category"],
                      })
                    }
                    className={adminInput}
                  >
                    {audioCategories.map((category) => (
                      <option key={category} value={category}>
                        {category.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2 text-sm">
                  <span>Language</span>
                  <select
                    value={values.language}
                    onChange={(event) =>
                      setValues({
                        ...values,
                        language: event.target
                          .value as AudioMetadata["language"],
                      })
                    }
                    className={adminInput}
                  >
                    <option value="si">Sinhala</option>
                    <option value="en">English</option>
                    <option value="pa">Pali</option>
                  </select>
                </label>
                <label className="block space-y-2 text-sm">
                  <span>Duration (minutes:seconds)</span>
                  <input
                    required
                    value={values.durationFormatted}
                    onChange={(event) =>
                      setValues({
                        ...values,
                        durationFormatted: event.target.value,
                      })
                    }
                    className={adminInput}
                  />
                </label>
                <label className="block space-y-2 text-sm">
                  <span>Visibility</span>
                  <select
                    value={values.status}
                    onChange={(event) =>
                      setValues({
                        ...values,
                        status: event.target.value as AudioMetadata["status"],
                      })
                    }
                    className={adminInput}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Published</option>
                    <option value="inactive">Hidden</option>
                    {audio.status === "archived" && (
                      <option value="archived">Archived</option>
                    )}
                  </select>
                </label>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Publishing makes this recording available in the catalog and its
                public playlists. Changes apply to the existing audio file.
              </p>
            </>
          )}
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={saving}
            disabled={
              checking ||
              !hasPermission("audio", "update") ||
              (archive && dependencyError)
            }
          >
            {archive
              ? audio.status === "archived"
                ? "Restore as draft"
                : "Archive recording"
              : "Save recording"}
          </Button>
        </div>
      </form>
    </AdminDialog>
  );
}
