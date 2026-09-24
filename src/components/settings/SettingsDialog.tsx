"use client";
import { useEffect, useRef } from "react";

export function SettingsDialog({
  open,
  titleId,
  busy = false,
  onClose,
  children,
}: {
  open: boolean;
  titleId: string;
  busy?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className="settings-dialog"
    >
      {open && children}
    </dialog>
  );
}
