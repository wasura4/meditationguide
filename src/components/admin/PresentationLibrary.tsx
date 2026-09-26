"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  ref,
  uploadBytesResumable,
  deleteObject,
  type UploadTask,
} from "firebase/storage";
import { storage } from "@/lib/firebase";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useAdminLibrary } from "@/hooks/useAdminLibrary";
import { Button } from "@/components/ui/button";
import { AdminDialog } from "./AdminDialog";
import { LibraryToolbar, LibraryFooter, adminInput } from "./LibraryToolbar";
import { TeacherPicker } from "./LearningEditor";
import {
  blankPresentation,
  MAX_PDF_BYTES,
  type Presentation,
  type PresentationFields,
} from "@/lib/presentations";
import {
  newPresentationId,
  savePresentation,
  presentationBytes,
} from "@/lib/presentationService";
import { pdfClient, pdfOptions } from "@/lib/pdfClient";
const PdfReader = dynamic(
  () => import("@/components/learning/PdfReader").then((m) => m.PdfReader),
  { ssr: false },
);

export function PresentationLibrary() {
  const { hasPermission } = useAdminAuth();
  const [status, setStatus] = useState("all"),
    [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{ item?: Presentation } | null>(null);
  const library = useAdminLibrary("learning_presentations", status);
  const items = (library.records as Presentation[]).filter((item) =>
    `${item.title} ${item.titleEn}`
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase().trim()),
  );
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          disabled={
            !hasPermission("content", "create") ||
            !hasPermission("content", "update")
          }
          onClick={() => setEditing({})}
        >
          Upload presentation
        </Button>
      </div>
      <LibraryToolbar
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        statuses={["draft", "published", "archived"]}
        loading={library.loading}
        onRefresh={library.reload}
      />
      {library.error && (
        <p role="alert">Presentations could not load. Use Refresh to retry.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="app-card space-y-3 p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              PDF · {item.status} · {item.language}
            </p>
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {item.description}
            </p>
            <p className="text-sm">
              {item.pageCount} pages · {item.minutes} min ·{" "}
              {(item.fileSize / 1024 / 1024).toFixed(1)} MB
            </p>
            <Button variant="outline" onClick={() => setEditing({ item })}>
              {hasPermission("content", "update")
                ? "Edit & preview"
                : "Preview"}
            </Button>
          </article>
        ))}
      </div>
      {!library.loading && !library.error && !items.length && (
        <div className="app-card p-8 text-center">
          <h2 className="font-semibold">Your presentation library</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload a PDF, preview it, then publish and add it to a learning
            path.
          </p>
        </div>
      )}
      <LibraryFooter
        count={items.length}
        loaded={library.records.length}
        more={library.hasMore}
        loading={library.loading}
        onMore={library.loadMore}
      />
      {editing && (
        <PresentationEditor
          item={editing.item}
          onClose={() => {
            setEditing(null);
            library.reload();
          }}
        />
      )}
    </div>
  );
}
function PresentationEditor({
  item,
  onClose,
}: {
  item?: Presentation;
  onClose: () => void;
}) {
  const { adminUser, hasPermission } = useAdminAuth();
  const [id] = useState(() => item?.id || newPresentationId());
  const [fields, setFields] = useState<PresentationFields>(
    item || { ...blankPresentation },
  );
  const version = useRef<number | undefined>(item?.version);
  const [busy, setBusy] = useState(false),
    [percent, setPercent] = useState<number | null>(null),
    [error, setError] = useState("");
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null),
    [preview, setPreview] = useState(false),
    [dirty, setDirty] = useState(false);
  const task = useRef<UploadTask | null>(null),
    lock = useRef(false);
  const allowed =
    hasPermission("content", item ? "update" : "create") &&
    hasPermission("content", "update");
  useEffect(() => {
    if (!dirty && !busy) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, busy]);
  const change = (patch: Partial<PresentationFields>) => {
    setFields((f) => ({ ...f, ...patch }));
    setDirty(true);
  };
  const upload = async (file?: File) => {
    if (!file || !adminUser || !allowed || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setPercent(0);
    let uploadedPath = "";
    try {
      if (
        !file.name.toLowerCase().endsWith(".pdf") ||
        file.size === 0 ||
        file.size > MAX_PDF_BYTES
      )
        throw new Error("Choose a PDF up to 25 MB.");
      if (!fields.title.trim())
        throw new Error("Enter a title before uploading.");
      if (fields.status === "published")
        throw new Error("Save as a draft before replacing a published file.");
      const data = await file.arrayBuffer();
      if (new TextDecoder().decode(data.slice(0, 5)) !== "%PDF-")
        throw new Error("This file is not a PDF.");
      const client = await pdfClient();
      const loading = client.getDocument({
        data: data.slice(0),
        ...pdfOptions,
      });
      loading.onPassword = () => {
        void loading.destroy();
      };
      let pageCount: number;
      try {
        const pdf = await loading.promise;
        pageCount = pdf.numPages;
      } finally {
        await loading.destroy();
      }
      if (pageCount < 1 || pageCount > 2000)
        throw new Error("Use a PDF with 1–2,000 pages.");
      // Persist the draft first so Storage can authorize its immutable file path.
      version.current = await savePresentation(
        id,
        fields,
        adminUser.id,
        version.current,
      );
      const storagePath = `presentations/${id}/${crypto.randomUUID()}.pdf`;
      const transfer = uploadBytesResumable(ref(storage, storagePath), file, {
        contentType: "application/pdf",
      });
      task.current = transfer;
      await new Promise<void>((resolve, reject) =>
        transfer.on(
          "state_changed",
          (snapshot) =>
            setPercent(
              Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
              ),
            ),
          reject,
          resolve,
        ),
      );
      uploadedPath = storagePath;
      const next = {
        ...fields,
        storagePath,
        fileName: file.name,
        fileSize: file.size,
        pageCount,
      };
      version.current = await savePresentation(
        id,
        next,
        adminUser.id,
        version.current,
      );
      uploadedPath = "";
      setFields(next);
      setBytes(data);
      setDirty(false);
      setPreview(true);
    } catch (e) {
      if (uploadedPath)
        await deleteObject(ref(storage, uploadedPath)).catch(() => {});
      setError(
        e instanceof Error
          ? e.message
          : "Upload failed. Please retry with an unencrypted PDF.",
      );
    } finally {
      task.current = null;
      lock.current = false;
      setBusy(false);
      setPercent(null);
    }
  };
  const save = async () => {
    if (!adminUser || !allowed || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      version.current = await savePresentation(
        id,
        fields,
        adminUser.id,
        version.current,
      );
      setDirty(false);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const showPreview = async () => {
    if (preview) {
      setPreview(false);
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (!bytes) setBytes(await presentationBytes(fields.storagePath));
      setPreview(true);
    } catch {
      setError("The PDF could not load. Check your connection and retry.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <AdminDialog
      title={item ? "Edit presentation" : "Upload presentation"}
      busy={busy}
      onClose={() => {
        if (
          !dirty ||
          window.confirm(
            "Discard unsaved changes? Uploaded drafts are retained.",
          )
        )
          onClose();
      }}
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <fieldset disabled={!allowed || busy} className="space-y-4">
          {(
            [
              ["title", "Title · Sinhala / primary", 180],
              ["titleEn", "Title · English", 180],
              ["description", "Introduction · Sinhala / primary", 3000],
              ["descriptionEn", "Introduction · English", 3000],
              ["objectives", "Learning objectives · Sinhala / primary", 3000],
              ["objectivesEn", "Learning objectives · English", 3000],
            ] as const
          ).map(([key, label, max]) => (
            <label key={key} className="block space-y-2 text-sm">
              <span>{label}</span>
              {max === 180 ? (
                <input
                  className={adminInput}
                  value={fields[key]}
                  maxLength={max}
                  required={key === "title"}
                  onChange={(e) => change({ [key]: e.target.value })}
                />
              ) : (
                <textarea
                  className={adminInput}
                  rows={3}
                  maxLength={max}
                  value={fields[key]}
                  onChange={(e) => change({ [key]: e.target.value })}
                />
              )}
            </label>
          ))}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              Language
              <select
                className={adminInput}
                value={fields.language}
                onChange={(e) =>
                  change({
                    language: e.target.value as PresentationFields["language"],
                  })
                }
              >
                <option value="si">Sinhala</option>
                <option value="en">English</option>
                <option value="mixed">Mixed</option>
              </select>
            </label>
            <label className="space-y-2 text-sm">
              Study time (minutes)
              <input
                type="number"
                min={1}
                max={600}
                required
                className={adminInput}
                value={fields.minutes}
                onChange={(e) => change({ minutes: Number(e.target.value) })}
              />
            </label>
          </div>
          <TeacherPicker
            value={fields.teacherId}
            onChange={(teacherId) => change({ teacherId })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={fields.allowDownload}
              onChange={(e) => change({ allowDownload: e.target.checked })}
            />
            Show download button
          </label>
          <label className="block space-y-2 text-sm">
            Publication status
            <select
              className={adminInput}
              value={fields.status}
              onChange={(e) =>
                change({
                  status: e.target.value as PresentationFields["status"],
                })
              }
            >
              <option value="draft">Draft · administrators only</option>
              <option value="published">Published · signed-in learners</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="block space-y-2 rounded-xl border border-dashed border-border p-4 text-sm">
            <span className="block font-medium">
              {fields.storagePath ? "Replace PDF" : "Choose PDF"}
            </span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              disabled={fields.status === "published"}
              onChange={(e) => {
                void upload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <span className="block text-muted-foreground">
              PDF only · maximum 25 MB · no password. Upload saves your draft.
              Save published presentations as a draft before replacing their
              file.
            </span>
          </label>
          {fields.fileName && (
            <p className="text-sm">
              {fields.fileName} · {fields.pageCount} pages
            </p>
          )}
        </fieldset>
        {percent !== null && (
          <div role="status" className="space-y-2">
            <p>Preparing / uploading PDF · {percent}%</p>
            <progress value={percent} max={100} className="w-full" />
            <Button
              type="button"
              variant="outline"
              disabled={!task.current}
              onClick={() => task.current?.cancel()}
            >
              Cancel upload
            </Button>
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          {fields.storagePath && (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void showPreview()}
            >
              {preview ? "Hide preview" : "Preview lesson"}
            </Button>
          )}
          <Button
            type="submit"
            disabled={!allowed || busy}
            loading={busy && percent === null}
          >
            {fields.status === "published"
              ? "Publish presentation"
              : "Save changes"}
          </Button>
        </div>
        {preview && bytes && (
          <section className="space-y-3 border-t border-border pt-5">
            <p className="text-xs text-muted-foreground">Learner preview</p>
            <h2 className="text-xl font-semibold">{fields.title}</h2>
            <p className="whitespace-pre-wrap text-sm">{fields.description}</p>
            {fields.objectives && (
              <p className="whitespace-pre-wrap text-sm">{fields.objectives}</p>
            )}
            <PdfReader
              bytes={bytes}
              title={fields.title}
              fileName={fields.fileName}
              allowDownload={fields.allowDownload}
            />
          </section>
        )}
      </form>
    </AdminDialog>
  );
}
