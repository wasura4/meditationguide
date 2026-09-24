# Audio listening experience

## Scope

- Individual recordings and guides use the existing root PlayerProvider and a single HTMLAudioElement. The player survives client-side navigation; browsing no longer creates one audio element per recording.
- Artwork and teacher metadata come from existing guide records. The UI uses Admin Theme tokens in both light and dark mode and includes English and Sinhala labels.
- Now Playing includes seeking, elapsed/remaining time, 10-second skips, previous/next, speed, queue selection, repeat, and recoverable errors. Repeat is off initially; the last track finishes without automatically looping.
- Guide details show ordered published tracks, description, teacher, and duration. Existing `/guides/:id` links redirect to `/kamatahan/guides/:id`; `/kamatahan?start=:id` remains supported.
- Recording search includes topic, language, and duration filters. Guide search includes teacher filtering. Empty results and load failures are separate states.

No Firestore schema migration or rules deployment is required. Native Android/iOS source, WebView configuration, and visibility handling are unchanged. Existing `audio_listens` events now cover individual recordings through the shared player; these are play-start events, not listening minutes or completion records.

## Verification

- Automated player test: one audio element across route changes, background visibility does not pause, bounded seeking, speed across tracks, pause during loading, stale play rejection, retry, sequential completion, repeat including single tracks, stop, sign-out/account change, and unmount cleanup.
- Local Firebase emulator UI: guide details and covers, track selection, pause/resume, seek and speed controls, mini-player across navigation, recording filters and empty results, unavailable recording error, English/Sinhala, mobile light/dark layouts without horizontal overflow.
- Production build, TypeScript, changed-file ESLint, translation parity, and unit suite.
- All browser playback verification used disposable local records. No production listening events were created for QA.

## Before production

Confirm the existing working behavior on one Android phone and one iPhone using the preview build: start a recording, lock the screen, verify continued playback, unlock and pause/resume, then lock again through a guide track transition. Also check any existing lock-screen controls. Browser mocks cannot prove native background playback on physical devices.

Later releases can add saved recordings, cross-device resume, bookmarks, sleep timers, and actual listening analytics. Review `audio_listens` read access before adding personal listening history; this release does not expand the event schema.
