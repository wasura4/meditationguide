'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AdminProtectedRoute } from '@/components/admin/AdminProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { KamatahanAudio } from '@/types/admin';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FirebaseError } from 'firebase/app';
import { PlaylistService, PlaylistDoc } from '@/lib/playlistService';

const AdminPlaylistsPage: React.FC = () => {
  const { adminUser, hasPermission } = useAdminAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistDoc[]>([]);
  const [audioFiles, setAudioFiles] = useState<KamatahanAudio[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState('');
  const canCreate = hasPermission('audio', 'create');
  const canUpdate = hasPermission('audio', 'update');
  const canDelete = hasPermission('audio', 'delete');

  // Edit existing playlist
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<PlaylistDoc | null>(null);
  const [editSelectedIds, setEditSelectedIds] = useState<string[]>([]);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editAuthorName, setEditAuthorName] = useState('');
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
        console.error('Failed to load playlists/audio', e);
        showToast({ type: 'error', title: 'Error', message: 'Failed to load data.' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showToast]);

  const fetchAudio = async (): Promise<KamatahanAudio[]> => {
    const ref = collection(db, 'kamatahan_audio');
    const snap = await getDocs(query(ref));
    const items: KamatahanAudio[] = [];
    snap.forEach((d) => {
      const data = d.data() as Omit<KamatahanAudio, 'id'>;
      items.push({ ...data, id: d.id });
    });
    return items;
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setIsPublic(true);
    setSelectedIds([]);
    setCoverFile(null);
    setCoverPreview(null);
    setAuthorName('');
  };

  const openEdit = (p: PlaylistDoc) => {
    if (!canUpdate) return;
    setEditing(p);
    setEditSelectedIds((p.audioFiles || []).map((a) => a.id));
    setEditOpen(true);
    setEditName(p.name);
    setEditDescription(p.description || '');
    setEditIsPublic(!!p.isPublic);
    setEditAuthorName(p.authorName || '');
    setEditCoverFile(null);
    setEditCoverPreview(p.thumbnailUrl || null);
  };

  const saveEdit = async () => {
    if (!editing || !canUpdate) return;
    try {
      setSaving(true);
      const selection = audioFiles.filter((a) => editSelectedIds.includes(a.id));

      // Optional cover upload
      let thumbnailUrl = editing.thumbnailUrl;
      if (editCoverFile) {
        const path = `playlist_covers/${Date.now()}_${editCoverFile.name}`;
        const r = ref(storage, path);
        await uploadBytes(r, editCoverFile);
        thumbnailUrl = await getDownloadURL(r);
      }

      await PlaylistService.update(editing.id, {
        name: editName,
        description: editDescription,
        isPublic: editIsPublic,
        authorName: editAuthorName || undefined,
        thumbnailUrl,
        audioFiles: selection,
      });
      // refresh local state
      setPlaylists((prev) => prev.map((x) => (x.id === editing.id ? {
        ...x,
        name: editName,
        description: editDescription,
        isPublic: editIsPublic,
        authorName: editAuthorName || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        audioFiles: selection,
        updatedAt: new Date(),
      } : x)));
      setEditOpen(false);
      setEditing(null);
      setEditSelectedIds([]);
      setEditCoverFile(null);
      showToast({ type: 'success', title: 'Updated', message: 'Playlist tracks updated.' });
    } catch (e) {
      console.error('Failed to update playlist tracks', e);
      showToast({ type: 'error', title: 'Error', message: 'Failed to update playlist tracks.' });
    } finally {
      setSaving(false);
    }
  };

  const createPlaylist = async () => {
    if (!adminUser?.id || !canCreate) return;
    if (!name.trim()) {
      showToast({ type: 'warning', title: 'Name required', message: 'Please provide a playlist name.' });
      return;
    }
    try {
      setSaving(true);
      const selection = audioFiles.filter((a) => selectedIds.includes(a.id));
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
        createdBy: adminUser.id,
        isPublic,
        thumbnailUrl,
        authorName: authorName || undefined,
      });
      const fresh = await PlaylistService.getAll();
      setPlaylists(fresh);
      setFormOpen(false);
      resetForm();
      showToast({ type: 'success', title: 'Playlist created', message: `Created "${name}".` });
    } catch (e: unknown) {
      console.error('Create playlist failed', e);
      let code = 'unknown-error';
      if (e instanceof FirebaseError) {
        code = e.code;
      } else if (e && typeof e === 'object') {
        // best-effort extraction of message
        const maybeMsg = (e as { message?: unknown }).message;
        if (typeof maybeMsg === 'string') code = maybeMsg;
      }
      let message = 'Failed to create playlist.';
      if (String(code).includes('storage') || String(code).includes('permission')) {
        message = 'Permission denied while uploading cover. Ensure Storage rules allow admin writes to playlist_covers and your account exists in admin_users.';
      }
      showToast({ type: 'error', title: 'Error', message });
    } finally {
      setSaving(false);
    }
  };

  const togglePublic = async (p: PlaylistDoc) => {
    if (!canUpdate) return;
    try {
      await PlaylistService.update(p.id, { isPublic: !p.isPublic });
      setPlaylists((prev) => prev.map((x) => (x.id === p.id ? { ...x, isPublic: !x.isPublic } : x)));
    } catch (e) {
      console.error('Failed to update playlist', e);
      showToast({ type: 'error', title: 'Error', message: 'Failed to update playlist.' });
    }
  };

  const remove = async (p: PlaylistDoc) => {
    if (!canDelete) return;
    if (!confirm(`Delete playlist "${p.name}"?`)) return;
    try {
      await PlaylistService.remove(p.id);
      setPlaylists((prev) => prev.filter((x) => x.id !== p.id));
      showToast({ type: 'success', title: 'Deleted', message: 'Playlist removed.' });
    } catch (e) {
      console.error('Failed to delete playlist', e);
      showToast({ type: 'error', title: 'Error', message: 'Failed to delete playlist.' });
    }
  };

  const filteredAudio = useMemo(() => audioFiles, [audioFiles]);

  return (
    <AdminProtectedRoute>
      <AdminLayout currentPage="/admin/playlists">
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Playlists</h1>
              <p className="text-muted-foreground">Create and manage public playlists available to all users.</p>
            </div>
            {canCreate && (
              <Button onClick={() => setFormOpen(true)}>
                Create Playlist
              </Button>
            )}
          </div>

          {/* Create form */}
          {formOpen && (
            <div className="rounded-lg border border-border p-4 space-y-4 bg-background">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Playlist name" className="w-full rounded-md border border-input bg-background px-3 py-2" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Visibility</label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setIsPublic(true)} className={`px-3 py-2 rounded-md border ${isPublic ? 'border-primary text-primary' : 'border-input text-muted-foreground'}`}>Public</button>
                    <button type="button" onClick={() => setIsPublic(false)} className={`px-3 py-2 rounded-md border ${!isPublic ? 'border-primary text-primary' : 'border-input text-muted-foreground'}`}>Private</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Author</label>
                  <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="e.g., Rev Ariyananda Thero" className="w-full rounded-md border border-input bg-background px-3 py-2" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cover Photo</label>
                  <div className="flex items-center gap-3">
                    <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0] || null; setCoverFile(f); setCoverPreview(f ? URL.createObjectURL(f) : null); }} />
                    {coverPreview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={coverPreview} alt="preview" className="h-12 w-12 rounded object-cover border border-border" />
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Audio</label>
                <div className="max-h-64 overflow-auto rounded-md border border-border divide-y divide-border">
                  {filteredAudio.map((a) => {
                    const checked = selectedIds.includes(a.id);
                    return (
                      <label key={a.id} className="flex items-center gap-3 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedIds((prev) =>
                              checked ? prev.filter((id) => id !== a.id) : [...prev, a.id]
                            )
                          }
                        />
                        <div className="flex-1">
                          <div className="font-medium">{a.title}</div>
                          <div className="text-xs text-muted-foreground">{a.language?.toUpperCase()} • {a.category}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{Math.round((a.duration || 0) / 60)}m</div>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" onClick={() => { setFormOpen(false); resetForm(); }}>Cancel</Button>
                <Button onClick={createPlaylist} loading={saving} disabled={!canCreate}>Save Playlist</Button>
              </div>
            </div>
          )}

          {/* List */}
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
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
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : playlists.length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">No playlists yet.</td></tr>
                ) : (
                  playlists.map((p) => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="px-3 py-2 font-medium">{p.name}</td>
                      <td className="px-3 py-2">{p.audioFiles?.length || 0}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${p.isPublic ? 'bg-muted text-[var(--color-status-success)] dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                          {p.isPublic ? 'Public' : 'Private'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{p.updatedAt?.toLocaleDateString?.() || ''}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-2">
                          {canUpdate && (
                            <Button size="sm" variant="outline" disabled={!canUpdate} onClick={() => togglePublic(p)}>
                              {p.isPublic ? 'Unpublish' : 'Publish'}
                            </Button>
                          )}
                          {canUpdate && (
                            <Button size="sm" variant="outline" disabled={!canUpdate} onClick={() => openEdit(p)}>Edit</Button>
                          )}
                          {canDelete && (
                            <Button size="sm" variant="destructive" disabled={!canDelete} onClick={() => remove(p)}>Delete</Button>
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
          <div className="mt-6 rounded-lg border border-border p-4 space-y-4 bg-background">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit Playlist</h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => { setEditOpen(false); setEditing(null); }}>Close</Button>
                <Button onClick={saveEdit} loading={saving} disabled={!canUpdate}>Save Changes</Button>
              </div>
            </div>
            {/* Meta */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Visibility</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setEditIsPublic(true)} className={`px-3 py-2 rounded-md border ${editIsPublic ? 'border-primary text-primary' : 'border-input text-muted-foreground'}`}>Public</button>
                  <button type="button" onClick={() => setEditIsPublic(false)} className={`px-3 py-2 rounded-md border ${!editIsPublic ? 'border-primary text-primary' : 'border-input text-muted-foreground'}`}>Private</button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Author</label>
                <input value={editAuthorName} onChange={(e) => setEditAuthorName(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cover Photo</label>
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0] || null; setEditCoverFile(f); setEditCoverPreview(f ? URL.createObjectURL(f) : editing.thumbnailUrl || null); }} />
                  {editCoverPreview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={editCoverPreview} alt="cover" className="h-12 w-12 rounded object-cover border border-border" />
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2" />
            </div>

            <div className="text-sm text-muted-foreground">Select or deselect audio files to include in this playlist.</div>
            <div className="max-h-80 overflow-auto rounded-md border border-border divide-y divide-border">
              {filteredAudio.map((a) => {
                const checked = editSelectedIds.includes(a.id);
                return (
                  <label key={a.id} className="flex items-center gap-3 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setEditSelectedIds((prev) =>
                          checked ? prev.filter((id) => id !== a.id) : [...prev, a.id]
                        )
                      }
                    />
                    <div className="flex-1">
                      <div className="font-medium">{a.title}</div>
                      <div className="text-xs text-muted-foreground">{a.language?.toUpperCase()} • {a.category}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{Math.round((a.duration || 0) / 60)}m</div>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminPlaylistsPage;








