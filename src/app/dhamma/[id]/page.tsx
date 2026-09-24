"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DhammaService } from "@/lib/dhammaService";
import { DhammaPostReader } from "@/components/dhamma/DhammaPostReader";
import { AppPage } from "@/components/app/AppPage";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import type { DhammaPost } from "@/types/admin";

export default function DhammaPostPage() {
  const { id } = useParams<{ id: string }>();
  return <ArticleLoader key={id} id={id} />;
}
function ArticleLoader({ id }: { id: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [state, setState] = useState<"loading" | "missing" | "error" | "ready">(
    "loading",
  );
  const [post, setPost] = useState<DhammaPost | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setState("loading");
    DhammaService.getPostById(id)
      .then((value) => {
        if (cancelled) return;
        if (!value || value.status !== "published") {
          setState("missing");
          return;
        }
        setPost(value);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);
  if (state === "ready" && post)
    return (
      <DhammaPostReader post={post} onClose={() => router.push("/dhamma")} />
    );
  return (
    <AppPage
      title={t("reader.article")}
      backHref="/dhamma"
      showSettings={false}
    >
      <div
        className="app-card p-6"
        role={state === "loading" ? "status" : "alert"}
      >
        <p className="leading-relaxed text-muted-foreground">
          {t(
            state === "loading"
              ? "common.loading"
              : state === "missing"
                ? "reader.unavailable"
                : "reader.load_error",
          )}
        </p>
        {state === "loading" && (
          <div
            aria-hidden="true"
            className="mt-6 space-y-4 motion-safe:animate-pulse"
          >
            <div className="h-7 w-3/4 rounded-lg bg-muted" />
            <div className="h-4 rounded-lg bg-muted" />
            <div className="h-4 w-5/6 rounded-lg bg-muted" />
          </div>
        )}
        {state === "error" && (
          <Button
            className="mt-4"
            onClick={() => setAttempt((value) => value + 1)}
          >
            {t("common.retry")}
          </Button>
        )}
      </div>
    </AppPage>
  );
}
