# Teachers and learning paths

## Scope

The admin foundation/editorial release (PR #7, production commit `d4529a9`) is live. This subsequent learning stage adds `/admin/learning`, `/learn`, `/learn/[id]` and `/teachers/[id]`. It keeps the existing color palette, rounded grouped surfaces, large touch targets and Sinhala/English reader experience. Learning is reached from Dhamma and keeps that navigation tab active.

Administrators with explicit `content` permissions can create, edit, publish and archive teacher biographies and learning paths. Profiles hold display names and verified biographies; they do not expose user-account contact records. Paths organize existing published articles and active public recordings into up to **12 ordered lessons**, with a topic, level, teaching language and optional published teacher. Paths and profiles retain their document identity when archived. Edits reject stale versions and retain the form on failure. Unsaved forms warn before closing or unloading.

Learners can browse paths and teacher profiles, read or listen through the existing reader/player, and explicitly mark lessons complete or incomplete. Progress is a private personal checklist, separate from meditation sessions and the existing My Path practice stages. It does not claim verified listening, assessment results or spiritual attainment. Continue skips unavailable lessons. Withdrawn content stays represented as unavailable without exposing its draft content.

## Firestore data

- `teachers/{id}`: primary and English name/bio, publication status, version, created/updated timestamps and actor IDs.
- `learning_paths/{id}`: primary and English title/introduction, optional teacher ID, topic/level/language, status and editorial metadata, plus one ordered `lessonIds` list. IDs are `article_<documentId>` or `audio_<documentId>`; lesson objects are derived rather than stored redundantly. Reordering preserves completion. Replacing a teaching changes its identity; removed completion IDs are excluded from totals and pruned on the next checklist update.
- `users/{uid}/learning_progress/{pathId}`: unique `completedIds` and a server update timestamp. Transactions preserve concurrent completion changes. Only the owner can read/write/delete this checklist; admin permissions do not expose it. Owner export/deletion remains possible if the path is archived. Settings JSON export includes the checklist, and account deletion removes it before the user profile and Auth account.

Prototype rules validate new collection schemas on both creation and update, preserve creation metadata, require current actor/time/version, restrict writes by resource/action permission, and restrict progress to the current published path's valid lesson IDs. Signed-in learners can query published profiles/paths; admin readers can query drafts and archives. Hard deletion of profiles/paths is denied. Existing collection policies are unchanged.

Publication preflight reads source availability and the chosen teacher before saving. These reads are outside the version transaction to stay within rules evaluation budgets; they are not a server-enforced referential-integrity guarantee. Sources can be withdrawn concurrently or later. Learner hydration independently checks availability. Full size validation and publication tests exercise 12-lesson paths with content permission in the sixth supported permission slot.

Libraries fetch 20 documents per page in document-ID order; source pickers fetch 30. Search, topic and level filters apply to loaded items and are labeled accordingly. There are no new composite indexes, bulk migrations, Functions or native-wrapper changes.

## Verification

- `npm test`: application behavior, input validation, stable lesson identity, completion counts and bilingual fallback.
- `npm run test:rules`: existing admin/editorial coverage plus learning visibility, schema and size boundaries, forged metadata, private progress, stale/concurrent edits, concurrent completion, reorder/replacement and archival cleanup. Tests use local Firestore only (`127.0.0.1:8185`) with separate `demo-*` project IDs.
- `npm run i18n:check`, TypeScript, targeted ESLint, production build, and Firebase rules compilation dry run.
- Browser verification uses disposable `demo-learning-ui` fixtures. Covered teacher creation/publication, path creation/publication and ordering, the reader return link, player activation, profile navigation, progress persistence, unavailable content, data export and 390px light/dark layouts in Sinhala/English. No real teaching or teacher biography was published for these tests. Account deletion was not performed through the browser.

For isolated local UI testing, start Firebase Auth/Firestore emulators with `firebase emulators:start --only firestore,auth --project demo-learning-ui`. Run the development server with `NEXT_PUBLIC_FIREBASE_EMULATORS=true`. This explicit development-only flag uses the demo project and connects all Firebase services to local emulator addresses; production builds ignore it. Normal development without the flag continues using the configured project. Use synthetic local accounts only.

Validated on 2026-09-24: 34 application tests, 19 Firestore emulator tests, 774 matching translation keys per language, TypeScript and targeted ESLint passed. Production build and Firebase rules compilation dry run passed. The build retains pre-existing repository warnings.

## Rollout and limitations

The learning extension is prepared on `codex/learning-paths`; its additional Firestore rules have passed a compilation dry run but **have not been deployed**. This is separate from the already-live admin foundation rules. Merge/release the learning code and deploy its additive rules in the same release window (rules may be deployed first). A Vercel preview alone does not install Firebase rules, and production-backed learning queries/JSON export will be denied until those rules are deployed. After release, create verified teacher biographies and editorially reviewed paths through the admin UI. Nothing is prepublished automatically.

The current stage does not include teacher portraits, quizzes/certificates, automatic lesson completion, cross-path recommendations, review/scheduling, immutable path revision history or indexed full-text search. Paths are deliberately limited to 12 lessons to keep strict validation within Firestore's evaluation budget; longer curricula can be divided into focused paths. Existing public audio metadata/Storage URL behavior is unchanged. Real iOS/Android WebView device checks remain part of release acceptance; desktop phone-width emulation does not replace them.
