# PDF lessons in Learning Studio

## Author workflow

1. Open **Admin → Learning → Presentations → Upload presentation**.
2. Enter a title, introduction, optional learning objectives and teacher, language, estimated study time, and download preference.
3. Choose an unencrypted PDF (up to 25 MB / 2,000 pages). The upload validates the PDF header and parses it with PDF.js, creates a private draft, reports transfer progress, and saves the file reference when the transfer succeeds. Uploads can be cancelled. Successfully uploaded drafts remain in the library even if the editor is closed.
4. Preview the actual lesson and publish it. A published presentation needs an introduction and a file; a selected teacher must be published.
5. Edit a learning path, choose **Presentations**, and add the published PDF alongside articles and recordings. Existing paths keep their ordered lesson IDs and completion records. The existing 12-lesson limit remains.

Replacing a published PDF requires returning the presentation to draft first. Each upload uses a new immutable file path. The presentation ID remains stable, so existing lesson completion remains; a saved page from an older file resets to page 1. To treat a substantially different teaching as a new lesson to complete, create a new presentation. Previous files are retained, inaccessible to learners, for recovery; failed uploads that reached Storage but failed metadata saving are cleaned up where possible. Files must never be overwritten in place.

## Learner workflow

**View presentation** opens a dedicated lesson route with introduction, objectives, optional teacher link, and a lazy-loaded PDF.js reader. The reader offers page selection, previous/next, zoom, fit width, fullscreen where supported, optional PDF download, and a selectable page-text alternative. Scans may have no extractable text; this release does not perform OCR.

Reading position syncs to the signed-in account after a page renders. Completion is explicit and independent of pages viewed. Next lesson returns to the next PDF or the existing article/audio path entry. **Continue learning** lists up to three recent unfinished paths using recent reading/completion records. Finished paths are omitted. Sinhala and English reader labels are bundled.

Reading positions are included in JSON account export and removed by account deletion.

## Storage and deployment

- Metadata: `learning_presentations/{id}`. Uses version-checked edits and immutable creation metadata.
- Files: `presentations/{id}/{uuid}.pdf`. Admin uploads only; authenticated learners can read only the current file of published presentations. No bearer download URL is persisted or used by the app.
- Reading: `users/{uid}/learning_reading/{presentationId}` with `page`, `storagePath`, `pathId`, and `updatedAt`. Rules validate page bounds, current file, published path, membership, and ownership.
- Files load using the authenticated Storage SDK. The download setting controls UI, not DRM: someone allowed to view a PDF can retain its contents.
- PDF.js worker, character maps, standard fonts, and WASM files are copied from the installed package by `predev` / `prebuild` to ignored `public/pdfjs`. No third-party viewer or runtime CDN is used.

Before live rollout:

1. Compare `storage.rules` with the deployed Storage rules, preserving any existing namespaces absent from the repository. The repository previously contained only manually copied rules examples, not a deployment-managed Storage rules file. The production rollout preserved the existing audio, article image, kamatahan audio, and nested playlist-cover rules unchanged. PDF permissions use the current content-admin permission model.
2. Deploy the reviewed Firestore and Storage rules together. Storage's cross-service Firestore lookups require the Firebase Rules service to have the necessary access; the Firebase CLI/console may request enabling it on first deployment.
3. Configure the bucket's CORS policy to permit GET from the actual application origins. `storage.cors.json` records production origins; `storage.cors.example.json` also includes local development origins. Add any additional production/preview origins before applying it, and merge rather than erase existing required CORS entries. Authenticated SDK byte downloads require this even when existing token-based image/audio URLs work.
4. Build/deploy the application normally. There is no migration for existing article/audio paths, and no new composite index is needed.
5. Smoke-test a real Sinhala presentation on a phone, including font rendering, scanned pages, and download behavior.

Production backend rollout on 2026-09-26: Firestore and Storage rules were deployed to `nirvanaya-web`, and the bucket CORS settings were updated for `meditationguide.vercel.app`, `meditationguide.com`, and `www.meditationguide.com`. Existing production rules and bucket metadata were backed up locally in ignored `tmp/production-before` before changes. The app deploys through the existing Vercel integration when `main` is pushed.

## Verification

- `npm test`: shared validation, identity-preserving lesson parsing, page bounds and existing app behavior.
- `npm run i18n:check`, `npx tsc --noEmit`, and `npm run build`.
- Start local Auth/Firestore/Storage emulators with project `demo-learning-ui`, then run `node --test --test-concurrency=1 tests/firestore/learning.rules.test.cjs tests/firestore/presentations.rules.test.cjs tests/firestore/presentation-storage.rules.test.cjs`.
- The Storage test intentionally uses the emulator suite's project ID for cross-service rule evaluation and creates only `storage-test` fixture documents/files. Use disposable local emulators.
- For local UI testing set `NEXT_PUBLIC_FIREBASE_EMULATORS=true` during development. Production builds ignore that flag. Test accounts and files must remain in the emulator.

## Scope

This implements the proposed first release: PDF library/upload, reader, saved position, learning-path integration, and Continue Learning, plus objectives, full PDF preview and privacy integration. Modules, personal notes/bookmarks, quizzes/reflections, audio-synchronized slides, and full-library search remain separate later enhancements.

## Local verification results — 2026-09-26

- Production build and TypeScript passed. Build reports existing warnings in unrelated files.
- 72 unit tests passed; 9 relevant Firestore tests and 1 Storage rule test passed.
- Translation validation passed (1,010 keys in each language); targeted ESLint passed.
- Chrome/emulator walkthrough: uploaded a generated three-page PDF, rendered its admin preview, published it, added it to a published path, opened the learner reader, navigated to page 2, reloaded and retained page 2, confirmed Continue Learning offered page 2, and explicitly completed the lesson.
- The 390 × 844 mobile viewport had no horizontal page overflow. Reader controls and extracted page text rendered; no browser runtime errors were reported during the walkthrough. Actual user-supplied Sinhala PDFs still need font/content-specific verification.
- The optional `lint:colors` command is blocked by the existing undeclared `glob` dependency in `scripts/color-guard.js`; new UI uses existing theme tokens.
