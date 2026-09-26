const { test, before, after } = require("node:test");
const fs = require("node:fs");
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp,
} = require("firebase/firestore");
let env;
const db = (uid) => env.authenticatedContext(uid).firestore();
const fields = {
  title: "Slides",
  titleEn: "",
  description: "Introduction",
  descriptionEn: "",
  objectives: "",
  objectivesEn: "",
  teacherId: "",
  language: "si",
  minutes: 10,
  allowDownload: true,
  status: "published",
  storagePath: "presentations/slides/file.pdf",
  fileName: "file.pdf",
  fileSize: 100,
  pageCount: 4,
};
const meta = () => ({
  version: 0,
  createdBy: "editor",
  updatedBy: "editor",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-presentations",
    firestore: {
      host: "127.0.0.1",
      port: 8185,
      rules: fs.readFileSync("firestore.rules", "utf8"),
    },
  });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (c) => {
    await Promise.all([
      setDoc(doc(c.firestore(), "admin_users", "editor"), {
        role: "content_admin",
        isActive: true,
        permissions: [
          { resource: "content", actions: ["read", "create", "update"] },
        ],
      }),
      setDoc(doc(c.firestore(), "admin_users", "reader"), {
        role: "moderator",
        isActive: true,
        permissions: [{ resource: "content", actions: ["read"] }],
      }),
      setDoc(doc(c.firestore(), "learning_presentations", "slides"), {
        ...fields,
        ...meta(),
      }),
      setDoc(doc(c.firestore(), "learning_presentations", "draft"), {
        ...fields,
        ...meta(),
        status: "draft",
        storagePath: "presentations/draft/file.pdf",
      }),
      setDoc(doc(c.firestore(), "learning_paths", "path"), {
        status: "published",
        lessonIds: ["pdf_slides"],
      }),
      setDoc(doc(c.firestore(), "learning_paths", "other"), {
        status: "published",
        lessonIds: ["article_a"],
      }),
    ]);
  });
});
after(async () => env?.cleanup());
test("only content editors can write validated presentation metadata", async () => {
  const ref = doc(db("editor"), "learning_presentations", "new");
  const data = {
    ...fields,
    ...meta(),
    storagePath: "presentations/new/file.pdf",
  };
  await assertSucceeds(setDoc(ref, data));
  for (const uid of ["member", "reader"])
    await assertFails(
      setDoc(doc(db(uid), "learning_presentations", "new"), data),
    );
  for (const bad of [
    { storagePath: "presentations/slides/file.pdf" },
    { pageCount: 0 },
    { fileSize: 26214401 },
    { minutes: 1.5 },
    { status: "private" },
    { createdBy: "forged" },
    { extra: true },
    { title: "" },
    { pageCount: 2001 },
    { allowDownload: "true" },
  ])
    await assertFails(
      updateDoc(ref, { version: 1, updatedAt: serverTimestamp(), ...bad }),
    );
});
test("published queries and private drafts follow publication visibility", async () => {
  await assertSucceeds(
    getDocs(
      query(
        collection(db("member"), "learning_presentations"),
        where("status", "==", "published"),
        orderBy("__name__"),
        limit(30),
      ),
    ),
  );
  await assertFails(
    getDocs(collection(db("member"), "learning_presentations")),
  );
  await assertFails(
    getDoc(doc(db("member"), "learning_presentations", "draft")),
  );
  await assertSucceeds(
    getDoc(doc(db("reader"), "learning_presentations", "draft")),
  );
  await assertFails(
    getDoc(
      doc(
        env.unauthenticatedContext().firestore(),
        "learning_presentations",
        "slides",
      ),
    ),
  );
});
test("reading positions are private, bounded, and tied to the current file and path", async () => {
  const ref = doc(
    db("member"),
    "users",
    "member",
    "learning_reading",
    "slides",
  );
  const position = {
    page: 3,
    storagePath: fields.storagePath,
    pathId: "path",
    updatedAt: serverTimestamp(),
  };
  await assertSucceeds(setDoc(ref, position));
  for (const bad of [
    { page: 0 },
    { page: 5 },
    { page: 2.5 },
    { pathId: "other" },
    { storagePath: "presentations/slides/old.pdf" },
    { extra: true },
  ])
    await assertFails(setDoc(ref, { ...position, ...bad }));
  for (const uid of ["other", "editor"]) {
    await assertFails(
      getDoc(doc(db(uid), "users", "member", "learning_reading", "slides")),
    );
    await assertFails(
      setDoc(
        doc(db(uid), "users", "member", "learning_reading", "slides"),
        position,
      ),
    );
  }
  await assertSucceeds(
    getDocs(
      query(
        collection(db("member"), "users", "member", "learning_reading"),
        orderBy("updatedAt", "desc"),
        limit(12),
      ),
    ),
  );
});
