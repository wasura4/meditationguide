const { test, before, after } = require("node:test");
const fs = require("node:fs");
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const { doc, setDoc, updateDoc } = require("firebase/firestore");
const {
  ref,
  uploadBytes,
  getMetadata,
  deleteObject,
} = require("firebase/storage");
let env;
const file = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 55]);
const store = (uid) =>
  env.authenticatedContext(uid).storage("gs://demo-learning-ui.appspot.com");
before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-learning-ui",
    firestore: { host: "127.0.0.1", port: 8185 },
    storage: {
      host: "127.0.0.1",
      port: 9199,
      rules: fs.readFileSync("storage.rules", "utf8"),
    },
  });
  await env.withSecurityRulesDisabled(async (c) => {
    for (const name of ["current.pdf", "old.pdf"])
      await deleteObject(
        ref(
          c.storage("gs://demo-learning-ui.appspot.com"),
          `presentations/storage-test/${name}`,
        ),
      ).catch((error) => {
        if (error.code !== "storage/object-not-found") throw error;
      });
    await setDoc(doc(c.firestore(), "admin_users", "storage-editor"), {
      isActive: true,
      role: "content_admin",
      permissions: [
        { resource: "content", actions: ["read", "create", "update"] },
      ],
    });
    await setDoc(doc(c.firestore(), "admin_users", "storage-inactive"), {
      isActive: false,
      role: "super_admin",
    });
    await setDoc(doc(c.firestore(), "learning_presentations", "storage-test"), {
      status: "draft",
      storagePath: "presentations/storage-test/current.pdf",
    });
  });
});
after(async () => env?.cleanup());
test("PDF Storage enforces editor writes, limits, immutable files and publication-aware reads", async () => {
  const current = "presentations/storage-test/current.pdf",
    old = "presentations/storage-test/old.pdf";
  await assertSucceeds(
    uploadBytes(ref(store("storage-editor"), current), file, {
      contentType: "application/pdf",
    }),
  );
  await assertSucceeds(
    uploadBytes(ref(store("storage-editor"), old), file, {
      contentType: "application/pdf",
    }),
  );
  await assertFails(
    uploadBytes(ref(store("storage-editor"), current), file, {
      contentType: "application/pdf",
    }),
  );
  await assertFails(
    uploadBytes(
      ref(store("storage-editor"), "presentations/storage-test/wrong.pdf"),
      file,
      { contentType: "text/html" },
    ),
  );
  await assertFails(
    uploadBytes(
      ref(store("storage-editor"), "presentations/storage-test/large.pdf"),
      new Uint8Array(26214401),
      { contentType: "application/pdf" },
    ),
  );
  for (const uid of ["storage-member", "storage-inactive"]) {
    await assertFails(
      uploadBytes(
        ref(store(uid), "presentations/storage-test/denied.pdf"),
        file,
        { contentType: "application/pdf" },
      ),
    );
    await assertFails(getMetadata(ref(store(uid), current)));
  }
  await assertSucceeds(getMetadata(ref(store("storage-editor"), current)));
  await assertFails(deleteObject(ref(store("storage-editor"), current)));
  await env.withSecurityRulesDisabled((c) =>
    updateDoc(doc(c.firestore(), "learning_presentations", "storage-test"), {
      status: "published",
    }),
  );
  await assertSucceeds(getMetadata(ref(store("storage-member"), current)));
  await assertFails(getMetadata(ref(store("storage-member"), old)));
  await assertFails(
    getMetadata(
      ref(
        env
          .unauthenticatedContext()
          .storage("gs://demo-learning-ui.appspot.com"),
        current,
      ),
    ),
  );
  await assertFails(
    uploadBytes(
      ref(store("storage-editor"), "presentations/storage-test/new.pdf"),
      file,
      { contentType: "application/pdf" },
    ),
  );
  await env.withSecurityRulesDisabled((c) =>
    updateDoc(doc(c.firestore(), "learning_presentations", "storage-test"), {
      status: "archived",
    }),
  );
  await assertFails(getMetadata(ref(store("storage-member"), current)));
  await assertSucceeds(deleteObject(ref(store("storage-editor"), old)));
});
