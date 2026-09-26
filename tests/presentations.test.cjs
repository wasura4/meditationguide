const { test } = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript"),
  fs = require("node:fs");
require.extensions[".ts"] = (m, f) =>
  m._compile(
    ts.transpileModule(fs.readFileSync(f, "utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
      },
    }).outputText,
    f,
  );
const {
  blankPresentation,
  presentationFields,
  readingPage,
  MAX_PDF_BYTES,
} = require("../src/lib/presentations.ts");
const {
  pathFields,
  lessonsFromIds,
  lessonCollection,
  blankLearningPath,
  learningProgress,
} = require("../src/lib/learning.ts");
const fields = {
  ...blankPresentation,
  title: " Slides ",
  description: "Introduction",
  status: "published",
  storagePath: "presentations/demo/file-1.pdf",
  fileName: "Lesson.pdf",
  fileSize: 1000,
  pageCount: 8,
};
test("presentations require publishable files and bounded metadata", () => {
  assert.equal(presentationFields(fields, "demo").title, "Slides");
  assert.equal(
    presentationFields({ ...blankPresentation, title: "Draft" }, "demo")
      .storagePath,
    "",
  );
  for (const bad of [
    { title: "" },
    { description: "" },
    { storagePath: "" },
    { storagePath: "presentations/other/file.pdf" },
    { storagePath: "https://example.org/a.pdf" },
    { fileSize: MAX_PDF_BYTES + 1 },
    { pageCount: 0 },
    { pageCount: 2001 },
    { pageCount: 1.5 },
    { minutes: 0 },
    { minutes: NaN },
    { language: "xx" },
    { allowDownload: "true" },
    { teacherId: "../private" },
  ])
    assert.throws(() => presentationFields({ ...fields, ...bad }, "demo"));
  assert.equal(
    presentationFields({ ...fields, owner: "forged" }, "demo").owner,
    undefined,
  );
});
test("PDF lessons coexist with existing lessons and preserve completion through reordering", () => {
  const ids = ["article_a", "pdf_demo", "audio_b"];
  const lessons = lessonsFromIds(ids);
  assert.deepEqual(
    lessons.map((l) => l.kind),
    ["article", "pdf", "audio"],
  );
  assert.equal(lessonCollection("pdf"), "learning_presentations");
  assert.deepEqual(
    pathFields({ ...blankLearningPath, title: "Path", lessons }).lessonIds,
    ids,
  );
  assert.equal(learningProgress(lessons.toReversed(), ["pdf_demo"]).count, 1);
});
test("resume positions clamp to the current PDF and never infer completion", () => {
  assert.equal(readingPage(20, 8), 8);
  assert.equal(readingPage(-1, 8), 1);
  assert.equal(readingPage("5", 8), 1);
  assert.equal(readingPage(5, 8), 5);
  assert.equal(readingPage(NaN, 8), 1);
});
