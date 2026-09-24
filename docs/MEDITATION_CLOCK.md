# Meditation clock rebuild

This branch replaces the two-step start and interval-based component with a serialized practice lifecycle and a theme-aware focus view. Preparation, practice, pause, early ending and confirmed saving have distinct states. Preparation time and pauses are excluded from recorded duration. Partial sessions retain `abandoned` status and fractional minutes; completing the planned duration retains `completed` status. Existing analytics policies for completed sessions are unchanged.

## Experience

- Compact expandable practice picker, remembered selection/duration, bell preview and optional 0/5/10/15-second settling time. Duration uses the same preference as Settings.
- One Begin action, a thin remaining-time ring, lighter tabular clock, labeled controls, actual wake-lock status and safe-area-aware spacing. Navigation and unrelated player controls are hidden during practice; any playing guide is paused when beginning.
- End opens a sheet with continue/stay-paused, save and finish, or discard. Early endings have neutral copy and never invent a full minute.
- Completion distinguishes saving, pending and acknowledged states. Reflection is optional, requires no rating, retains a local draft on failure and reloads saved notes.
- Sinhala and English copy; selected light/dark theme is respected.

## Persistence and Firestore

`nirvanaya.practice.v1:<uid>` stores one active or pending result with a stable `practice_<uuid>` ID, owner, type, optional event, target/elapsed milliseconds, running anchor, start/end timestamps, phase and bell preference. Ticks derive time from timestamps and do not write storage. Paused recovery freezes elapsed time, and active recovery crosses midnight. Storage is required before starting; a storage failure is visible. The legacy unscoped timer record cannot safely identify its user/type and is not automatically adopted. Finish old-version sessions before updating.

`savePractice` transactionally creates `meditation_sessions/<stable-id>` and, for completed event sessions, increments `event_participation/<event>_<uid>` once. Existing session IDs are acknowledged without overwriting reflection. A 12-second acknowledgment timeout leaves a retryable pending result; a transaction still finishing in the background is safe to retry. One pending result is retained until saved before another practice can begin. This is recovery on this browser/device, not cross-device live timer sync.

The prototype rules change adds only an authenticated `get` for a nonexistent meditation-session document, allowing the create transaction to inspect its ID. Reads of existing sessions, owner writes and list permissions retain their prior restrictions. Emulator tests cover foreign/anonymous reads, unfiltered queries, owner retries and atomic event credit. There is no migration or new index. **Deploy the matching rules before the web release**; they have passed emulator testing and a compilation dry run, but are not deployed by this branch.

## Native protocol 2

The web sends the complete snapshot plus `protocolVersion: 2` and `deadlineMs = anchor + targetMs - elapsedMs` to `AndroidInterface.syncPractice(JSON)` or `webkit.messageHandlers.syncPractice.postMessage(snapshot)`. The web remains the authority for state and Firestore saving. Native owns its completion notification, including the bell preference. Old wrappers get an explicit keep-screen-open/update notice and the web fallback, rather than incompatible native commands.

- Android: source files in `D:/meditationapp/androidapp` implement the snapshot interface, bounded foreground wake lock, deadline-based updates, persisted recovery and deduplicated completion notification. Native pause/stop notification actions are omitted for protocol 2 so they cannot silently diverge from the web state. Calls are accepted only while the main WebView URL has the configured HTTPS host. The local Android folder has no Git repository; [android-practice-v2.patch](native/android-practice-v2.patch) retains the changes for review. It is already applied locally; do not apply it twice.
- iOS: [draft PR #1](https://github.com/wasura4/meditationguideiOS/pull/1) adds the same snapshot handler. It scopes cancellation by session ID, reschedules after resume, respects silent endings and uses system-scheduled notifications instead of a repeating background timer. Main-frame and HTTPS-host validation protect the handler. Existing legacy handlers remain registered. Source checkout: `temp/meditationguideiOS`.

Neither native binary is distributed by a Vercel deployment. Notification permission/system settings can suppress native alerts; force-stop and OS background restrictions must be tested on devices. Do not advertise reliable locked-screen operation from browser emulation alone.

Android device testing exposed that denied notification permission silently suppressed the completion cue. The updated bridge exposes `getPracticeNotificationStatus` and `enablePracticeNotifications`; the setup and active clock now show a warning and a deliberate permission/settings action when notifications are blocked or the bell channel is silent. The status refreshes after returning from system settings. Android uses a bundled three-second bell matching the web preview, on the `practice_complete_bell_v2` notification channel. The phone's notification volume, silent mode and Do Not Disturb still apply. `scripts/generate-practice-bell.cjs` reproduces the WAV, which is included in the binary Android patch.

## Validation and rollout

- 41 application tests and 23 Firestore emulator tests pass, including timestamp boundaries, pause/reload/resume, short sessions, terminal idempotency, native payload/fallback behavior, duplicate completion, event credit and rejected-save retry.
- TypeScript, targeted ESLint, translation validation (819 keys per language), production build and Firestore compilation dry run pass. Existing unrelated build warnings remain.
- Browser checks use only disposable `demo-learning-ui`: single-tap start, settling, paused recovery at 00:39, accurate 21-second early ending, natural 01:00 completion, optional reflection, deliberately rejected save preserved through reload and acknowledged on retry, phone layout and Sinhala/dark mode. Rejection was produced with temporary emulator-only rules, then the normal rules were restored.
- Android `:app:compileDebugKotlin` succeeds with existing warnings. The Android patch is also checked against the current source in reverse to ensure it represents the already-applied changes.
- iOS cannot be built on this Windows host. Build the draft on a Mac and verify iPhone/Android locked-screen delivery, denied permission, silent mode, background return, pause/resume, device interruption and process termination before releasing native updates. Neither real-device testing nor app-store publication is claimed.

Keep the web and iOS pull requests in draft for the coordinated release. Review the local UI, complete native device checks, release mobile builds, then deploy the additive rules and web app. Verify a controlled real session and its logbook entry after rollout. Production remains on the previous release until that rollout is performed.
