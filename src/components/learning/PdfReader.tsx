"use client";
import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { pdfClient, pdfOptions } from "@/lib/pdfClient";
import { readingPage } from "@/lib/presentations";

export function PdfReader({
  bytes,
  initialPage = 1,
  title,
  fileName,
  allowDownload = false,
  onPage,
}: {
  bytes: ArrayBuffer;
  initialPage?: number;
  title: string;
  fileName: string;
  allowDownload?: boolean;
  onPage?: (page: number) => void;
}) {
  const { t } = useLanguage();
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(initialPage),
    [zoom, setZoom] = useState(1),
    [width, setWidth] = useState(600);
  const [error, setError] = useState(false),
    [rendering, setRendering] = useState(true),
    [text, setText] = useState("");
  const [attempt, setAttempt] = useState(0);
  const host = useRef<HTMLDivElement>(null),
    viewport = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  const onPageRef = useRef(onPage);
  useEffect(() => {
    onPageRef.current = onPage;
  }, [onPage]);
  useEffect(() => {
    let active = true;
    let task:
      | ReturnType<(typeof import("pdfjs-dist"))["getDocument"]>
      | undefined;
    setError(false);
    setRendering(true);
    setPdf(null);
    void pdfClient()
      .then(async (client) => {
        if (!active) return;
        task = client.getDocument({ data: bytes.slice(0), ...pdfOptions });
        const document = await task.promise;
        if (active) {
          setPage(readingPage(initialPage, document.numPages));
          setPdf(document);
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
          setRendering(false);
        }
      });
    return () => {
      active = false;
      void task?.destroy();
    };
  }, [bytes, initialPage, attempt]);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) =>
      setWidth(Math.max(160, entries[0].contentRect.width - 24)),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!pdf) return;
    let active = true;
    let render: RenderTask | undefined;
    setRendering(true);
    setError(false);
    setText("");
    void (async () => {
      const sheet = await pdf.getPage(page);
      if (!active || !canvas.current) return;
      const natural = sheet.getViewport({ scale: 1 });
      const view = sheet.getViewport({ scale: (width / natural.width) * zoom });
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      // A fresh canvas prevents overlapping PDF.js render tasks on rapid navigation.
      const surface = document.createElement("canvas");
      surface.width = Math.ceil(view.width * pixelRatio);
      surface.height = Math.ceil(view.height * pixelRatio);
      render = sheet.render({
        canvas: surface,
        viewport: view,
        transform: [pixelRatio, 0, 0, pixelRatio, 0, 0],
      });
      const [content] = await Promise.all([
        sheet.getTextContent(),
        render.promise,
      ]);
      if (!active || !canvas.current) return;
      canvas.current.width = surface.width;
      canvas.current.height = surface.height;
      canvas.current.style.width = `${view.width}px`;
      canvas.current.style.height = `${view.height}px`;
      canvas.current.getContext("2d")?.drawImage(surface, 0, 0);
      setText(
        content.items.map((item) => ("str" in item ? item.str : "")).join(" "),
      );
      setRendering(false);
      onPageRef.current?.(page);
    })().catch((error) => {
      if (active && error?.name !== "RenderingCancelledException") {
        setError(true);
        setRendering(false);
      }
    });
    return () => {
      active = false;
      render?.cancel();
    };
  }, [pdf, page, zoom, width]);
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([bytes], { type: "application/pdf" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section
      ref={host}
      className="min-w-0 space-y-3 overflow-auto rounded-2xl border border-border bg-card p-3 text-foreground sm:p-4"
    >
      <div
        className="flex flex-wrap items-center gap-2"
        aria-label={t("presentation.controls")}
      >
        <Button
          type="button"
          variant="outline"
          disabled={!pdf || page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          {t("presentation.previous")}
        </Button>
        <label className="flex items-center gap-2 text-sm">
          {t("presentation.page")}
          <select
            className="min-h-11 rounded-lg border border-input bg-background px-2"
            disabled={!pdf}
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
          >
            {Array.from({ length: pdf?.numPages || 1 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>{" "}
          / {pdf?.numPages || "…"}
        </label>
        <Button
          type="button"
          variant="outline"
          disabled={!pdf || page >= pdf.numPages}
          onClick={() => setPage((p) => p + 1)}
        >
          {t("presentation.next")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={zoom <= 0.5}
          aria-label={t("presentation.zoom_out")}
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
        >
          −
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={zoom >= 2}
          aria-label={t("presentation.zoom_in")}
          onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
        >
          +
        </Button>
        <Button type="button" variant="ghost" onClick={() => setZoom(1)}>
          {t("presentation.fit")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            if (document.fullscreenElement)
              void document.exitFullscreen().catch(() => {});
            else void host.current?.requestFullscreen?.().catch(() => {});
          }}
        >
          {t("presentation.fullscreen")}
        </Button>
        {allowDownload && (
          <Button type="button" variant="ghost" onClick={download}>
            {t("presentation.download")}
          </Button>
        )}
      </div>
      {rendering && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("common.loading")}
        </p>
      )}
      {error && (
        <div role="alert" className="space-y-2">
          <p>{t("presentation.render_error")}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setAttempt((a) => a + 1)}
          >
            {t("common.retry")}
          </Button>
        </div>
      )}
      <div
        ref={viewport}
        className="max-h-[75dvh] overflow-auto rounded-xl bg-muted p-3"
        aria-busy={rendering}
      >
        <canvas
          ref={canvas}
          role="img"
          aria-label={`${title} · ${t("presentation.page")} ${page}`}
          className={rendering || error ? "invisible" : "mx-auto block"}
        />
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer py-2 font-medium">
          {t("presentation.page_text")}
        </summary>
        <p className="whitespace-pre-wrap leading-relaxed" dir="auto">
          {text || t("presentation.no_text")}
        </p>
      </details>
    </section>
  );
}
