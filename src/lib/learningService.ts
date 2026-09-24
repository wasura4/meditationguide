import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  documentId,
  limit,
  startAfter,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { lessonsFromIds } from "./learning";
import { db } from "./firebase";
import {
  saveTeacher,
  saveLearningPath,
  setLearningCompletion,
} from "./learningTransactions";
import type {
  Teacher,
  TeacherFields,
  LearningPath,
  LearningPathFields,
  Lesson,
} from "./learning";
import { isPublishedAudio } from "./editorial";
import type { KamatahanAudio } from "@/types/admin";
export type LessonContent = {
  id: string;
  kind: Lesson["kind"];
  title: string;
  language: string;
  audio?: KamatahanAudio;
};
export class LearningService {
  static async page<T extends Teacher | LearningPath>(
    name: "teachers" | "learning_paths",
    visibility: string = "published",
    cursor?: QueryDocumentSnapshot,
  ) {
    const result = await getDocs(
      query(
        collection(db, name),
        ...(visibility === "all" ? [] : [where("status", "==", visibility)]),
        orderBy(documentId()),
        ...(cursor ? [startAfter(cursor)] : []),
        limit(20),
      ),
    );
    return {
      items: result.docs.map(
        (item) =>
          ({
            ...item.data(),
            id: item.id,
            ...(name === "learning_paths"
              ? { lessons: lessonsFromIds(item.data().lessonIds) }
              : {}),
          }) as T,
      ),
      cursor: result.docs.at(-1),
      more: result.size === 20,
    };
  }
  static async teacher(id: string): Promise<Teacher | null> {
    return this.published("teachers", id);
  }
  static async path(id: string): Promise<LearningPath | null> {
    return this.published("learning_paths", id);
  }
  private static async published<T>(
    name: string,
    id: string,
  ): Promise<T | null> {
    try {
      const result = await getDoc(doc(db, name, id));
      return result.exists() && result.data().status === "published"
        ? ({
            ...result.data(),
            id: result.id,
            ...(name === "learning_paths"
              ? { lessons: lessonsFromIds(result.data().lessonIds) }
              : {}),
          } as T)
        : null;
    } catch (error) {
      if ((error as { code?: string }).code === "permission-denied")
        return null;
      throw error;
    }
  }
  static saveTeacher(
    fields: TeacherFields,
    actor: string,
    id?: string,
    version = 0,
  ) {
    return saveTeacher(db, fields, actor, id, version);
  }
  static savePath(
    fields: LearningPathFields,
    actor: string,
    id?: string,
    version = 0,
  ) {
    return saveLearningPath(db, fields, actor, id, version);
  }
  static async lesson(lesson: Lesson): Promise<LessonContent | null> {
    try {
      const result = await getDoc(
        doc(
          db,
          lesson.kind === "article" ? "dhamma_posts" : "kamatahan_audio",
          lesson.contentId,
        ),
      );
      if (!result.exists()) return null;
      const data = result.data();
      if (
        lesson.kind === "article"
          ? data.status !== "published"
          : !isPublishedAudio(data)
      )
        return null;
      return {
        id: result.id,
        kind: lesson.kind,
        title: data.title,
        language: data.language,
        audio:
          lesson.kind === "audio"
            ? ({ ...data, id: result.id } as KamatahanAudio)
            : undefined,
      };
    } catch (error) {
      if ((error as { code?: string }).code === "permission-denied")
        return null;
      throw error;
    }
  }
  static async contentPage(
    kind: Lesson["kind"],
    cursor?: QueryDocumentSnapshot,
  ) {
    const result = await getDocs(
      query(
        collection(db, kind === "article" ? "dhamma_posts" : "kamatahan_audio"),
        where("status", "==", kind === "article" ? "published" : "active"),
        orderBy(documentId()),
        ...(cursor ? [startAfter(cursor)] : []),
        limit(30),
      ),
    );
    return {
      items: result.docs
        .filter((item) => kind === "article" || isPublishedAudio(item.data()))
        .map((item) => ({
          id: item.id,
          kind,
          title: String(item.data().title || ""),
          language: String(item.data().language || ""),
        })),
      cursor: result.docs.at(-1),
      more: result.size === 30,
    };
  }
  static async progress(userId: string, pathId: string): Promise<string[]> {
    const result = await getDoc(
      doc(db, "users", userId, "learning_progress", pathId),
    );
    return result.data()?.completedIds || [];
  }
  static complete(
    userId: string,
    pathId: string,
    lessonId: string,
    complete: boolean,
  ) {
    return setLearningCompletion(db, userId, pathId, lessonId, complete);
  }
}
