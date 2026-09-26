"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, ArrowDown, X, BookOpen, Headphones } from "lucide-react";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { AdminDialog } from "./AdminDialog";
import { adminInput } from "./LibraryToolbar";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { LearningService, type LessonContent } from "@/lib/learningService";
import {
  blankTeacher,
  blankLearningPath,
  LEARNING_TOPICS,
  LEARNING_LEVELS,
  type Teacher,
  type LearningPath,
  type TeacherFields,
  type LearningPathFields,
  type Lesson,
} from "@/lib/learning";

function TextField({
  label,
  value,
  onChange,
  maxLength,
  multiline = false,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="font-medium">{label}</span>
      {multiline ? (
        <textarea
          rows={4}
          maxLength={maxLength}
          required={required}
          className={adminInput}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          maxLength={maxLength}
          required={required}
          className={adminInput}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}
export function LearningEditor({
  kind,
  item,
  onClose,
  onSaved,
}: {
  kind: "teacher" | "path";
  item?: Teacher | LearningPath;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { adminUser, hasPermission } = useAdminAuth();
  const [teacher, setTeacher] = useState<TeacherFields>(
    kind === "teacher" && item ? (item as Teacher) : blankTeacher,
  );
  const [path, setPath] = useState<LearningPathFields>(
    kind === "path" && item ? (item as LearningPath) : blankLearningPath,
  );
  const [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [dirty, setDirty] = useState(false),
    [preview, setPreview] = useState(false);
  const busy = useRef(false),
    allowed = hasPermission("content", item ? "update" : "create");
  const values = kind === "teacher" ? teacher : path;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const close = () => {
    if (!busy.current && (!dirty || window.confirm("Discard unsaved changes?")))
      onClose();
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!adminUser || !allowed || busy.current) return;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      if (kind === "teacher")
        await LearningService.saveTeacher(
          teacher,
          adminUser.id,
          item?.id,
          item?.version || 0,
        );
      else
        await LearningService.savePath(
          path,
          adminUser.id,
          item?.id,
          item?.version || 0,
        );
      onSaved();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Changes could not be saved.",
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  return (
    <AdminDialog
      title={`${item ? "Edit" : "Create"} ${kind === "teacher" ? "teacher profile" : "learning path"}`}
      onClose={close}
      busy={saving}
    >
      <form
        onSubmit={save}
        className="space-y-5"
        onChange={() => setDirty(true)}
      >
        <fieldset disabled={!allowed || saving} className="min-w-0 space-y-5">
          {kind === "teacher" ? (
            <>
              <TextField
                label="Name · Sinhala / primary"
                value={teacher.name}
                maxLength={160}
                required
                onChange={(name) => setTeacher({ ...teacher, name })}
              />
              <TextField
                label="Name · English (optional)"
                value={teacher.nameEn}
                maxLength={160}
                onChange={(nameEn) => setTeacher({ ...teacher, nameEn })}
              />
              <TextField
                label="Biography · Sinhala / primary"
                value={teacher.bio}
                maxLength={5000}
                required={teacher.status === "published"}
                multiline
                onChange={(bio) => setTeacher({ ...teacher, bio })}
              />
              <TextField
                label="Biography · English (optional)"
                value={teacher.bioEn}
                maxLength={5000}
                multiline
                onChange={(bioEn) => setTeacher({ ...teacher, bioEn })}
              />
              <p className="text-xs text-muted-foreground">
                Use verified biographical information. The primary text is shown
                when an English version is unavailable.
              </p>
            </>
          ) : (
            <>
              <TextField
                label="Title · Sinhala / primary"
                value={path.title}
                maxLength={180}
                required
                onChange={(title) => setPath({ ...path, title })}
              />
              <TextField
                label="Title · English (optional)"
                value={path.titleEn}
                maxLength={180}
                onChange={(titleEn) => setPath({ ...path, titleEn })}
              />
              <TextField
                label="Introduction · Sinhala / primary"
                value={path.description}
                maxLength={3000}
                required={path.status === "published"}
                multiline
                onChange={(description) => setPath({ ...path, description })}
              />
              <TextField
                label="Introduction · English (optional)"
                value={path.descriptionEn}
                maxLength={3000}
                multiline
                onChange={(descriptionEn) =>
                  setPath({ ...path, descriptionEn })
                }
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-2 text-sm">
                  <span>Topic</span>
                  <select
                    className={adminInput}
                    value={path.topic}
                    onChange={(event) =>
                      setPath({
                        ...path,
                        topic: event.target
                          .value as LearningPathFields["topic"],
                      })
                    }
                  >
                    {LEARNING_TOPICS.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  <span>Level</span>
                  <select
                    className={adminInput}
                    value={path.level}
                    onChange={(event) =>
                      setPath({
                        ...path,
                        level: event.target
                          .value as LearningPathFields["level"],
                      })
                    }
                  >
                    {LEARNING_LEVELS.map((level) => (
                      <option key={level}>{level}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  <span>Teaching language</span>
                  <select
                    className={adminInput}
                    value={path.language}
                    onChange={(event) =>
                      setPath({
                        ...path,
                        language: event.target
                          .value as LearningPathFields["language"],
                      })
                    }
                  >
                    <option value="si">Sinhala</option>
                    <option value="en">English</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </label>
              </div>
              <TeacherPicker
                value={path.teacherId}
                onChange={(teacherId) => {
                  setPath({ ...path, teacherId });
                  setDirty(true);
                }}
              />
              <LessonPicker
                lessons={path.lessons}
                onChange={(lessons) => {
                  setPath({ ...path, lessons });
                  setDirty(true);
                }}
              />
            </>
          )}
          <label className="block space-y-2 text-sm">
            <span>Publication status</span>
            <select
              value={values.status}
              className={adminInput}
              onChange={(event) => {
                const status = event.target.value as TeacherFields["status"];
                if (kind === "teacher") setTeacher({ ...teacher, status });
                else setPath({ ...path, status });
              }}
            >
              <option value="draft">Draft · administrators only</option>
              <option value="published">Published · visible to learners</option>
              <option value="archived">
                Archived · hidden, retained for recovery
              </option>
            </select>
          </label>
        </fieldset>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {kind === "path"
            ? "Publishing requires available lessons and a published teacher profile when one is selected. Reordering keeps existing lesson completion. Replacing a teaching adds a new lesson to complete."
            : "Archiving hides the biography from learners. Existing paths remain available and retain their teacher reference."}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => setPreview(!preview)}
        >
          {preview ? "Hide preview" : "Preview introduction"}
        </Button>
        {preview && (
          <section className="app-card space-y-3 p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Learner preview · {values.status}
            </p>
            <h3 className="text-xl font-semibold">
              {kind === "teacher" ? teacher.name : path.title}
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {kind === "teacher" ? teacher.bio : path.description}
            </p>
            {kind === "path" && (
              <p className="text-sm">
                {path.lessons.length} lessons · {path.level}
              </p>
            )}
          </section>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={close}
          >
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!allowed}>
            {values.status === "published"
              ? "Publish changes"
              : values.status === "archived"
                ? "Save archive"
                : "Save draft"}
          </Button>
        </div>
      </form>
    </AdminDialog>
  );
}
export function TeacherPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [teachers, setTeachers] = useState<Teacher[]>([]),
    [more, setMore] = useState(true),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const cursor = useRef<QueryDocumentSnapshot | undefined>(undefined),
    busy = useRef(false),
    mounted = useRef(true);
  const load = async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError("");
    try {
      const result = await LearningService.page<Teacher>(
        "teachers",
        "all",
        cursor.current,
      );
      if (mounted.current) {
        setTeachers((previous) => [...previous, ...result.items]);
        cursor.current = result.cursor;
        setMore(result.more);
      }
    } catch {
      if (mounted.current) setError("Teacher profiles could not load.");
    } finally {
      busy.current = false;
      if (mounted.current) setLoading(false);
    }
  };
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, []);
  return (
    <div className="space-y-2">
      <label className="block space-y-2 text-sm">
        <span>Teacher (optional)</span>
        <select
          className={adminInput}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">No teacher selected</option>
          {value && !teachers.some((teacher) => teacher.id === value) && (
            <option value={value}>Current teacher · load more to view</option>
          )}
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name} · {teacher.status}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {(more || error) && (
        <Button type="button" variant="ghost" loading={loading} onClick={load}>
          {error ? "Retry teachers" : "Load more teachers"}
        </Button>
      )}
    </div>
  );
}
function LessonPicker({
  lessons,
  onChange,
}: {
  lessons: Lesson[];
  onChange: (lessons: Lesson[]) => void;
}) {
  const [kind, setKind] = useState<Lesson["kind"]>("article"),
    [search, setSearch] = useState(""),
    [items, setItems] = useState<LessonContent[]>([]),
    [titles, setTitles] = useState<Record<string, string>>({}),
    [more, setMore] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const cursor = useRef<QueryDocumentSnapshot | undefined>(undefined),
    generation = useRef(0),
    busy = useRef(false),
    initial = useRef(lessons);
  useEffect(() => {
    let active = true;
    Promise.all(
      initial.current.map(async (lesson) => ({
        id: lesson.id,
        content: await LearningService.lesson(lesson),
      })),
    )
      .then((results) => {
        if (active)
          setTitles((previous) => ({
            ...previous,
            ...Object.fromEntries(
              results.map((result) => [
                result.id,
                result.content?.title || "Unavailable teaching",
              ]),
            ),
          }));
      })
      .catch(() => {
        if (active)
          setError(
            "Some selected teachings could not load. Their references are retained.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  const load = async (reset = false, epoch = generation.current) => {
    if (busy.current && !reset) return;
    busy.current = true;
    setLoading(true);
    setError("");
    try {
      const result = await LearningService.contentPage(
        kind,
        reset ? undefined : cursor.current,
      );
      if (epoch !== generation.current) return;
      setItems((previous) =>
        reset ? result.items : [...previous, ...result.items],
      );
      setTitles((previous) => ({
        ...previous,
        ...Object.fromEntries(
          result.items.map((item) => [`${item.kind}_${item.id}`, item.title]),
        ),
      }));
      cursor.current = result.cursor;
      setMore(result.more);
    } catch {
      if (epoch === generation.current)
        setError("Teachings could not load. Please retry.");
    } finally {
      if (epoch === generation.current) {
        busy.current = false;
        setLoading(false);
      }
    }
  };
  useEffect(() => {
    const epoch = ++generation.current;
    setItems([]);
    cursor.current = undefined;
    void load(true, epoch);
    return () => {
      generation.current = epoch + 1;
    }; /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [kind]);
  const available = items.filter(
    (item) =>
      !lessons.some((lesson) => lesson.id === `${item.kind}_${item.id}`) &&
      item.title
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase()),
  );
  const move = (index: number, direction: number) => {
    const copy = [...lessons];
    [copy[index], copy[index + direction]] = [
      copy[index + direction],
      copy[index],
    ];
    onChange(copy);
  };
  return (
    <section className="space-y-4">
      <h3 className="font-semibold">Lesson order · {lessons.length}/12</h3>
      <ol className="divide-y divide-border rounded-2xl border border-border">
        {lessons.map((lesson, index) => (
          <li key={lesson.id} className="space-y-2 p-3">
            <p className="text-sm font-medium leading-relaxed">
              {index + 1}. {titles[lesson.id] || "Loading teaching…"}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {lesson.kind === "audio"
                  ? "Listen"
                  : lesson.kind === "pdf"
                    ? "Presentation"
                    : "Read"}
              </span>
              <div className="flex">
                <button
                  type="button"
                  className="app-icon-button disabled:opacity-30"
                  aria-label={`Move lesson ${index + 1} up`}
                  disabled={!index}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp size={18} />
                </button>
                <button
                  type="button"
                  className="app-icon-button disabled:opacity-30"
                  aria-label={`Move lesson ${index + 1} down`}
                  disabled={index === lessons.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown size={18} />
                </button>
                <button
                  type="button"
                  className="app-icon-button"
                  aria-label={`Remove lesson ${index + 1}`}
                  onClick={() =>
                    onChange(lessons.filter((item) => item.id !== lesson.id))
                  }
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      {!lessons.length && (
        <p className="text-sm text-muted-foreground">
          Add published teachings below, then arrange them into a guided
          sequence.
        </p>
      )}
      <div className="flex gap-2" role="group" aria-label="Teaching format">
        <Button
          type="button"
          variant={kind === "pdf" ? "default" : "outline"}
          aria-pressed={kind === "pdf"}
          onClick={() => setKind("pdf")}
        >
          Presentations
        </Button>
        <Button
          type="button"
          variant={kind === "article" ? "default" : "outline"}
          aria-pressed={kind === "article"}
          onClick={() => setKind("article")}
        >
          <BookOpen size={16} className="mr-2" />
          Articles
        </Button>
        <Button
          type="button"
          variant={kind === "audio" ? "default" : "outline"}
          aria-pressed={kind === "audio"}
          onClick={() => setKind("audio")}
        >
          <Headphones size={16} className="mr-2" />
          Recordings
        </Button>
      </div>
      <input
        className={adminInput}
        aria-label="Search loaded teachings"
        placeholder="Search loaded teachings…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="max-h-64 divide-y divide-border overflow-y-auto rounded-xl border border-border">
        {available.map((item) => (
          <button
            type="button"
            disabled={lessons.length >= 12}
            key={item.id}
            className="flex min-h-14 w-full items-center justify-between gap-4 p-3 text-left text-sm hover:bg-muted disabled:opacity-40"
            onClick={() =>
              onChange([
                ...lessons,
                {
                  id: `${item.kind}_${item.id}`,
                  kind: item.kind,
                  contentId: item.id,
                },
              ])
            }
          >
            <span>
              {item.title}
              <span className="block text-xs text-muted-foreground">
                {item.language.toUpperCase()}
              </span>
            </span>
            <span className="text-primary">Add</span>
          </button>
        ))}
      </div>
      {!loading && !error && available.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No additional published teachings match in this page. Load more when
          available or try another search.
        </p>
      )}
      {loading && (
        <p role="status" className="text-sm">
          Loading teachings…
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {(more || error) && (
        <Button
          type="button"
          variant="outline"
          loading={loading}
          onClick={() => load()}
        >
          {error ? "Retry" : "Load more teachings"}
        </Button>
      )}
    </section>
  );
}
