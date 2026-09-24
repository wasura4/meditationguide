"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpen, Clock, ChevronRight } from "lucide-react";
import type { DhammaPost } from "@/types/admin";
import { useLanguage } from "@/contexts/LanguageContext";

interface DhammaPostCardProps {
  post: DhammaPost;
  onClick?: () => void;
  featured?: boolean;
}

export function DhammaPostCard({
  post,
  onClick,
  featured = false,
}: DhammaPostCardProps) {
  const { t } = useLanguage();
  const content = (
    <>
      <div className="relative h-36 w-full shrink-0 bg-primary/10">
        {post.featuredImage ? (
          <Image
            src={post.featuredImage}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 320px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen
              size={36}
              strokeWidth={1.2}
              className="text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {featured
            ? t("interface.featured_reading")
            : t("reader.category_" + post.category)}
        </p>
        <h3 className="mb-2 line-clamp-3 text-base font-semibold leading-relaxed">
          {post.title}
        </h3>
        {post.authorName && (
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            {post.authorName}
          </p>
        )}
        {post.excerpt && (
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
          {post.readTime > 0 && (
            <span className="flex items-center gap-1.5">
              <Clock size={14} aria-hidden="true" />
              {t("interface.reading_minutes", { count: post.readTime })}
            </span>
          )}
          <ChevronRight size={16} aria-hidden="true" />
        </div>
      </div>
    </>
  );
  const className =
    "app-card flex h-full w-full flex-col overflow-hidden text-left transition-colors hover:border-primary/50";
  return onClick ? (
    <button
      type="button"
      aria-label={post.title}
      onClick={onClick}
      className={className}
    >
      {content}
    </button>
  ) : (
    <Link
      href={`/dhamma/${post.id}`}
      aria-label={post.title}
      className={className}
    >
      {content}
    </Link>
  );
}
