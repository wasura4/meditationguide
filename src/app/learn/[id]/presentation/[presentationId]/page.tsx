"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppPage } from "@/components/app/AppPage";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LearningService } from "@/lib/learningService";
import { learningText, type LearningPath, type Teacher } from "@/lib/learning";
import { readingPage, type Presentation } from "@/lib/presentations";
import {
  getPresentation,
  getReadingPosition,
  presentationBytes,
  saveReadingPosition,
} from "@/lib/presentationService";
const PdfReader = dynamic(
  () => import("@/components/learning/PdfReader").then((m) => m.PdfReader),
  { ssr: false },
);
export default function PresentationPage() {
  const { id, presentationId } = useParams<{
    id: string;
    presentationId: string;
  }>();
  return (
    <ProtectedRoute>
      <Lesson key={`${id}-${presentationId}`} pathId={id} id={presentationId} />
    </ProtectedRoute>
  );
}
function Lesson({ pathId, id }: { pathId: string; id: string }) {
  const { user } = useAuth(),
    { t, language } = useLanguage();
  const [data, setData] = useState<{
    path: LearningPath;
    presentation: Presentation;
    bytes: ArrayBuffer;
    page: number;
    teacher: Teacher | null;
  } | null>(null);
  const [completed, setCompleted] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(false),
    [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false),
    [saveError, setSaveError] = useState(false),
    [positionError, setPositionError] = useState(false);
  const lastPage = useRef(0),
    pendingPage = useRef<number | null>(null),
    writing = useRef(false),
    completionLock = useRef(false);
  const uid = user?.id;
  useEffect(() => {
    if (!uid) return;
    let active = true;
    setLoading(true);
    setError(false);
    void (async () => {
      const [path, presentation, progress, position] = await Promise.all([
        LearningService.path(pathId),
        getPresentation(id),
        LearningService.progress(uid, pathId),
        getReadingPosition(uid, id),
      ]);
      if (
        !path ||
        !presentation ||
        presentation.status !== "published" ||
        !path.lessonIds.includes(`pdf_${id}`)
      )
        throw new Error("Unavailable");
      const [bytes, teacher] = await Promise.all([
        presentationBytes(presentation.storagePath),
        presentation.teacherId
          ? LearningService.teacher(presentation.teacherId)
          : Promise.resolve(null),
      ]);
      const page =
        position?.storagePath === presentation.storagePath
          ? readingPage(position.page, presentation.pageCount)
          : 1;
      if (active) {
        setData({ path, presentation, bytes, page, teacher });
        setCompleted(progress.includes(`pdf_${id}`));
      }
    })()
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, pathId, uid, attempt]);
  const remember = useCallback(
    async (page: number) => {
      if (!uid || !data || page === lastPage.current) return;
      pendingPage.current = page;
      if (writing.current) return;
      writing.current = true;
      let savingPage = page;
      try {
        while (pendingPage.current !== null) {
          const next = pendingPage.current;
          savingPage = next;
          pendingPage.current = null;
          await saveReadingPosition(uid, data.presentation, next, pathId);
          lastPage.current = next;
          setPositionError(false);
        }
      } catch {
        pendingPage.current ??= savingPage;
        setPositionError(true);
      } finally {
        writing.current = false;
      }
    },
    [uid, data, pathId],
  );
  const mark = async () => {
    if (!uid || completionLock.current) return;
    completionLock.current = true;
    setSaving(true);
    setSaveError(false);
    try {
      await LearningService.complete(uid, pathId, `pdf_${id}`, !completed);
      setCompleted(!completed);
    } catch {
      setSaveError(true);
    } finally {
      completionLock.current = false;
      setSaving(false);
    }
  };
  const presentation = data?.presentation;
  const title = presentation
    ? learningText(presentation.title, presentation.titleEn, language)
    : t("presentation.format");
  const next =
    data?.path.lessons[
      data.path.lessons.findIndex((lesson) => lesson.id === `pdf_${id}`) + 1
    ];
  return (
    <AppPage title={title} backHref={`/learn/${pathId}`}>
      {loading ? (
        <p role="status" className="app-card p-6">
          {t("common.loading")}
        </p>
      ) : error || !data || !presentation ? (
        <div role="alert" className="app-card space-y-3 p-6">
          <p>{t("presentation.load_error")}</p>
          <Button onClick={() => setAttempt((a) => a + 1)}>
            {t("common.retry")}
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <section className="app-card space-y-3 p-5">
            <p className="text-sm text-muted-foreground">
              {t("presentation.details", {
                pages: presentation.pageCount,
                minutes: presentation.minutes,
              })}{" "}
              · {presentation.language.toUpperCase()}
            </p>
            <p className="whitespace-pre-wrap leading-relaxed">
              {learningText(
                presentation.description,
                presentation.descriptionEn,
                language,
              )}
            </p>
            {data.teacher && (
              <Link
                className="inline-block py-2 text-sm text-primary"
                href={`/teachers/${data.teacher.id}`}
              >
                {learningText(data.teacher.name, data.teacher.nameEn, language)}
              </Link>
            )}
            {(presentation.objectives || presentation.objectivesEn) && (
              <div className="border-t border-border pt-3">
                <h2 className="font-semibold">
                  {t("presentation.objectives")}
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                  {learningText(
                    presentation.objectives,
                    presentation.objectivesEn,
                    language,
                  )}
                </p>
              </div>
            )}
          </section>
          <PdfReader
            bytes={data.bytes}
            initialPage={data.page}
            title={title}
            fileName={presentation.fileName}
            allowDownload={presentation.allowDownload}
            onPage={remember}
          />
          {positionError && (
            <div role="alert" className="app-card p-4 text-sm">
              <p>{t("presentation.position_error")}</p>
              <Button
                variant="ghost"
                onClick={() =>
                  void remember(
                    pendingPage.current || lastPage.current || data.page,
                  )
                }
              >
                {t("common.retry")}
              </Button>
            </div>
          )}
          <section className="app-card space-y-3 p-5">
            <p className="text-sm text-muted-foreground">
              {t("learning.progress_note")}
            </p>
            {saveError && <p role="alert">{t("learning.save_error")}</p>}
            <div className="flex flex-wrap gap-3">
              <Button
                loading={saving}
                disabled={saving}
                onClick={() => void mark()}
              >
                {t(
                  completed
                    ? "learning.mark_incomplete"
                    : "learning.mark_complete",
                )}
              </Button>
              {next && (
                <Link
                  className="inline-flex min-h-11 items-center rounded-xl border border-input px-4 text-sm font-medium"
                  href={
                    next.kind === "pdf"
                      ? `/learn/${pathId}/presentation/${next.contentId}`
                      : `/learn/${pathId}#lesson-${next.id}`
                  }
                >
                  {t("presentation.next_lesson")}
                </Link>
              )}
            </div>
          </section>
        </div>
      )}
    </AppPage>
  );
}
