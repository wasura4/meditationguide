"use client";
import { useEffect, useState } from "react";
import { prepareArticle } from "@/lib/articleContent";

export function ArticlePreview({
  content,
  title,
}: {
  content: string;
  title: string;
}) {
  const [html, setHtml] = useState("");
  useEffect(() => {
    setHtml(prepareArticle(content, window).html);
  }, [content]);
  return (
    <section
      aria-label="Article phone preview"
      className="mx-auto max-h-[600px] w-full max-w-[390px] overflow-y-auto rounded-3xl border border-border bg-background p-6 text-foreground shadow-sm"
    >
      <p className="mb-4 text-xs font-medium text-muted-foreground">
        Reader preview
      </p>
      <h1 className="mb-5 text-2xl font-semibold leading-relaxed">
        {title || "Untitled article"}
      </h1>
      <div
        className="reader-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
export function ArticleSummary({ content }: { content: string }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const prepared = prepareArticle(content, window);
    setText(prepared.videoOnly ? "Video teaching" : prepared.text);
  }, [content]);
  return <p className="line-clamp-3">{text}</p>;
}
