import type { AdminUser, AdminPermission } from "@/types/admin";
const RESOURCES = [
  "audio",
  "dhamma",
  "users",
  "analytics",
  "settings",
  "content",
];
const ACTIONS = ["create", "read", "update", "delete"];
export function canAdminAccess(
  admin: AdminUser | null,
  resource: string,
  action: string,
): boolean {
  if (
    !admin ||
    admin.isActive !== true ||
    !RESOURCES.includes(resource) ||
    !ACTIONS.includes(action)
  )
    return false;
  if (admin.role === "super_admin") return true;
  return admin.permissions.some(
    (permission) =>
      permission.resource === resource &&
      permission.actions.includes(action as AdminPermission["actions"][number]),
  );
}
export function normalizeAdmin(
  id: string,
  data: Record<string, unknown>,
): AdminUser | null {
  if (
    data.isActive !== true ||
    !["admin", "super_admin", "content_admin", "moderator"].includes(
      String(data.role),
    )
  )
    return null;
  const permissions: AdminPermission[] = Array.isArray(data.permissions)
    ? data.permissions.slice(0, 6).flatMap((value) => {
        if (
          !value ||
          !RESOURCES.includes(value.resource) ||
          !Array.isArray(value.actions)
        )
          return [];
        return [
          {
            resource: value.resource,
            actions: value.actions.filter((action: string) =>
              ACTIONS.includes(action),
            ),
          },
        ];
      })
    : [];
  if (
    data.role !== "super_admin" &&
    !permissions.some((permission) => permission.actions.length)
  )
    return null;
  const date = (value: unknown): Date | undefined => {
    const converted =
      value &&
      typeof value === "object" &&
      "toDate" in value &&
      typeof value.toDate === "function"
        ? value.toDate()
        : value instanceof Date
          ? value
          : typeof value === "string"
            ? new Date(value)
            : undefined;
    return converted instanceof Date && Number.isFinite(converted.getTime())
      ? converted
      : undefined;
  };
  return {
    id,
    email: typeof data.email === "string" ? data.email : "",
    displayName:
      typeof data.displayName === "string" ? data.displayName : "Administrator",
    role: data.role as AdminUser["role"],
    permissions,
    isActive: true,
    lastLogin: date(data.lastLogin),
    createdAt: date(data.createdAt) || new Date(0),
    updatedAt: date(data.updatedAt) || new Date(0),
  };
}
export function adminResourceForPath(path: string): string | null {
  const page = path.split("/")[2] || "dashboard";
  return (
    (
      {
        dashboard: "analytics",
        analytics: "analytics",
        users: "users",
        settings: "settings",
        theme: "settings",
        audio: "audio",
        playlists: "audio",
        dhamma: "dhamma",
        events: "content",
        types: "content",
        categories: "content",
      } as Record<string, string>
    )[page] || null
  );
}
