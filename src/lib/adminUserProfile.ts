import type { User } from "@/types";

/** Preserve unknown dates as unknown rather than presenting them as today. */
export function adminProfileDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    const date = value.toDate();
    return date instanceof Date ? date : new Date(NaN);
  }
  return new Date(NaN);
}

export function normalizeAdminProfile(
  id: string,
  data: Record<string, unknown>,
): User {
  const progress = data.pathProgress as
    | Partial<User["pathProgress"]>
    | undefined;
  const stage = progress?.currentStage;
  return {
    ...data,
    id,
    displayName: typeof data.displayName === "string" ? data.displayName : "",
    email: typeof data.email === "string" ? data.email : "",
    role: data.role || "user",
    isAnonymous: data.isAnonymous === true,
    createdAt: adminProfileDate(data.createdAt),
    updatedAt: adminProfileDate(data.updatedAt),
    lastLoginAt: adminProfileDate(data.lastLoginAt),
    preferences: data.preferences || {},
    pathProgress:
      typeof stage === "number" &&
      Number.isInteger(stage) &&
      stage >= 1 &&
      stage <= 8
        ? {
            currentStage: stage,
            updatedAt: adminProfileDate(progress?.updatedAt),
            history: Array.isArray(progress?.history)
              ? progress.history
                  .filter(
                    (item) =>
                      item &&
                      Number.isInteger(item.stage) &&
                      item.stage >= 1 &&
                      item.stage <= 8,
                  )
                  .map((item) => ({
                    ...item,
                    updatedAt: adminProfileDate(item.updatedAt),
                  }))
              : [],
          }
        : undefined,
  } as User;
}
