"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Users, ChevronRight } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppPage } from "@/components/app/AppPage";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { LearningService } from "@/lib/learningService";
import { learningText, type Teacher } from "@/lib/learning";
export default function TeacherPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <ProtectedRoute>
      <Profile key={id} id={id} />
    </ProtectedRoute>
  );
}
function Profile({ id }: { id: string }) {
  const { t, language } = useLanguage();
  const [teacher, setTeacher] = useState<Teacher | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(false),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    LearningService.teacher(id)
      .then((value) => {
        if (active) setTeacher(value);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, attempt]);
  return (
    <AppPage
      title={
        teacher
          ? learningText(teacher.name, teacher.nameEn, language)
          : t("learning.teachers")
      }
      backHref="/learn"
    >
      {loading ? (
        <p role="status">{t("common.loading")}</p>
      ) : error ? (
        <div role="alert" className="app-card p-6">
          <p>{t("learning.load_error")}</p>
          <Button
            className="mt-4"
            onClick={() => setAttempt((value) => value + 1)}
          >
            {t("common.retry")}
          </Button>
        </div>
      ) : teacher ? (
        <article className="app-card space-y-5 p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-primary">
            <Users size={30} />
          </div>
          <p className="whitespace-pre-wrap text-[15px] leading-loose">
            {learningText(teacher.bio, teacher.bioEn, language)}
          </p>
          <Link
            href="/learn"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
          >
            {t("learning.browse")}
            <ChevronRight size={17} />
          </Link>
        </article>
      ) : (
        <p className="app-card p-6">{t("learning.unavailable_teacher")}</p>
      )}
    </AppPage>
  );
}
