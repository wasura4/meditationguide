"use client";
import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { adminResourceForPath } from "@/lib/adminAccess";
function AccessGate({ children }: { children: ReactNode }) {
  const path = usePathname();
  if (path === "/admin/login") return <>{children}</>;
  const resource = adminResourceForPath(path);
  return (
    <AdminProtectedRoute
      requiredPermission={{
        resource: resource || "unavailable",
        action: "read",
      }}
    >
      {children}
    </AdminProtectedRoute>
  );
}
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <AccessGate>{children}</AccessGate>
    </AdminAuthProvider>
  );
}
