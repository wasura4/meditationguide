import type { DhammaPostFormData } from "@/types/admin";

/** An explicit empty ID list replaces legacy embedded tracks; it is not a fallback. */
export function playlistTrackIds(data: {
  audioIds?: string[];
  audioFiles?: { id: string }[];
}): string[] {
  return [
    ...new Set(
      (Array.isArray(data.audioIds)
        ? data.audioIds
        : (data.audioFiles || []).map((track) => track.id)
      ).filter((id) => typeof id === "string" && id.length > 0),
    ),
  ];
}
export function orderedTracks<T extends { id: string }>(
  ids: string[],
  tracks: T[],
): T[] {
  const byId = new Map(tracks.map((track) => [track.id, track]));
  return [...new Set(ids)].flatMap((id) =>
    byId.has(id) ? [byId.get(id)!] : [],
  );
}
export function moveTrack(
  ids: string[],
  id: string,
  direction: -1 | 1,
): string[] {
  const position = ids.indexOf(id),
    next = position + direction;
  if (position < 0 || next < 0 || next >= ids.length) return ids;
  const result = [...ids];
  [result[position], result[next]] = [result[next], result[position]];
  return result;
}
export function isPublishedAudio(track: {
  status?: string;
  isPublic?: boolean;
}): boolean {
  return track.status === "active" && track.isPublic !== false;
}
export function articleFields(
  data: Record<string, unknown>,
): DhammaPostFormData {
  return {
    title: typeof data.title === "string" ? data.title : "",
    content: typeof data.content === "string" ? data.content : "",
    excerpt: typeof data.excerpt === "string" ? data.excerpt : "",
    featuredImage:
      typeof data.featuredImage === "string" ? data.featuredImage : "",
    category: (data.category || "meditation") as DhammaPostFormData["category"],
    language: (data.language || "si") as DhammaPostFormData["language"],
    tags: Array.isArray(data.tags)
      ? data.tags.filter((tag) => typeof tag === "string")
      : [],
    featured: data.featured === true,
    seoTitle: typeof data.seoTitle === "string" ? data.seoTitle : "",
    seoDescription:
      typeof data.seoDescription === "string" ? data.seoDescription : "",
    status: (data.status || "draft") as DhammaPostFormData["status"],
  };
}
export function assertVersion(current: unknown, expected: number) {
  if ((typeof current === "number" ? current : 0) !== expected)
    throw new Error(
      "This item changed after you opened it. Reload the latest version before saving. Your unsaved changes are still available.",
    );
}
