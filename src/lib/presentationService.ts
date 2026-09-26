import {
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getBytes, ref } from "firebase/storage";
import { db, storage } from "./firebase";
import { assertVersion } from "./editorial";
import {
  presentationFields,
  MAX_PDF_BYTES,
  type Presentation,
  type PresentationFields,
} from "./presentations";

export function newPresentationId() {
  return doc(collection(db, "learning_presentations")).id;
}
export async function savePresentation(
  id: string,
  fields: PresentationFields,
  actor: string,
  version?: number,
) {
  const values = presentationFields(fields, id);
  const reference = doc(db, "learning_presentations", id);
  if (values.status === "published" && values.teacherId) {
    const teacher = await getDoc(doc(db, "teachers", values.teacherId));
    if (!teacher.exists() || teacher.data().status !== "published")
      throw new Error("Publish the selected teacher first.");
  }
  await runTransaction(db, async (transaction) => {
    const current = await transaction.get(reference);
    if (version !== undefined) {
      if (!current.exists())
        throw new Error("This presentation no longer exists.");
      assertVersion(current.data().version, version);
    } else if (current.exists())
      throw new Error(
        "This presentation already exists. Reload it before editing.",
      );
    transaction.set(reference, {
      ...values,
      version: version === undefined ? 0 : version + 1,
      createdAt: current.exists()
        ? current.data().createdAt
        : serverTimestamp(),
      createdBy: current.exists() ? current.data().createdBy : actor,
      updatedAt: serverTimestamp(),
      updatedBy: actor,
    });
  });
  return version === undefined ? 0 : version + 1;
}
export async function getPresentation(
  id: string,
): Promise<Presentation | null> {
  try {
    const result = await getDoc(doc(db, "learning_presentations", id));
    return result.exists()
      ? ({ ...result.data(), id: result.id } as Presentation)
      : null;
  } catch (error) {
    if ((error as { code?: string }).code === "permission-denied") return null;
    throw error;
  }
}
// Authenticated SDK requests enforce Storage rules; never persist bearer download URLs.
export function presentationBytes(path: string) {
  return getBytes(ref(storage, path), MAX_PDF_BYTES);
}
export async function getReadingPosition(uid: string, id: string) {
  const result = await getDoc(doc(db, "users", uid, "learning_reading", id));
  return result.data() as
    | { page: number; storagePath: string; pathId: string }
    | undefined;
}
export function saveReadingPosition(
  uid: string,
  presentation: Presentation,
  page: number,
  pathId: string,
) {
  return setDoc(doc(db, "users", uid, "learning_reading", presentation.id), {
    page,
    storagePath: presentation.storagePath,
    pathId,
    updatedAt: serverTimestamp(),
  });
}
