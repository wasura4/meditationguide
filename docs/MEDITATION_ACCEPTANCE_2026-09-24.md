# Meditation acceptance checks — 24 September 2026

## Browser and connection recovery

Test environment: local web app on port 3001, Auth emulator on 9099 and Firestore emulator on 8185, project `demo-learning-ui`. No production records or rules changed.

A temporary loopback TCP proxy on 8187 interrupted the actual Firestore transport while leaving the app and Firebase Auth available. This tests database unavailability, not a full device airplane-mode launch (the latter also depends on cached web assets).

1. Started a one-minute session with the completion bell disabled.
2. Interrupted the Firestore connection and paused at **00:45 remaining**.
3. Reloaded while disconnected. Found a defect: the profile read failure made the app display “Authentication Required” despite a restored Firebase Auth identity.
4. Fixed AuthProvider to make the authenticated identity available independently of profile loading. Provisional identity has only the `user` role and is never written over the stored profile. Profile hydration is guarded against account changes and unmount; it retries on the browser's online event.
5. Reloaded again with the database still unreachable: the paused clock recovered at **00:45**. Resumed and completed with **01:00 time practised**.
6. The save timeout displayed a retained, retryable result. Reloading during the outage preserved that result.
7. Restored transport and retried. The app acknowledged “Saved to your logbook.” Emulator inspection showed exactly one new session, `practice_893016f4-f6ce-42e6-aba5-fee8134cd50c`, with duration `1` and status `completed` (collection count 4 → 5).
8. Restored the original local emulator connection configuration and stopped the temporary proxy.

The new AuthProvider regression test covers a stalled/failed profile read, no fallback profile writes, recovery on reconnection, stale account responses and a response arriving after sign-out. **42 application tests, TypeScript, targeted ESLint and the production build pass.** The build retains pre-existing unrelated warnings. The prior 23 Firestore rules tests remain applicable; no rules changed in this acceptance fix.

## Android device testing

An Android 15 phone (model CPH2465) is connected. A separate QA copy at `temp/android-clock-qa` built successfully, was installed alongside the production app, and opened to sign-in without a captured startup error. Its package is `com.nirvanaya.meditation.clocktest`, label **Nirvanaya Clock Test**. It uses the local web app and Firebase emulators through USB port forwarding on 3001, 9099 and 8185. Its native timer service is copied from the current Android source.

APK: `temp/android-clock-qa/app/build/outputs/apk/debug/app-debug.apk`; SHA-256 `E5C24540DD4632ADD6576C96597388A8D8AA28BDEDCC5D7F497C40EB5FFCF06C`. The phone disallows granting runtime notification permission through the USB shell, so the tester must enable notifications in the phone's app settings. A disposable ordinary account was created in the local Auth emulator for this test; no production credentials are needed.

QA-only differences: distinct application ID, demo Firebase identifiers, local loopback URL/origin allowlist and cleartext loopback network configuration, onboarding skipped, cloud messaging registration disabled. None of these testing changes are applied to the production Android source. The QA binary is not suitable for store publication.

Pending device acceptance: locked-screen completion, bell versus silent ending, notification permission denied, app switch/reopen, pause/resume, interruption/process termination and the resulting logbook entry. A successful build alone does not pass these checks.

### First device test and notification fix

The tester reported no bell and a completed session after unlocking. Native preferences contained two completed IDs, while Android reported `POST_NOTIFICATIONS: granted=false`, app notification importance `NONE`, and zero notifications posted. This identifies an actual blocked permission; it does not establish whether the original completion occurred before or after unlocking.

Added a permission/silent-channel warning to setup and the active clock, with an explicit action that requests Android notification permission or opens this app's notification settings. The app does not prompt automatically. Replaced the default phone notification sound with a bundled bell matching the web preview. Rebuilt and installed the QA update without clearing the tester's session or account. The updated APK SHA-256 is `5A2922AAF9F2D852BF73E7F056033307B793BC13519C99C63E9CFF712313C46C`.

After the tester used the action, Android reported `POST_NOTIFICATIONS: granted=true`. A new one-minute snapshot with `bell:true` was received by the native service, and the phone was observed in `mWakefulness=Asleep` during that session. The tester confirmed **the bell sounded while locked**. Android retained completed ID `practice_b129fd0f-5090-41f5-81cf-763d563ffff4` and posted notification 1002 on `practice_complete_bell_v2` using the bundled sound. This passes the bell-enabled lock-screen check on this Android 15 device. Silent completion combined with pause/resume is the next manual check.

43 application tests, TypeScript, targeted ESLint, the production web build and 823 matching English/Sinhala translation keys pass for this fix. Native QA APK build passes; the binary patch reverse-check passes against the Android source and bundled sound asset.

## iOS and release

iOS still requires a Mac build and iPhone checks. The web and iOS pull requests remain drafts, and production is unchanged.
