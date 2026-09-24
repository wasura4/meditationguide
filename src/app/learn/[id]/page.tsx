"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Check, BookOpen, Headphones, Play, Users } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppPage } from "@/components/app/AppPage";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayer } from "@/contexts/PlayerContext";
import { LearningService, type LessonContent } from "@/lib/learningService";
import {
  learningProgress,
  learningText,
  type LearningPath,
  type Teacher,
} from "@/lib/learning";
export default function LearningPathPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <ProtectedRoute>
      <PathContent key={id} id={id} />
    </ProtectedRoute>
  );
}
function PathContent({ id }: { id: string }) {
  const { t, language } = useLanguage(),
    { user } = useAuth(),
    player = usePlayer();
  const [path, setPath] = useState<LearningPath | null>(null),
    [teacher, setTeacher] = useState<Teacher | null>(null),
    [content, setContent] = useState<Record<string, LessonContent | null>>({}),
    [completed, setCompleted] = useState<string[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0),
    [saving, setSaving] = useState<string | null>(null),
    [saveError, setSaveError] = useState("");
  const userId = user?.id;
  const pending = useRef(false);
  useEffect(() => {
    if (!userId) return;
    let active = true;
    setLoading(true);
    setError("");
    (async () => {
      const value = await LearningService.path(id);
      if (!active) return;
      setPath(value);
      if (!value) return;
      const [profile, lessons, progress] = await Promise.all([
        value.teacherId
          ? LearningService.teacher(value.teacherId)
          : Promise.resolve(null),
        Promise.all(
          value.lessons.map(
            async (lesson) =>
              [lesson.id, await LearningService.lesson(lesson)] as const,
          ),
        ),
        LearningService.progress(userId, id),
      ]);
      if (active) {
        setTeacher(profile);
        setContent(Object.fromEntries(lessons));
        setCompleted(progress);
      }
    })()
      .catch(() => {
        if (active) setError("learning.load_error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, userId, attempt]);
  const mark = async (lessonId: string, complete: boolean) => {
    if (!user || pending.current) return;
    pending.current = true;
    setSaving(lessonId);
    setSaveError("");
    try {
      await LearningService.complete(user.id, id, lessonId, complete);
      setCompleted((previous) =>
        complete
          ? [...new Set([...previous, lessonId])]
          : previous.filter((value) => value !== lessonId),
      );
    } catch {
      setSaveError("learning.save_error");
    } finally {
      pending.current = false;
      setSaving(null);
    }
  };
  const progress = learningProgress(path?.lessons || [], completed);
  const nextAvailable = path?.lessons.find(
    (lesson) => content[lesson.id] && !completed.includes(lesson.id),
  )?.id;
  return (
    <AppPage
      title={
        path
          ? learningText(path.title, path.titleEn, language)
          : t("learning.paths")
      }
      backHref="/learn"
    >
      {loading ? (
        <p role="status" className="app-card p-6">
          {t("common.loading")}
        </p>
      ) : error ? (
        <div role="alert" className="app-card p-6">
          <p>{t(error)}</p>
          <Button
            className="mt-4"
            onClick={() => setAttempt((value) => value + 1)}
          >
            {t("common.retry")}
          </Button>
        </div>
      ) : !path ? (
        <p className="app-card p-6">{t("learning.unavailable_path")}</p>
      ) : (
        <div className="space-y-6">
          <section className="app-card space-y-4 p-5 sm:p-6">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-muted px-3 py-1.5">
                {t(`learning.topic_${path.topic}`)}
              </span>
              <span className="rounded-full bg-muted px-3 py-1.5">
                {t(`learning.level_${path.level}`)}
              </span>
              <span className="rounded-full bg-muted px-3 py-1.5">
                {t(`learning.language_${path.language}`)}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {learningText(path.description, path.descriptionEn, language)}
            </p>
            {teacher && (
              <Link
                href={`/teachers/${teacher.id}`}
                className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
              >
                <Users size={18} />
                {learningText(teacher.name, teacher.nameEn, language)}
              </Link>
            )}
            <div className="border-t border-border pt-4">
              <div className="mb-3 flex justify-between text-sm font-medium">
                <span>
                  {t("learning.progress", {
                    done: progress.count,
                    total: progress.total,
                  })}
                </span>
                <span>{progress.percent}%</span>
              </div>
              <progress
                value={progress.count}
                max={Math.max(1, progress.total)}
                aria-label={t("learning.your_progress")}
                className="h-2 w-full overflow-hidden rounded-full bg-muted [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary"
              />
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {t("learning.progress_note")}
              </p>
              {nextAvailable && (
                <a
                  href={`#lesson-${nextAvailable}`}
                  className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
                >
                  {t(progress.count ? "learning.continue" : "learning.begin")}
                </a>
              )}
              {progress.total > 0 && progress.count === progress.total && (
                <p className="mt-4 text-sm font-medium text-primary">
                  {t("learning.finished")}
                </p>
              )}
            </div>
          </section>
          {saveError && (
            <p role="alert" className="app-card p-4 text-sm text-destructive">
              {t(saveError)}
            </p>
          )}
          <ol className="app-card divide-y divide-border">
            {path.lessons.map((lesson, index) => {
              const teaching = content[lesson.id],
                done = completed.includes(lesson.id);
              return (
                <li
                  id={`lesson-${lesson.id}`}
                  key={lesson.id}
                  className="scroll-mt-20 space-y-4 p-5 sm:p-6"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      {done ? <Check size={18} /> : index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        {lesson.kind === "article" ? (
                          <BookOpen size={14} />
                        ) : (
                          <Headphones size={14} />
                        )}{" "}
                        {t(
                          lesson.kind === "article"
                            ? "learning.article"
                            : "learning.recording",
                        )}
                      </p>
                      <h2 className="font-semibold leading-relaxed">
                        {teaching?.title || t("learning.unavailable_lesson")}
                      </h2>
                    </div>
                  </div>
                  {teaching ? (
                    <div className="flex flex-wrap gap-3 sm:pl-13">
                      {lesson.kind === "article" ? (
                        <Link
                          href={`/dhamma/${lesson.contentId}?learningPath=${encodeURIComponent(id)}`}
                          className="inline-flex min-h-11 items-center rounded-xl border border-input px-4 text-sm font-medium"
                        >
                          {t("learning.read")}
                        </Link>
                      ) : (
                        <Button
                          className="min-h-11 rounded-xl"
                          variant="outline"
                          onClick={() => {
                            if (teaching.audio)
                              player.start({
                                id: `learning-${id}-${lesson.id}`,
                                name: learningText(
                                  path.title,
                                  path.titleEn,
                                  language,
                                ),
                                audioFiles: [teaching.audio],
                              });
                          }}
                        >
                          <Play size={16} className="mr-2" />
                          {t("learning.listen")}
                        </Button>
                      )}
                      <Button
                        className="min-h-11 rounded-xl"
                        variant={done ? "ghost" : "outline"}
                        disabled={!!saving}
                        loading={saving === lesson.id}
                        onClick={() => mark(lesson.id, !done)}
                      >
                        {t(
                          done
                            ? "learning.mark_incomplete"
                            : "learning.mark_complete",
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("learning.unavailable_hint")}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </AppPage>
  );
}
