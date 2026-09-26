import type { EditorialStatus } from "./learning";

export const MAX_PDF_BYTES = 25 * 1024 * 1024;
export type PresentationFields = {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  objectives: string;
  objectivesEn: string;
  teacherId: string;
  language: "si" | "en" | "mixed";
  minutes: number;
  allowDownload: boolean;
  status: EditorialStatus;
  storagePath: string;
  fileName: string;
  fileSize: number;
  pageCount: number;
};
export type Presentation = PresentationFields & { id: string; version: number };
export const blankPresentation: PresentationFields = {
  title: "",
  titleEn: "",
  description: "",
  descriptionEn: "",
  objectives: "",
  objectivesEn: "",
  teacherId: "",
  language: "si",
  minutes: 10,
  allowDownload: true,
  status: "draft",
  storagePath: "",
  fileName: "",
  fileSize: 0,
  pageCount: 0,
};
export function presentationFields(
  input: PresentationFields,
  id: string,
): PresentationFields {
  const result = { ...blankPresentation };
  for (const [key, max] of Object.entries({
    title: 180,
    titleEn: 180,
    description: 3000,
    descriptionEn: 3000,
    objectives: 3000,
    objectivesEn: 3000,
    teacherId: 128,
    fileName: 255,
  })) {
    const value = input[key as keyof PresentationFields];
    if (typeof value !== "string" || value.trim().length > max)
      throw new Error(`Enter valid ${key} (maximum ${max} characters).`);
    Object.assign(result, { [key]: value.trim() });
  }
  if (
    !result.title ||
    !["draft", "published", "archived"].includes(input.status) ||
    !["si", "en", "mixed"].includes(input.language)
  )
    throw new Error("Enter a title, language and publication status.");
  if (result.teacherId && !/^[A-Za-z0-9_-]{1,128}$/.test(result.teacherId))
    throw new Error("Choose a valid teacher.");
  if (
    !Number.isInteger(input.minutes) ||
    input.minutes < 1 ||
    input.minutes > 600 ||
    typeof input.allowDownload !== "boolean"
  )
    throw new Error("Study time must be between 1 and 600 minutes.");
  const hasFile =
    typeof input.storagePath === "string" &&
    new RegExp(`^presentations/${id}/[A-Za-z0-9_-]+\\.pdf$`).test(
      input.storagePath,
    );
  if (input.storagePath && !hasFile)
    throw new Error("Invalid presentation file path.");
  if (
    !Number.isInteger(input.pageCount) ||
    !Number.isInteger(input.fileSize) ||
    (hasFile
      ? input.pageCount < 1 ||
        input.pageCount > 2000 ||
        input.fileSize < 1 ||
        input.fileSize > MAX_PDF_BYTES ||
        !result.fileName
      : input.pageCount !== 0 || input.fileSize !== 0 || result.fileName !== "")
  )
    throw new Error("Choose a valid PDF up to 25 MB and 2,000 pages.");
  if (input.status === "published" && (!hasFile || !result.description))
    throw new Error("Add a PDF and an introduction before publishing.");
  return {
    ...result,
    status: input.status,
    language: input.language,
    minutes: input.minutes,
    allowDownload: input.allowDownload,
    storagePath: input.storagePath,
    fileSize: input.fileSize,
    pageCount: input.pageCount,
  };
}

export function readingPage(page: unknown, pageCount: number) {
  return typeof page === "number" && Number.isInteger(page)
    ? Math.max(1, Math.min(pageCount, page))
    : 1;
}
