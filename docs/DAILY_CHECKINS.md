# Daily check-ins

## Experience

- Admin → Daily check-ins manages bilingual Yes / No questions using the existing `content` permissions. New questions default to draft. Active questions are published immediately; archive replaces hard deletion. Changes use optimistic version checks to prevent overwriting another editor.
- A signed-in user sees unanswered questions on app entry or foreground return. “Later” dismisses the reminder until the next opening. Home and Progress offer a manual entry point.
- Automatic reminders wait while a meditation is running/paused, on the meditation or guides routes, while audio is playing, or while another dialog is open.
- Both Yes and No complete an item. Today’s answers can be revised. The local date changes at midnight, including daylight-saving changes; historical answers are retained. No scheduled delete/reset job is needed.
- Progress shows the last 30 local calendar days independently of its meditation-period selector: days with responses, Yes/No totals, and expandable daily answers. Missing responses are never inferred as No. Check-ins do not change meditation minutes or streaks.
- English and Sinhala interface strings use the translation system. All new surfaces use Admin Theme tokens and support light/dark mode.

## Firebase data

`daily_checkin_questions/{id}` stores `titleEn`, `titleSi`, `order`, `status` (`draft`, `active`, `archived`), `version`, and creator/update metadata. Signed-in users can query active questions. Only authorized content administrators can manage the catalog.

`users/{uid}/daily_checkins/{YYYY-MM-DD_questionId}` stores one Boolean answer per question/day, the original bilingual wording and question version, local day boundaries, IANA timezone and boundary UTC offsets, and server timestamps. Transactions make repeated saves idempotent. New answers validate the version the user saw; later edits preserve the original wording.

Only the owner can read, write or delete their answers, including when the requester is an administrator. Creation requires an active question, matching snapshot and currently valid day. Updates can only change the Boolean answer and server update timestamp during the original day. JSON export includes all check-in history; account deletion removes this subcollection before deleting the profile and authentication account. CSV remains meditation-only.

The timezone is client-reported for a personal reflection feature, not a proof of observance. When travelling, date labels remain those recorded at the time; existing entries expire at their original local midnight. A local date is not duplicated across devices or timezone changes. No composite index, Cloud Function, or migration of existing data is required.

## Release

1. Review the additive Firestore rules and emulator test results. These rules are a tested prototype, not a guarantee of exhaustive security; review and harden before broad rollout.
2. Deploy `firestore.rules` to the existing `nirvanaya-web` Firebase project before releasing the web build. The new client requires these rules. Deploying rules first is compatible with the existing app.
3. Release the web build through the normal production branch/Vercel process.
4. Publish the desired questions in Admin → Daily check-ins. “Observe Sil” and “Reflect on Sil” are editor suggestions only; no production content is seeded automatically.
5. Verify a normal user can answer, revise, defer and review their own check-ins. Existing WebView apps receive this web feature without a native app update.

## Verification

- Unit tests: local midnight/year boundaries; Sri Lanka offsets; 23/25-hour DST days and a 22-hour transition; history aggregation without invented No responses.
- Firestore emulator: content-role permissions; forbidden deletion; immutable snapshots; concurrent retries; owner-only access including denial to analytics/super admins; malformed writes, forged IDs and old-day updates rejected; archive history retained; stale question versions rejected.
- Browser QA uses only `demo-learning-ui` on localhost:3001. Publishing, Yes/No answers, same-day editing, reload persistence, Progress counts, Sinhala/light/dark/mobile presentation and reminder behavior are checked with disposable content.
