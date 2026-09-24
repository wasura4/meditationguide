"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { DhammaPost } from "@/types/admin";
import { getFavoritePosts } from "@/lib/favoritesService";
import { DhammaPostCard } from "./DhammaPostCard";
import { Button } from "@/components/ui/button";

export function FavoritesLibrary() {
  const { user } = useAuth();
  const { t } = useLanguage();
  return user?.id ? (
    <SavedPosts key={user.id} userId={user.id} />
  ) : (
    <Link href="/auth">{t("reader.sign_in_save")}</Link>
  );
}
function SavedPosts({ userId }: { userId: string }) {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<DhammaPost[]>([]);
  const [state, setState] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setState("loading");
    getFavoritePosts(userId)
      .then((value) => {
        if (!cancelled) {
          setPosts(value);
          setState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [userId, attempt]);
  if (state === "loading")
    return (
      <p role="status" className="app-card p-6">
        {t("common.loading")}
      </p>
    );
  if (state === "error")
    return (
      <div role="alert" className="app-card p-6">
        <p>{t("reader.saved_error")}</p>
        <Button
          className="mt-4"
          onClick={() => setAttempt((value) => value + 1)}
        >
          {t("common.retry")}
        </Button>
      </div>
    );
  if (!posts.length)
    return (
      <div className="app-card px-6 py-10 text-center">
        <Bookmark
          size={30}
          className="mx-auto mb-4 text-muted-foreground"
          aria-hidden="true"
        />
        <h2 className="text-lg font-semibold">{t("reader.saved_empty")}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          {t("reader.saved_hint")}
        </p>
        <Link
          href="/dhamma"
          className="mt-5 inline-flex min-h-11 items-center font-medium underline underline-offset-4"
        >
          {t("reader.more_articles")}
        </Link>
      </div>
    );
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <DhammaPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
