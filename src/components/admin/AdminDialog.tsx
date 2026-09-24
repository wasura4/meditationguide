"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
export function AdminDialog({
  title,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-0 text-foreground shadow-xl backdrop:bg-black/40"
    >
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          aria-label="Close dialog"
          className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted"
        >
          <X size={20} />
        </button>
      </header>
      <div className="p-6">{children}</div>
    </dialog>
  );
}
