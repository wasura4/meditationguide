"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  learningText,
  learningProgress,
  type LearningPath,
} from "@/lib/learning";
import { LearningService } from "@/lib/learningService";
import { getPresentation } from "@/lib/presentationService";
import { Button } from "@/components/ui/button";
type Recent = {
  path: LearningPath;
  href: string;
  count: number;
  total: number;
  page: number | undefined;
};
export function ContinueLearning() {
  const { user } = useAuth(),
    { t, language } = useLanguage();
  const [items, setItems] = useState<Recent[]>([]),
    [error, setError] = useState(false),
    [attempt, setAttempt] = useState(0);
  const uid = user?.id;
  useEffect(() => {
    setItems([]);
    if (!uid) return;
    let active = true;
    setError(false);
    void (async () => {
      const [reading, completions] = await Promise.all(
        ["learning_reading", "learning_progress"].map((name) =>
          getDocs(
            query(
              collection(db, "users", uid, name),
              orderBy("updatedAt", "desc"),
              limit(12),
            ),
          ),
        ),
      );
      const recents = [
        ...reading.docs.map((row) => ({
          pathId: String(row.data().pathId),
          pdfId: row.id,
          page: Number(row.data().page),
          storagePath: row.data().storagePath as string,
          time: row.data().updatedAt?.toMillis() || 0,
        })),
        ...completions.docs.map((row) => ({
          pathId: row.id,
          pdfId: "",
          page: 0,
          storagePath: "",
          time: row.data().updatedAt?.toMillis() || 0,
        })),
      ].sort((a, b) => b.time - a.time);
      const unique = recents
        .filter(
          (item, index) =>
            recents.findIndex((other) => other.pathId === item.pathId) ===
            index,
        )
        .slice(0, 6);
      const rows = await Promise.all(
        unique.map(async (recent) => {
          const [path, completed] = await Promise.all([
            LearningService.path(recent.pathId),
            LearningService.progress(uid, recent.pathId),
          ]);
          if (!path) return null;
          const progress = learningProgress(path.lessons, completed);
          if (!progress.next) return null;
          let target = path.lessons.find(
            (lesson) =>
              lesson.id === `pdf_${recent.pdfId}` &&
              !completed.includes(lesson.id),
          );
          let page: number | undefined;
          if (target) {
            const pdf = await getPresentation(recent.pdfId);
            if (pdf?.status === "published")
              page = pdf.storagePath === recent.storagePath ? recent.page : 1;
            else target = undefined;
          }
          target ||= path.lessons.find((lesson) => lesson.id === progress.next);
          const href =
            target?.kind === "pdf"
              ? `/learn/${path.id}/presentation/${target.contentId}`
              : `/learn/${path.id}#lesson-${target?.id}`;
          return {
            path,
            href,
            count: progress.count,
            total: progress.total,
            page,
          };
        }),
      );
      if (active)
        setItems(rows.filter((row): row is Recent => row !== null).slice(0, 3));
    })().catch(() => {
      if (active) setError(true);
    });
    return () => {
      active = false;
    };
  }, [uid, attempt]);
  if (error)
    return (
      <div className="app-card mb-6 p-4">
        <p className="text-sm">{t("presentation.recent_error")}</p>
        <Button variant="ghost" onClick={() => setAttempt((a) => a + 1)}>
          {t("common.retry")}
        </Button>
      </div>
    );
  if (!items.length) return null;
  return (
    <section className="mb-6 space-y-3">
      <h2 className="text-lg font-semibold">{t("presentation.continue")}</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <Link
            href={item.href}
            key={item.path.id}
            className="app-card space-y-3 p-5 hover:bg-muted/40"
          >
            <h3 className="font-semibold">
              {learningText(item.path.title, item.path.titleEn, language)}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("learning.progress", { done: item.count, total: item.total })}
            </p>
            <p className="text-sm font-medium text-primary">
              {item.page
                ? t("presentation.resume_page", { page: item.page })
                : t("learning.continue")}{" "}
              →
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
