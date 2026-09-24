# Meditation clock review

Reviewed web commit `672ee6a`, the local Android source, and iOS main commit `c66e2421051584285f8f8525a2ca8950109b1247`. Browser experiments used only the signed-in disposable emulator project on port 3001 at 390x844. No production sessions were created or changed. No app code was changed during this review.

## Reproduced experience problems

- Setup's Start Meditating button announces Session Started, but opens an idle timer requiring a second press of an unlabeled play button.
- The active view forces a dark gradient regardless of the selected theme. The bottom navigation remains visible. The layout combines `h-screen`, `h-[75vh]` and a negative top margin; the phone main rectangle began above the viewport. It needs a safe-area-aware layout rather than positional offsets.
- Play, pause, resume and stop buttons have no accessible names. Most timer/reflection copy remains English even though setup uses translations. Visually hidden setup steps remain in the accessibility tree.
- A paused local session showed 14:46 remaining. After reload (which returned to setup) and entering the clock again, it showed 14:32 while still paused. The restore code adds time since last update even when paused. It also fails to reconstruct paused timer references used on resume.
- Stopping the short local session immediately opened Session Complete, credited one minute, and showed a completion congratulation despite an abandoned status. There is no stop confirmation or discard option.
- Reflection starts with a required star rating before saving. A short optional observation would be a better default than asking users to grade meditation.

## Reliability findings from source

- Timer callbacks capture prior elapsed/start state; completion has side effects inside React state updaters, no synchronous one-shot completion guard, and saves through `addDoc`. Multiple completion paths can create duplicates. Actual practice duration must exclude pauses and avoid the current wall-clock fallback/minimum-one-minute inflation.
- Local recovery is a single unscoped storage record, omits user/type/event metadata, and rejects previous-calendar-day sessions. The page always enters setup after reload, so recovery is not surfaced until a new setup is chosen.
- Recovery state is deleted before Firestore confirms the save. On failure the UI receives a temporary session ID as though saving succeeded; reflection then targets a nonexistent document. Preserve a pending result with a stable ID and explicit retry state until acknowledged.
- Screen Awake is displayed whenever running, regardless of whether wake lock was acquired. Reacquire on foreground when appropriate and show actual capability/state.
- The web bell DOES respect the stored sound toggle through audioUtils. Native messages do not carry it. The web AudioContext is first created at completion; initialize/enable audio from the deliberate Start gesture and test platform playback restrictions.
- Web expects `window.Android.onMeditationStart/Pause/Resume/Stop`; Android injects `AndroidInterface` with `startMeditationTimer/pauseMeditationTimer/resumeMeditationTimer/stopMeditationTimer`. Unify capability detection, messages and native-to-web recovery around a stable session ID.
- iOS schedules its completion notification on start but pause/resume do not cancel/reschedule that deadline. Completion then calls stop, which clears all pending/delivered notifications. Scope cancellation to the current meditation and give one component responsibility for the completion cue.

Primary implementation references: `src/app/meditate/page.tsx`, `src/components/meditation/MeditationTimer.tsx`, `MeditationSetup.tsx`, `SessionReflectionForm.tsx`, `src/lib/meditationService.ts`, `src/hooks/useNativeBridge.ts`, Android `WebViewActivity.kt` / `MeditationTimerService.kt`, iOS `MeditationManager.swift`.

## Recommended flow

1. Prepare: compact selected practice row with a chooser sheet, duration presets/custom duration, bell preview/on-off, optional settling time, remembered last selection. Keep the existing palette and Sinhala/English typography. Make one clearly labeled Begin action actually start the session.
2. Settle: optional short, skippable preparation countdown, excluded from recorded practice duration.
3. Practice: centered lighter-weight tabular clock, thin remaining-time ring, quiet practice label and explicit Paused state. Follow the selected theme; optionally offer dim mode. Hide navigation and unrelated player controls during the session. Provide labeled Pause/Resume and a secondary End action with resume/save/discard choices.
4. Finish: gentle completion cue, accurate practice time, honest saved/pending status, then optional reflection and a small contribution to today's goal. Present early ending neutrally. Keep motivation outside the active meditation screen.

## Implementation order and acceptance

First rebuild timing/recovery/saving around one explicit session lifecycle and test it; develop the focus UI on that lifecycle in the same web phase. Then align native contracts and notification deadlines, and verify real devices before claiming dependable locked-screen completion. After that add optional interval bells or open-ended practice if desired.

Acceptance cases: start once; rapid double start/end; pause/resume; paused reload; navigation away/back; refresh with a different setup; midnight crossing; user switch; timer expiry while hidden; offline save and retry without duplicates; early end without inflated minutes; disabled bell; native notification permission denied; actual wake lock failure; VoiceOver/TalkBack names; Sinhala wrapping; small phones, landscape and large text. Verify lock screen, interruptions, background/foreground and process termination on actual iPhone and Android devices.

Browsers throttle background timers ([MDN Page Visibility](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)). A web timestamp-based clock can reconcile correctly on return, but locked-screen notification delivery needs the native implementation and permission handling; iOS provides system-scheduled local notifications ([Apple documentation](https://developer.apple.com/documentation/usernotifications/scheduling-a-notification-locally-from-your-app)). Desktop viewport emulation does not verify native behavior.
