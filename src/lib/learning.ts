export const LEARNING_TOPICS = [
  "meditation",
  "dhamma",
  "daily_practice",
  "sutta",
  "ethics",
] as const;
export const LEARNING_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
] as const;
export type EditorialStatus = "draft" | "published" | "archived";
export type Lesson = {
  id: string;
  kind: "article" | "audio";
  contentId: string;
};
export interface TeacherFields {
  name: string;
  nameEn: string;
  bio: string;
  bioEn: string;
  status: EditorialStatus;
}
export interface LearningPathFields {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  teacherId: string;
  topic: (typeof LEARNING_TOPICS)[number];
  level: (typeof LEARNING_LEVELS)[number];
  language: "si" | "en" | "mixed";
  status: EditorialStatus;
  lessons: Lesson[];
}
export type Teacher = TeacherFields & { id: string; version: number };
export type LearningPath = LearningPathFields & {
  id: string;
  version: number;
  lessonIds: string[];
};
export const blankTeacher: TeacherFields = {
  name: "",
  nameEn: "",
  bio: "",
  bioEn: "",
  status: "draft",
};
export const blankLearningPath: LearningPathFields = {
  title: "",
  titleEn: "",
  description: "",
  descriptionEn: "",
  teacherId: "",
  topic: "meditation",
  level: "beginner",
  language: "si",
  status: "draft",
  lessons: [],
};

function text(value: unknown, maximum: number, required = false): string {
  if (
    typeof value !== "string" ||
    value.trim().length > maximum ||
    (required && !value.trim())
  )
    throw new Error(
      `Enter ${required ? "a non-empty value" : "text"} of at most ${maximum} characters.`,
    );
  return value.trim();
}
function status(value: unknown): EditorialStatus {
  if (value !== "draft" && value !== "published" && value !== "archived")
    throw new Error("Choose a valid publication status.");
  return value;
}
export function teacherFields(data: TeacherFields): TeacherFields {
  const visibility = status(data.status);
  return {
    name: text(data.name, 160, true),
    nameEn: text(data.nameEn, 160),
    bio: text(data.bio, 5000, visibility === "published"),
    bioEn: text(data.bioEn, 5000),
    status: visibility,
  };
}
export function pathFields(
  data: LearningPathFields,
): Omit<LearningPathFields, "lessons"> & { lessonIds: string[] } {
  const visibility = status(data.status);
  if (
    !LEARNING_TOPICS.includes(data.topic) ||
    !LEARNING_LEVELS.includes(data.level) ||
    !["si", "en", "mixed"].includes(data.language)
  )
    throw new Error("Choose a topic, level and teaching language.");
  if (
    !Array.isArray(data.lessons) ||
    data.lessons.length > 12 ||
    (visibility === "published" && !data.lessons.length)
  )
    throw new Error("A published path needs 1–12 lessons.");
  const lessons = data.lessons.map((lesson) => {
    if (
      !lesson ||
      !["audio", "article"].includes(lesson.kind) ||
      typeof lesson.contentId !== "string" ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(lesson.contentId) ||
      lesson.id !== `${lesson.kind}_${lesson.contentId}`
    )
      throw new Error("Choose a valid article or recording for each lesson.");
    return { id: lesson.id, kind: lesson.kind, contentId: lesson.contentId };
  });
  const lessonIds = lessons.map((lesson) => lesson.id);
  if (new Set(lessonIds).size !== lessonIds.length)
    throw new Error("Each teaching can appear only once in a path.");
  if (
    typeof data.teacherId !== "string" ||
    (data.teacherId && !/^[A-Za-z0-9_-]{1,128}$/.test(data.teacherId))
  )
    throw new Error("Choose a valid teacher.");
  return {
    title: text(data.title, 180, true),
    titleEn: text(data.titleEn, 180),
    description: text(data.description, 3000, visibility === "published"),
    descriptionEn: text(data.descriptionEn, 3000),
    teacherId: data.teacherId,
    topic: data.topic,
    level: data.level,
    language: data.language,
    status: visibility,
    lessonIds,
  };
}
export function learningText(
  primary: string,
  english: string,
  language: string,
) {
  return language === "en" && english.trim() ? english : primary;
}
/** Completion describes the learner's checklist, never spiritual attainment or verified listening. */
export function learningProgress(lessons: Lesson[], completedIds: string[]) {
  const completed = new Set(completedIds),
    count = lessons.filter((lesson) => completed.has(lesson.id)).length;
  return {
    count,
    total: lessons.length,
    percent: lessons.length ? Math.round((count / lessons.length) * 100) : 0,
    next: lessons.find((lesson) => !completed.has(lesson.id))?.id ?? null,
  };
}

/** A single ordered ID list is stored; kind and content ID are derived, never duplicated. */
export function lessonsFromIds(ids: string[]): Lesson[] {
  return ids.map((id) => {
    const kind = id.startsWith("article_") ? "article" : "audio";
    return { id, kind, contentId: id.slice(kind.length + 1) };
  });
}
