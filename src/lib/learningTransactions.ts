import {
  collection,
  getDocFromServer,
  doc,
  runTransaction,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import { assertVersion, isPublishedAudio } from "./editorial";
import {
  teacherFields,
  pathFields,
  lessonsFromIds,
  lessonCollection,
  type TeacherFields,
  type LearningPathFields,
} from "./learning";
import { explainVersionConflict } from "./editorialTransactions";

export async function saveTeacher(
  store: Firestore,
  fields: TeacherFields,
  actor: string,
  id?: string,
  version = 0,
) {
  const values = teacherFields(fields),
    reference = id
      ? doc(store, "teachers", id)
      : doc(collection(store, "teachers"));
  await runTransaction(store, async (transaction) => {
    if (id) {
      const current = await transaction.get(reference);
      if (!current.exists()) throw new Error("This teacher no longer exists.");
      assertVersion(current.data().version, version);
    }
    const metadata = {
      updatedBy: actor,
      updatedAt: serverTimestamp(),
      version: id ? version + 1 : 0,
    };
    if (id) transaction.update(reference, { ...values, ...metadata });
    else
      transaction.set(reference, {
        ...values,
        ...metadata,
        createdBy: actor,
        createdAt: serverTimestamp(),
      });
  }).catch((error) => explainVersionConflict(reference, version, error));
  return reference.id;
}
export async function saveLearningPath(
  store: Firestore,
  fields: LearningPathFields,
  actor: string,
  id?: string,
  version = 0,
) {
  const values = pathFields(fields),
    reference = id
      ? doc(store, "learning_paths", id)
      : doc(collection(store, "learning_paths"));
  // Preflight references separately: including every source in one transaction exceeds
  // Firestore rules evaluation budgets. Readers also recheck availability after archival.
  if (values.status === "published") {
    const content = await Promise.all(
      lessonsFromIds(values.lessonIds).map((lesson) =>
        getDocFromServer(
          doc(store, lessonCollection(lesson.kind), lesson.contentId),
        ),
      ),
    );
    if (
      content.some(
        (item, index) =>
          !item.exists() ||
          (lessonsFromIds(values.lessonIds)[index].kind !== "audio"
            ? item.data()!.status !== "published"
            : !isPublishedAudio(item.data()!)),
      )
    )
      throw new Error(
        "Every lesson must be published and available before publishing the path.",
      );
    if (values.teacherId) {
      const teacher = await getDocFromServer(
        doc(store, "teachers", values.teacherId),
      );
      if (!teacher.exists() || teacher.data().status !== "published")
        throw new Error("Publish the selected teacher profile first.");
    }
  }
  await runTransaction(store, async (transaction) => {
    if (id) {
      const current = await transaction.get(reference);
      if (!current.exists()) throw new Error("This path no longer exists.");
      assertVersion(current.data().version, version);
    }
    const metadata = {
      updatedBy: actor,
      updatedAt: serverTimestamp(),
      version: id ? version + 1 : 0,
    };
    if (id) transaction.update(reference, { ...values, ...metadata });
    else
      transaction.set(reference, {
        ...values,
        ...metadata,
        createdBy: actor,
        createdAt: serverTimestamp(),
      });
  }).catch((error) => explainVersionConflict(reference, version, error));
  return reference.id;
}
export async function setLearningCompletion(
  store: Firestore,
  userId: string,
  pathId: string,
  lessonId: string,
  complete: boolean,
) {
  const reference = doc(store, "users", userId, "learning_progress", pathId);
  await runTransaction(store, async (transaction) => {
    const [path, progress] = await Promise.all([
      transaction.get(doc(store, "learning_paths", pathId)),
      transaction.get(reference),
    ]);
    if (
      !path.exists() ||
      path.data().status !== "published" ||
      !path.data().lessonIds.includes(lessonId)
    )
      throw new Error("This lesson is no longer available in the path.");
    const allowed = new Set<string>(path.data().lessonIds);
    const completed = new Set<string>(
      (progress.data()?.completedIds || []).filter((id: string) =>
        allowed.has(id),
      ),
    );
    if (complete) completed.add(lessonId);
    else completed.delete(lessonId);
    transaction.set(reference, {
      completedIds: [...completed],
      updatedAt: serverTimestamp(),
    });
  });
}
