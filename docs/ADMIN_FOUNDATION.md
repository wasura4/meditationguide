# Admin foundation

This is the first implementation in the admin upgrade sequence. The previous user-facing release is commit `d912782` on `main`; Vercel reports its Production deployment succeeded, and `https://meditationguide.vercel.app/` returns the app successfully.

## Changes

- Admin access starts with a server-confirmed, active admin profile. Cached browser roles cannot grant access. All routes and navigation use the same explicit resource permissions; legacy `admin` records with explicit permissions remain supported.
- Proposed Firestore rules prohibit self-enrollment and role edits, enforce resource/action permissions, restrict event management, keep drafts private, and prevent ownership changes. Only a server timestamp for the administrator's own last login can be updated by that administrator. Role provisioning uses a trusted Admin SDK environment.
- Settings contains working theme/translation navigation and Firebase operations links. Browser-only maintenance, backup, session-timeout and similar switches were removed. Account suspension is unavailable in the UI until an authenticated backend can enforce it through Firebase Authentication.
- Practice totals, participation, rankings, and new registrations respect the selected period. Completed practice excludes invalid/nonpositive durations. “All time” includes older history; missing baselines show no comparison. Content inventory remains lifetime; reads and audio listens use recorded events in the selected period. These are event counts, not unique people or verified listening completion.
- Article previews use the reader sanitizer, including supported YouTube embeds. Video-only articles can be published, library summaries no longer show HTML, and edits preserve the first publication timestamp in a transaction. Unpublished/deleted saved articles are handled as unavailable.
- Navigation uses line icons, a deliberate phone tab bar and theme-aware colors. User search is debounced and ignores stale responses. User practice summaries explicitly cover the latest 50 records. Browsing the audio library no longer writes duration metadata automatically.

## Verification

Run `npm test`, `npm run i18n:check`, and `npm run build`.

For Firestore tests, start `firebase emulators:start --only firestore --project demo-nirvanaya` and run `npm run test:rules` in a second terminal. The tests target only the local emulator on port 8185; they never seed or modify the production database.

Coverage includes self-enrollment, role escalation, inactive accounts, explicit action/resource boundaries, published/draft visibility, ordinary owner edits, ownership transfer, metric identity spoofing, analytics read queries and legacy playlists. Pure tests cover date boundaries, all-time history, invalid sessions, missing growth baselines and permission normalization. Browser checks use the signed-in admin session without publishing, deleting or updating production content.

## Rollout

The new rules are versioned and emulator-tested, **not deployed to Firebase**. No data migration or new collection is required for this phase. The current admin record already has an active flag and explicit permissions; do not replace it with a newly invented role record.

Deploy the updated web reader first, then compare the current deployed rules against this branch, rerun emulator coverage and deploy only Firestore rules to the existing `nirvanaya-web` project. Verify the existing administrator and representative public/user queries after deployment. A Vercel Git deployment alone does not deploy Firebase rules.

## Remaining work

This phase does not implement trusted account suspension, role-management UI, Storage rule hardening, asset cleanup, content revisions, audit logs, review/scheduling, courses/teachers or an inbox. Existing public reads for audio, playlists and metric collections retain their previous behavior; draft visibility is restricted for Dhamma posts. Other collections still need comprehensive schema validation. Full collection reads remain in trend analytics and name/email search; maintained summaries and indexed search/pagination are the scaling follow-up.

The next stage is the daily editorial workspace: content/media forms and tables, playlist ordering, archive/dependency handling, pagination and revisions. Learning features and operational automation follow it.
