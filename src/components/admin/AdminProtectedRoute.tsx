"use client";
import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
export function AdminProtectedRoute({
  children,
  requiredPermission,
}: {
  children: ReactNode;
  requiredPermission?: { resource: string; action: string };
}) {
  const { adminUser, firebaseUser, loading, error, hasPermission } =
    useAdminAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !firebaseUser) router.replace("/admin/login");
  }, [loading, firebaseUser, router]);
  if (loading)
    return (
      <div
        role="status"
        className="flex min-h-screen items-center justify-center bg-background text-muted-foreground"
      >
        Verifying administrator access…
      </div>
    );
  if (
    !adminUser ||
    (requiredPermission &&
      !hasPermission(requiredPermission.resource, requiredPermission.action))
  )
    return (
      <main className="mx-auto max-w-lg space-y-4 px-6 py-20">
        <h1 className="text-2xl font-semibold">Access unavailable</h1>
        <p className="text-muted-foreground">
          {error ||
            "Your account does not have permission to open this section."}
        </p>
        {adminUser && <nav aria-label="Available admin sections" className="flex flex-wrap gap-3">
          {[
            ['analytics','dashboard','Dashboard'],['dhamma','dhamma','Dhamma'],['audio','audio','Audio'],['content','events','Events'],['users','users','Users'],['settings','settings','Settings']
          ].filter(([resource])=>hasPermission(resource,'read')).map(([,page,label])=><Link key={page} href={`/admin/${page}`} className="rounded-xl border border-border px-4 py-3 text-sm">{label}</Link>)}
        </nav>}
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center underline"
        >
          Return to the app
        </Link>
      </main>
    );
  return <>{children}</>;
}
