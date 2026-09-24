"use client";

import React, { useEffect, useState } from "react";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { KamatahanAudio } from "@/types/admin";
import { db, storage } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FirebaseError } from "firebase/app";
import { PlaylistService, PlaylistDoc } from "@/lib/playlistService";
import { PlaylistTrackPicker } from "@/components/admin/PlaylistTrackPicker";
import { orderedTracks } from "@/lib/editorial";
import { AdminDialog } from "@/components/admin/AdminDialog";

const AdminPlaylistsPage: React.FC = () => {
  const { adminUser, hasPermission } = useAdminAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistDoc[]>([]);
  const [audioFiles, setAudioFiles] = useState<KamatahanAudio[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState("");
  const canCreate = hasPermission("audio", "create");
  const canUpdate = hasPermission("audio", "update");
  const canArchive = canUpdate;

  // Edit existing playlist
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<PlaylistDoc | null>(null);
  const [editSelectedIds, setEditSelectedIds] = useState<string[]>([]);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editAuthorName, setEditAuthorName] = useState("");
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [items, aud] = await Promise.all([
          PlaylistService.getAll(),
          fetchAudio(),
        ]);
        setPlaylists(items);
        setAudioFiles(aud);
      } catch (e) {
        console.error("Failed to load playlists/audio", e);
        showToast({
          type: "error",
          title: "Error",
          message: "Failed to load data.",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showToast]);

  useEffect(
    () => () => {
      if (coverPreview?.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
    },
    [coverPreview],
  );
  useEffect(
    () => () => {
      if (editCoverPreview?.startsWith("blob:"))
        URL.revokeObjectURL(editCoverPreview);
    },
    [editCoverPreview],
  );

  const fetchAudio = async (): Promise<KamatahanAudio[]> => {
    const ref = collection(db, "kamatahan_audio");
    const snap = await getDocs(query(ref));
    const items: KamatahanAudio[] = [];
    snap.forEach((d) => {
      const data = d.data() as Omit<KamatahanAudio, "id">;
      items.push({ ...data, id: d.id });
    });
    return items;
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setIsPublic(true);
    setSelectedIds([]);
    setCoverFile(null);
    setCoverPreview(null);
    setAuthorName("");
  };

  const openEdit = (p: PlaylistDoc) => {
    if (!canUpdate) return;
    setEditing(p);
    setEditSelectedIds(p.audioIds || (p.audioFiles || []).map((a) => a.id));
    setEditOpen(true);
    setEditName(p.name);
    setEditDescription(p.description || "");
    setEditIsPublic(!!p.isPublic);
    setEditAuthorName(p.authorName || "");
    setEditCoverFile(null);
    setEditCoverPreview(p.thumbnailUrl || null);
  };

  const saveEdit = async () => {
    if (!editing || !canUpdate || saving) return;
    if (!editName.trim()) {
      showToast({
        type: "warning",
        title: "Name required",
        message: "Give the playlist a name.",
      });
      return;
    }
    try {
      setSaving(true);
      const selection = orderedTracks(editSelectedIds, audioFiles);

      // Optional cover upload
      let thumbnailUrl = editing.thumbnailUrl;
      if (editCoverFile) {
        const path = `playlist_covers/${Date.now()}_${editCoverFile.name}`;
        const r = ref(storage, path);
        await uploadBytes(r, editCoverFile);
        thumbnailUrl = await getDownloadURL(r);
      }

      await PlaylistService.update(
        editing.id,
        {
          name: editName,
          description: editDescription,
          isPublic: editIsPublic,
          authorName: editAuthorName.trim(),
          thumbnailUrl,
          audioFiles: selection,
          audioIds: editSelectedIds,
        },
        editing.version || 0,
      );
      // refresh local state
      setPlaylists((prev) =>
        prev.map((x) =>
          x.id === editing.id
            ? {
                ...x,
                name: editName,
                description: editDescription,
                isPublic: editIsPublic,
                authorName: editAuthorName || undefined,
                thumbnailUrl: thumbnailUrl || undefined,
                audioFiles: selection,
                audioIds: editSelectedIds,
                version: (editing.version || 0) + 1,
                updatedAt: new Date(),
              }
            : x,
        ),
      );
      setEditOpen(false);
      setEditing(null);
      setEditSelectedIds([]);
      setEditCoverFile(null);
      showToast({
        type: "success",
        title: "Updated",
        message: "Playlist tracks updated.",
      });
    } catch (e) {
      console.error("Failed to update playlist tracks", e);
      showToast({
        type: "error",
        title: "Error",
        message:
          e instanceof Error ? e.message : "Failed to update playlist tracks.",
      });
    } finally {
      setSaving(false);
    }
  };

  const createPlaylist = async () => {
    if (!adminUser?.id || !canCreate) return;
    if (!name.trim()) {
      showToast({
        type: "warning",
        title: "Name required",
        message: "Please provide a playlist name.",
      });
      return;
    }
    try {
      setSaving(true);
      const selection = orderedTracks(selectedIds, audioFiles);
      // Upload cover if provided
      let thumbnailUrl: string | undefined;
      if (coverFile) {
        const path = `playlist_covers/${Date.now()}_${coverFile.name}`;
        const r = ref(storage, path);
        await uploadBytes(r, coverFile);
        thumbnailUrl = await getDownloadURL(r);
      }
      await PlaylistService.create({
        name,
        description,
        audioFiles: selection,
        audioIds: selectedIds,
        createdBy: adminUser.id,
        isPublic,
        thumbnailUrl,
        authorName: authorName || undefined,
      });
      const fresh = await PlaylistService.getAll();
      setPlaylists(fresh);
      setFormOpen(false);
      resetForm();
      showToast({
        type: "success",
        title: "Playlist created",
        message: `Created "${name}".`,
      });
    } catch (e: unknown) {
      console.error("Create playlist failed", e);
      let code = "unknown-error";
      if (e instanceof FirebaseError) {
        code = e.code;
      } else if (e && typeof e === "object") {
        // best-effort extraction of message
        const maybeMsg = (e as { message?: unknown }).message;
        if (typeof maybeMsg === "string") code = maybeMsg;
      }
      let message = "Failed to create playlist.";
      if (
        String(code).includes("storage") ||
        String(code).includes("permission")
      ) {
        message =
          "Permission denied while uploading cover. Ensure Storage rules allow admin writes to playlist_covers and your account exists in admin_users.";
      }
      showToast({ type: "error", title: "Error", message });
    } finally {
      setSaving(false);
    }
  };

  const togglePublic = async (p: PlaylistDoc) => {
    if (!canUpdate) return;
    try {
      await PlaylistService.update(
        p.id,
        { isPublic: !p.isPublic },
        p.version || 0,
      );
      setPlaylists((prev) =>
        prev.map((x) =>
          x.id === p.id
            ? { ...x, isPublic: !x.isPublic, version: (p.version || 0) + 1 }
            : x,
        ),
      );
    } catch (e) {
      console.error("Failed to update playlist", e);
      showToast({
        type: "error",
        title: "Error",
        message: e instanceof Error ? e.message : "Failed to update playlist.",
      });
    }
  };

  const remove = async (p: PlaylistDoc) => {
    if (!canArchive) return;
    if (
      !confirm(
        `${p.archived ? "Restore" : "Archive"} "${p.name}"? It will be private, and its recordings will be retained.`,
      )
    )
      return;
    try {
      await PlaylistService.archive(p);
      setPlaylists((prev) =>
        prev.map((x) =>
          x.id === p.id
            ? {
                ...x,
                archived: !p.archived,
                isPublic: false,
                version: (p.version || 0) + 1,
              }
            : x,
        ),
      );
      showToast({
        type: "success",
        title: p.archived ? "Restored" : "Archived",
        message: "The playlist is private. Its recordings are retained.",
      });
    } catch (e) {
      console.error("Failed to archive playlist", e);
      showToast({
        type: "error",
        title: "Error",
        message: e instanceof Error ? e.message : "Failed to archive playlist.",
      });
    }
  };

  return (
    <AdminProtectedRoute>
      <AdminLayout currentPage="/admin/playlists">
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Playlists</h1>
              <p className="text-muted-foreground">
                Create and manage public playlists available to all users.
              </p>
            </div>
            {canCreate && (
              <Button onClick={() => setFormOpen(true)}>Create Playlist</Button>
            )}
          </div>

          {/* Create form */}
          {formOpen && (
            <div className="rounded-lg border border-border p-4 space-y-4 bg-background">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <input
                    aria-label="Playlist name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Playlist name"
                    className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Visibility</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPublic(true)}
                      className={`px-3 py-2 rounded-md border ${isPublic ? "border-primary text-primary" : "border-input text-muted-foreground"}`}
                    >
                      Public
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPublic(false)}
                      className={`px-3 py-2 rounded-md border ${!isPublic ? "border-primary text-primary" : "border-input text-muted-foreground"}`}
                    >
                      Private
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Author</label>
                  <input
                    aria-label="Author"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g., Rev Ariyananda Thero"
                    className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cover Photo</label>
                  <div className="flex items-center gap-3">
                    <input
                      className="min-w-0 w-full text-sm"
                      aria-label="Playlist cover photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setCoverFile(f);
                        setCoverPreview(f ? URL.createObjectURL(f) : null);
                      }}
                    />
                    {coverPreview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverPreview}
                        alt="preview"
                        className="h-12 w-12 rounded object-cover border border-border"
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  aria-label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2"
                />
              </div>
              <PlaylistTrackPicker
                tracks={audioFiles}
                ids={selectedIds}
                onChange={setSelectedIds}
                disabled={saving}
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFormOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createPlaylist}
                  loading={saving}
                  disabled={!canCreate}
                >
                  Save Playlist
                </Button>
              </div>
            </div>
          )}

          {/* List */}
          <div className="app-card overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-accent/40">
                <tr>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Tracks</th>
                  <th className="text-left px-3 py-2">Visibility</th>
                  <th className="text-left px-3 py-2">Updated</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-8 text-center text-muted-foreground"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : playlists.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-8 text-center text-muted-foreground"
                    >
                      No playlists yet.
                    </td>
                  </tr>
                ) : (
                  playlists.map((p) => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="px-3 py-2 font-medium">{p.name}</td>
                      <td className="px-3 py-2">
                        {p.audioIds?.length ?? p.audioFiles?.length ?? 0}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${p.isPublic ? "bg-muted text-[var(--color-status-success)] dark:bg-green-900/30 dark:text-green-300" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}
                        >
                          {p.archived
                            ? "Archived"
                            : p.isPublic
                              ? "Public"
                              : "Private"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {p.updatedAt?.toLocaleDateString?.() || ""}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-2">
                          {canUpdate && !p.archived && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!canUpdate}
                              onClick={() => togglePublic(p)}
                            >
                              {p.isPublic ? "Unpublish" : "Publish"}
                            </Button>
                          )}
                          {canUpdate && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!canUpdate}
                              onClick={() => openEdit(p)}
                            >
                              Edit
                            </Button>
                          )}
                          {canArchive && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!canArchive}
                              onClick={() => remove(p)}
                            >
                              {p.archived ? "Restore" : "Archive"}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Tracks Panel */}
        {editOpen && editing && (
          <AdminDialog
            title="Edit playlist"
            busy={saving}
            onClose={() => {
              setEditOpen(false);
              setEditing(null);
            }}
          >
            <fieldset disabled={saving} className="min-w-0 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Arrange recordings in the order listeners should hear them.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditOpen(false);
                      setEditing(null);
                    }}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={saveEdit}
                    loading={saving}
                    disabled={!canUpdate}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
              {/* Meta */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <input
                    aria-label="Playlist name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Visibility</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={editing.archived}
                      onClick={() => setEditIsPublic(true)}
                      className={`px-3 py-2 rounded-md border ${editIsPublic ? "border-primary text-primary" : "border-input text-muted-foreground"}`}
                    >
                      Public
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditIsPublic(false)}
                      className={`px-3 py-2 rounded-md border ${!editIsPublic ? "border-primary text-primary" : "border-input text-muted-foreground"}`}
                    >
                      Private
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Author</label>
                  <input
                    aria-label="Author"
                    value={editAuthorName}
                    onChange={(e) => setEditAuthorName(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cover Photo</label>
                  <div className="flex items-center gap-3">
                    <input
                      className="min-w-0 w-full text-sm"
                      aria-label="Playlist cover photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setEditCoverFile(f);
                        setEditCoverPreview(
                          f
                            ? URL.createObjectURL(f)
                            : editing.thumbnailUrl || null,
                        );
                      }}
                    />
                    {editCoverPreview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={editCoverPreview}
                        alt="cover"
                        className="h-12 w-12 rounded object-cover border border-border"
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  aria-label="Description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2"
                />
              </div>

              <PlaylistTrackPicker
                tracks={audioFiles}
                ids={editSelectedIds}
                onChange={setEditSelectedIds}
                disabled={saving}
              />
            </fieldset>
          </AdminDialog>
        )}
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminPlaylistsPage;
