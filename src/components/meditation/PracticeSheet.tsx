"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { X } from "lucide-react";

export function PracticeSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useLanguage();
  useEffect(() => {
    const element = ref.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl border border-border bg-card p-6 text-foreground shadow-xl backdrop:bg-black/40"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
