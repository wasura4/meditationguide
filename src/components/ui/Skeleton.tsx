import type { ReactNode } from "react";

/** Decorative placeholder; group related shapes inside SkeletonStatus. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton rounded-xl ${className}`} />;
}

export function SkeletonStatus({ label, children, className = "" }: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return <div role="status" className={className}>
    <span className="sr-only">{label}</span>
    <div aria-hidden="true">{children}</div>
  </div>;
}
