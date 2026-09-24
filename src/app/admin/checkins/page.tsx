"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { Plus, ClipboardCheck, FilePenLine } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { AdminDialog } from "@/components/admin/AdminDialog";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { db } from "@/lib/firebase";
import { saveCheckinQuestion } from "@/lib/checkinTransactions";
import type { CheckinQuestion } from "@/lib/checkins";

export default function CheckinsPage() {
  return (
    <AdminProtectedRoute>
      <AdminLayout currentPage="/admin/checkins">
        <CheckinLibrary />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
function CheckinLibrary() {
  const { hasPermission } = useAdminAuth();
  const [questions, setQuestions] = useState<CheckinQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [editor, setEditor] = useState<CheckinQuestion | "new" | null>(null);
  const [filter, setFilter] = useState("all");
  useEffect(() => {
    setLoading(true);
    setError(false);
    return onSnapshot(
      collection(db, "daily_checkin_questions"),
      (snapshot) => {
        setQuestions(
          snapshot.docs
            .map((item) => ({ ...item.data(), id: item.id }) as CheckinQuestion)
            .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)),
        );
        setLoading(false);
      },
      () => {
        setError(true);
        setLoading(false);
      },
    );
  }, [attempt]);
  const visible = questions.filter(
    (question) => filter === "all" || question.status === filter,
  );
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Daily practice
          </p>
          <h1 className="mt-2 text-3xl font-bold">Daily check-ins</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A gentle moment to reflect. Create short Yes / No questions in
            English and Sinhala. Active questions appear when users open the app
            and renew at their local midnight.
          </p>
        </div>
        {hasPermission("content", "create") && (
          <Button onClick={() => setEditor("new")}>
            <Plus size={18} className="mr-2" />
            New question
          </Button>
        )}
      </header>
      <div className="rounded-2xl border border-border bg-muted/40 p-5 text-sm leading-relaxed">
        Users can answer later or change today’s answer. Both Yes and No
        complete a question. Personal answers are private to each user; this
        panel manages questions only. Archive a question to stop asking it while
        preserving past reflections.
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">
          {questions.filter((question) => question.status === "active").length}{" "}
          active questions
        </p>
        <label className="flex items-center gap-2 text-sm">
          Status
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="min-h-11 rounded-xl border border-border bg-background px-3 text-foreground"
          >
            {["all", "active", "draft", "archived"].map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error ? (
        <div role="alert" className="app-card p-5">
          <p>Could not load check-ins.</p>
          <Button
            variant="outline"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Retry
          </Button>
        </div>
      ) : loading ? (
        <p role="status">Loading questions…</p>
      ) : !visible.length ? (
        <div className="app-card space-y-3 p-8 text-center">
          <ClipboardCheck className="mx-auto text-primary" size={32} />
          <h2 className="font-semibold">
            {questions.length
              ? "No questions in this view"
              : "Start with a small daily reflection"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Try observing Sil and reflecting on Sil. Two or three thoughtful
            questions are enough to begin.
          </p>
        </div>
      ) : (
        <ul className="app-card divide-y divide-border overflow-hidden">
          {visible.map((question) => (
            <li
              key={question.id}
              className="flex flex-wrap items-center justify-between gap-4 p-5"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-1 capitalize">
                    {question.status}
                  </span>
                  <span className="py-1">Order {question.order}</span>
                </div>
                <h2 className="break-words font-semibold" lang="en">
                  {question.titleEn}
                </h2>
                <p
                  className="mt-2 break-words text-sm leading-relaxed text-muted-foreground"
                  lang="si"
                >
                  {question.titleSi}
                </p>
              </div>
              {hasPermission("content", "update") && (
                <Button variant="outline" onClick={() => setEditor(question)}>
                  <FilePenLine size={16} className="mr-2" />
                  Edit
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {editor && (
        <QuestionEditor
          key={typeof editor === "string" ? editor : editor.id}
          original={editor === "new" ? undefined : editor}
          nextOrder={Math.min(
            999,
            Math.max(0, ...questions.map((question) => question.order)) + 1,
          )}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
}
function QuestionEditor({
  original,
  nextOrder,
  onClose,
}: {
  original?: CheckinQuestion;
  nextOrder: number;
  onClose: () => void;
}) {
  const { adminUser } = useAdminAuth();
  const [titleEn, setTitleEn] = useState(original?.titleEn || "");
  const [titleSi, setTitleSi] = useState(original?.titleSi || "");
  const [order, setOrder] = useState(original?.order ?? nextOrder);
  const [status, setStatus] = useState<CheckinQuestion["status"]>(
    original?.status || "draft",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!adminUser || busy || !titleEn.trim() || !titleSi.trim()) return;
    setBusy(true);
    setError("");
    try {
      await saveCheckinQuestion(
        db,
        adminUser.id,
        { titleEn: titleEn.trim(), titleSi: titleSi.trim(), order, status },
        original,
      );
      onClose();
    } catch (failure) {
      setError(
        failure instanceof Error && failure.message === "conflict"
          ? "Another admin changed this question. Close and reopen it to review the latest version."
          : "Could not save. Check your connection and permissions, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  const field =
    "mt-2 min-h-12 w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground";
  return (
    <AdminDialog
      title={original ? "Edit check-in" : "New check-in"}
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={save} className="space-y-5">
        <fieldset disabled={busy} className="space-y-5">
          {!original && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Start from a suggestion, or write your own:
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  [
                    "Observe Sil",
                    "Did you observe Sil today?",
                    "ඔබ අද සීලය රැක්කාද?",
                  ],
                  [
                    "Reflect on Sil",
                    "Did you reflect on Sil today?",
                    "ඔබ අද සීලය පිළිබඳව මෙනෙහි කළාද?",
                  ],
                ].map(([label, en, si]) => (
                  <Button
                    key={label}
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setTitleEn(en);
                      setTitleSi(si);
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <label className="block text-sm font-medium">
            Question in English
            <input
              lang="en"
              required
              maxLength={240}
              value={titleEn}
              onChange={(event) => setTitleEn(event.target.value)}
              className={field}
            />
          </label>
          <label className="block text-sm font-medium">
            Question in Sinhala
            <input
              lang="si"
              required
              maxLength={240}
              value={titleSi}
              onChange={(event) => setTitleSi(event.target.value)}
              className={field}
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-medium">
              Display order
              <input
                required
                type="number"
                min={0}
                max={999}
                step={1}
                value={order}
                onChange={(event) => setOrder(Number(event.target.value))}
                className={field}
              />
            </label>
            <label className="block text-sm font-medium">
              Status
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as CheckinQuestion["status"])
                }
                className={field}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Active questions appear immediately. Existing answers keep their
            original wording. For a different practice, archive this question
            and create a new one.
          </p>
        </fieldset>
        {error && (
          <p role="alert" className="text-sm">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            disabled={busy}
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={busy || !titleEn.trim() || !titleSi.trim()}
          >
            {busy
              ? "Saving…"
              : status === "active"
                ? "Save & publish"
                : "Save question"}
          </Button>
        </div>
      </form>
    </AdminDialog>
  );
}
