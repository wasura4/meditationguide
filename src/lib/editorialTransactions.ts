import {
  doc,
  runTransaction,
  serverTimestamp,
  getDocFromServer,
  type DocumentReference,
  type Firestore,
} from "firebase/firestore";
import type { DhammaPostFormData, KamatahanAudio } from "@/types/admin";
import { articleFields, assertVersion } from "./editorial";

// Rules can reject a racing write before Firestore retries its transaction.
// Only label it a conflict after a fresh, authorized read confirms the version changed.
export async function explainVersionConflict(
  reference: DocumentReference,
  expected: number,
  error: unknown,
): Promise<never> {
  const latest = await getDocFromServer(reference).catch(() => null);
  if (latest?.exists()) assertVersion(latest.data().version, expected);
  throw error;
}

export type AudioMetadata = Pick<
  KamatahanAudio,
  | "title"
  | "description"
  | "category"
  | "language"
  | "duration"
  | "durationFormatted"
  | "status"
  | "isPublic"
>;
export async function saveAudioMetadata(
  store: Firestore,
  id: string,
  updates: Partial<AudioMetadata>,
  version: number,
  actorId: string,
) {
  const reference = doc(store, "kamatahan_audio", id);
  await runTransaction(store, async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists()) throw new Error("This recording no longer exists.");
    assertVersion(snapshot.data().version, version);
    transaction.update(reference, {
      ...updates,
      version: version + 1,
      updatedAt: serverTimestamp(),
      updatedBy: actorId,
    });
  }).catch((error) => explainVersionConflict(reference, version, error));
}

export async function saveArticleVersion(
  store: Firestore,
  id: string,
  change: DhammaPostFormData | { status: "archived" | "draft" },
  actorId: string,
  expectedVersion: number,
  restoreVersion?: number,
) {
  const reference = doc(store, "dhamma_posts", id);
  await runTransaction(store, async (transaction) => {
    const current = await transaction.get(reference);
    if (!current.exists()) throw new Error("This article no longer exists.");
    const before = current.data();
    assertVersion(before.version, expectedVersion);
    let fields: Record<string, unknown> = { ...change };
    if (restoreVersion !== undefined) {
      const checkpoint = await transaction.get(
        doc(reference, "revisions", String(restoreVersion)),
      );
      if (!checkpoint.exists())
        throw new Error("This revision is no longer available.");
      fields = {
        ...articleFields(checkpoint.data().snapshot),
        status: "draft",
      };
    }
    const version = expectedVersion + 1;
    transaction.set(doc(reference, "revisions", String(version)), {
      version,
      snapshot: before,
      actorId,
      createdAt: serverTimestamp(),
      action:
        restoreVersion !== undefined
          ? "restore"
          : change.status === "archived"
            ? "archive"
            : "update",
    });
    transaction.update(reference, {
      ...fields,
      version,
      updatedAt: serverTimestamp(),
      updatedBy: actorId,
      publishedAt:
        before.publishedAt ??
        (fields.status === "published" ? serverTimestamp() : null),
    });
  }).catch((error) =>
    explainVersionConflict(reference, expectedVersion, error),
  );
}
