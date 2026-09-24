# Admin foundation

This branch contains the admin foundation and daily editorial workspace. The previous user-facing release is commit `d912782` on `main`; Vercel reports its Production deployment succeeded, and `https://meditationguide.vercel.app/` returns the app successfully.

## Changes

- Admin access starts with a server-confirmed, active admin profile. Cached browser roles cannot grant access. All routes and navigation use the same explicit resource permissions; legacy `admin` records with explicit permissions remain supported.
- Proposed Firestore rules prohibit self-enrollment and role edits, enforce resource/action permissions, restrict event management, keep drafts private, and prevent ownership changes. Only a server timestamp for the administrator's own last login can be updated by that administrator. Role provisioning uses a trusted Admin SDK environment.
- Settings contains working theme/translation navigation and Firebase operations links. Browser-only maintenance, backup, session-timeout and similar switches were removed. Account suspension is unavailable in the UI until an authenticated backend can enforce it through Firebase Authentication.
- Practice totals, participation, rankings, and new registrations respect the selected period. Completed practice excludes invalid/nonpositive durations. “All time” includes older history; missing baselines show no comparison. Content inventory remains lifetime; reads and audio listens use recorded events in the selected period. These are event counts, not unique people or verified listening completion.
- Article previews use the reader sanitizer, including supported YouTube embeds. Video-only articles can be published, library summaries no longer show HTML, and edits preserve the first publication timestamp in a transaction. Unpublished/deleted saved articles are handled as unavailable.
- Navigation uses line icons, a deliberate phone tab bar and theme-aware colors. User search is debounced and ignores stale responses. User practice summaries explicitly cover the latest 50 records. Browsing the audio library no longer writes duration metadata automatically.

## Daily editorial workspace

- Article and recording libraries fetch 20 records at a time, with server-side status filters, explicit loaded-item search, refresh, loading/error/empty states and phone-friendly actions. Pagination uses document-ID order rather than claiming newest-first ordering. No new composite index is required.
- Recording details provide on-demand audio preview and metadata editing. Browsing the library does not preload every media file. Archives show playlist dependencies and retain the file and references; restoring returns the recording to drafts. Public catalog/pickers and hydrated public playlists omit inactive, private, draft and archived recordings. Archiving is a catalog action, not revocation of Storage URLs, cached players or downloaded copies. Audio metadata still has its pre-existing public-read rules.
- Playlist editors preserve explicit track order, provide move-up/down controls, retain missing references until explicitly removed, and support clearing all tracks even on legacy embedded-track records. Public hydration batches distinct recording IDs in groups of 30. Archiving a playlist makes it private; restoring leaves it private for review.
- Every article edit/archive/restore atomically snapshots the complete previous document into `dhamma_posts/{postId}/revisions/{nextVersion}`. Checkpoints are paginated, private to permitted Dhamma readers and immutable. Restoring copies editorial fields into a draft, preserves original author/creation/publication metadata, and checkpoints the version being replaced. Historical content from before this upgrade cannot be reconstructed.
- Article, recording and playlist editors use version checks to reject stale saves. Legacy documents begin at version zero. The UI preserves unsaved editor state on failure; article forms also retain their existing browser recovery copy. Competing transaction failures are translated into a conflict message only after a fresh authorized read confirms a newer version.
- Proposed Firestore rules require article edits and accurate checkpoints in the same transaction, enforce recording and upgraded-playlist version increments, and prohibit hard deletion of articles, revisions and audio. Legacy personal playlists without version fields retain their existing owner-write format.

## Verification commands

Run `npm test`, `npm run i18n:check`, and `npm run build`.

For Firestore tests, start `firebase emulators:start --only firestore --project demo-nirvanaya` and run `npm run test:rules` in a second terminal. The tests target only the local emulator on port 8185; they never seed or modify the production database.

Coverage includes self-enrollment, role escalation, inactive accounts, explicit action/resource boundaries, published/draft visibility, ordinary owner edits, ownership transfer, metric identity spoofing, analytics read queries and legacy playlists. Editorial emulator tests use the isolated `demo-editorial` project and exercise atomic accurate snapshots, forged/standalone checkpoint denial, immutable/private history, restore/archive, concurrent-save conflicts, audio asset retention, playlist versions and pagination cursors. Pure tests cover date boundaries, all-time history, invalid sessions, missing growth baselines, permission normalization, ordered/empty playlist selection and public playback eligibility. Browser checks use the signed-in admin session without publishing, deleting or updating production content.

Validated on 2026-09-24: 32 application tests and 12 Firestore emulator tests pass; TypeScript, targeted ESLint and translation validation (727 keys per language) pass. The production build succeeds with existing repository warnings. Browser checks cover desktop and 390-pixel phone layouts, light/dark modes, 20-to-40-row pagination without duplicates, empty archive filters, recording details, dependency lookup and unsaved playlist reordering. Live history correctly reports an access error under the still-deployed older rules; restoration and race behavior were verified against the emulator, not by altering production articles.

## Rollout

The new rules are versioned and emulator-tested, **not deployed to Firebase**. The editorial workspace adds `version`/editor metadata lazily and creates a revisions subcollection on the first successful article edit. No bulk migration is required. The current admin record already has an active flag and explicit permissions; do not replace it with a newly invented role record.

Coordinate the web and Firestore release: compare deployed rules with this branch, rerun emulator coverage, deploy the updated web app and deploy only Firestore rules to the existing `nirvanaya-web` project in the same release window. Pause admin editing during that window and reload older admin tabs afterwards. Old rules deny the new revision transaction; new rules intentionally deny old article/audio editors that lack version/checkpoint fields. Neither failure commits a partial article edit. Verify one controlled draft edit/restoration with the existing administrator and representative public/user queries after deployment. A Vercel Git deployment alone does not deploy Firebase rules. Rolling the web app back alone will not restore old editor compatibility; plan the rules rollback as well, retaining any checkpoints already created.

## Remaining work

This branch does not implement trusted account suspension, role-management UI, Storage rule hardening, asset cleanup, a system-wide audit log, review/scheduling, courses/teachers or an inbox. Existing public reads for audio and metric collections retain their previous behavior; draft visibility is restricted for Dhamma posts. Other collections still need comprehensive schema validation. Full collection reads remain in trend analytics, name/email search, playlist management/track selection and archive dependency checks; maintained summaries, reverse-reference indexes and indexed full-text search are scaling follow-ups. Library text search currently covers loaded records, clearly labeled in the UI.

The next stage is learning organization (teachers, learning paths and richer categorization), followed by review/scheduling and operational automation.
