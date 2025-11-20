# iOS Native Bridge Implementation Guide

This guide provides step-by-step instructions for implementing the meditation timer native bridge in your iOS WKWebView app.

## Overview

The web app now communicates with iOS native code to:
- Show local notifications during meditation
- Play bell sound when meditation completes
- Keep meditation running in background
- Update with remaining time

## Prerequisites

- Xcode 14+
- iOS 14.0+ deployment target
- Swift 5.5+
- Basic understanding of WKWebView and UserNotifications framework

---

## Step 1: Create the Meditation Manager

Create a new Swift file: `MeditationManager.swift`

```swift
import Foundation
import UserNotifications
import AVFoundation

class MeditationManager: NSObject {
    static let shared = MeditationManager()

    private var timer: Timer?
    private var remainingSeconds: Int = 0
    private var audioPlayer: AVAudioPlayer?
    private var backgroundTask: UIBackgroundTaskIdentifier = .invalid

    // MARK: - Public Methods

    func startMeditation(durationMinutes: Int, typeName: String, typeId: String) {
        print("[MeditationManager] Starting meditation: \(durationMinutes) min, type: \(typeName)")

        remainingSeconds = durationMinutes * 60

        // Request notification permission
        requestNotificationPermission()

        // Configure audio session for background playback
        configureAudioSession()

        // Start background task
        startBackgroundTask()

        // Schedule local notification for completion
        scheduleCompletionNotification(
            durationMinutes: durationMinutes,
            typeName: typeName
        )

        // Start countdown timer
        startTimer()

        // Show ongoing notification (iOS 15+)
        if #available(iOS 15.0, *) {
            showOngoingNotification(typeName: typeName, remainingMinutes: durationMinutes)
        }
    }

    func pauseMeditation(elapsedSeconds: Int, remainingSeconds: Int) {
        print("[MeditationManager] Pausing meditation: elapsed=\(elapsedSeconds), remaining=\(remainingSeconds)")

        self.remainingSeconds = remainingSeconds
        timer?.invalidate()
        timer = nil

        // Update notification
        if #available(iOS 15.0, *) {
            updateOngoingNotification(
                title: "Meditation Paused",
                body: "\(formatTime(remainingSeconds)) remaining"
            )
        }
    }

    func resumeMeditation(remainingSeconds: Int) {
        print("[MeditationManager] Resuming meditation: remaining=\(remainingSeconds)")

        self.remainingSeconds = remainingSeconds
        startTimer()

        // Update notification
        if #available(iOS 15.0, *) {
            let minutes = remainingSeconds / 60
            updateOngoingNotification(
                title: "Meditation in Progress",
                body: "\(formatTime(remainingSeconds)) remaining"
            )
        }
    }

    func stopMeditation() {
        print("[MeditationManager] Stopping meditation")

        timer?.invalidate()
        timer = nil
        endBackgroundTask()

        // Cancel notifications
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
        UNUserNotificationCenter.current().removeAllDeliveredNotifications()
    }

    func completeMeditation(durationMinutes: Int, typeName: String, typeId: String) {
        print("[MeditationManager] Meditation completed: \(durationMinutes) min, type: \(typeName)")

        // Play completion sound
        playCompletionSound()

        // Show completion notification (already scheduled, but update it)
        showCompletionNotification(typeName: typeName, durationMinutes: durationMinutes)

        // Cleanup
        stopMeditation()
    }

    // MARK: - Private Methods

    private func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self = self else { return }

            self.remainingSeconds -= 1

            // Update notification every 60 seconds (to save battery)
            if self.remainingSeconds % 60 == 0 {
                if #available(iOS 15.0, *) {
                    let minutes = self.remainingSeconds / 60
                    self.updateOngoingNotification(
                        title: "Meditation in Progress",
                        body: "\(self.formatTime(self.remainingSeconds)) remaining"
                    )
                }
            }

            if self.remainingSeconds <= 0 {
                self.timer?.invalidate()
                self.timer = nil
            }
        }

        // Ensure timer runs in background
        RunLoop.current.add(timer!, forMode: .common)
    }

    private func configureAudioSession() {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try audioSession.setActive(true)
        } catch {
            print("[MeditationManager] Failed to configure audio session: \(error)")
        }
    }

    private func playCompletionSound() {
        guard let soundURL = Bundle.main.url(forResource: "bell_sound", withExtension: "mp3") else {
            print("[MeditationManager] Bell sound file not found")
            return
        }

        do {
            audioPlayer = try AVAudioPlayer(contentsOf: soundURL)
            audioPlayer?.prepareToPlay()
            audioPlayer?.play()

            // Add vibration
            AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
        } catch {
            print("[MeditationManager] Error playing completion sound: \(error)")
        }
    }

    private func requestNotificationPermission() {
        let center = UNUserNotificationCenter.current()
        center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if let error = error {
                print("[MeditationManager] Notification permission error: \(error)")
            }
            print("[MeditationManager] Notification permission granted: \(granted)")
        }
    }

    private func scheduleCompletionNotification(durationMinutes: Int, typeName: String) {
        let content = UNMutableNotificationContent()
        content.title = "Meditation Complete! 🧘"
        content.body = "You completed \(durationMinutes) minutes of \(typeName)"
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(
            timeInterval: TimeInterval(durationMinutes * 60),
            repeats: false
        )

        let request = UNNotificationRequest(
            identifier: "meditation_complete",
            content: content,
            trigger: trigger
        )

        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("[MeditationManager] Error scheduling notification: \(error)")
            }
        }
    }

    @available(iOS 15.0, *)
    private func showOngoingNotification(typeName: String, remainingMinutes: Int) {
        let content = UNMutableNotificationContent()
        content.title = "Meditation in Progress"
        content.body = "\(typeName) - \(remainingMinutes) minutes remaining"
        content.interruptionLevel = .passive // Don't interrupt user

        let request = UNNotificationRequest(
            identifier: "meditation_ongoing",
            content: content,
            trigger: nil // Show immediately
        )

        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("[MeditationManager] Error showing ongoing notification: \(error)")
            }
        }
    }

    @available(iOS 15.0, *)
    private func updateOngoingNotification(title: String, body: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.interruptionLevel = .passive

        let request = UNNotificationRequest(
            identifier: "meditation_ongoing",
            content: content,
            trigger: nil
        )

        UNUserNotificationCenter.current().add(request)
    }

    private func showCompletionNotification(typeName: String, durationMinutes: Int) {
        let content = UNMutableNotificationContent()
        content.title = "Meditation Complete! 🧘"
        content.body = "You completed \(durationMinutes) minutes of \(typeName)"
        content.sound = .default

        let request = UNNotificationRequest(
            identifier: "meditation_complete",
            content: content,
            trigger: nil // Show immediately
        )

        UNUserNotificationCenter.current().add(request)
    }

    private func startBackgroundTask() {
        backgroundTask = UIApplication.shared.beginBackgroundTask { [weak self] in
            self?.endBackgroundTask()
        }
    }

    private func endBackgroundTask() {
        if backgroundTask != .invalid {
            UIApplication.shared.endBackgroundTask(backgroundTask)
            backgroundTask = .invalid
        }
    }

    private func formatTime(_ seconds: Int) -> String {
        let minutes = seconds / 60
        let secs = seconds % 60
        return String(format: "%d:%02d", minutes, secs)
    }
}
```

---

## Step 2: Create the WebView Script Message Handler

Create: `MeditationScriptMessageHandler.swift`

```swift
import Foundation
import WebKit

class MeditationScriptMessageHandler: NSObject, WKScriptMessageHandler {

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard let body = message.body as? [String: Any] else {
            print("[ScriptHandler] Invalid message body")
            return
        }

        guard let action = body["action"] as? String else {
            print("[ScriptHandler] Missing action")
            return
        }

        let manager = MeditationManager.shared

        switch message.name {
        case "onMeditationStart":
            handleStart(body: body, manager: manager)

        case "onMeditationComplete":
            handleComplete(body: body, manager: manager)

        case "onMeditationPause":
            handlePause(body: body, manager: manager)

        case "onMeditationResume":
            handleResume(body: body, manager: manager)

        case "onMeditationStop":
            handleStop(body: body, manager: manager)

        default:
            print("[ScriptHandler] Unknown message: \(message.name)")
        }
    }

    // MARK: - Handler Methods

    private func handleStart(body: [String: Any], manager: MeditationManager) {
        guard let durationMinutes = body["durationMinutes"] as? Int,
              let typeName = body["typeName"] as? String,
              let typeId = body["typeId"] as? String else {
            print("[ScriptHandler] Invalid start parameters")
            return
        }

        manager.startMeditation(
            durationMinutes: durationMinutes,
            typeName: typeName,
            typeId: typeId
        )
    }

    private func handleComplete(body: [String: Any], manager: MeditationManager) {
        guard let durationMinutes = body["durationMinutes"] as? Int,
              let typeName = body["typeName"] as? String,
              let typeId = body["typeId"] as? String else {
            print("[ScriptHandler] Invalid complete parameters")
            return
        }

        manager.completeMeditation(
            durationMinutes: durationMinutes,
            typeName: typeName,
            typeId: typeId
        )
    }

    private func handlePause(body: [String: Any], manager: MeditationManager) {
        guard let elapsedSeconds = body["elapsedSeconds"] as? Int,
              let remainingSeconds = body["remainingSeconds"] as? Int else {
            print("[ScriptHandler] Invalid pause parameters")
            return
        }

        manager.pauseMeditation(
            elapsedSeconds: elapsedSeconds,
            remainingSeconds: remainingSeconds
        )
    }

    private func handleResume(body: [String: Any], manager: MeditationManager) {
        guard let remainingSeconds = body["remainingSeconds"] as? Int else {
            print("[ScriptHandler] Invalid resume parameters")
            return
        }

        manager.resumeMeditation(remainingSeconds: remainingSeconds)
    }

    private func handleStop(body: [String: Any], manager: MeditationManager) {
        manager.stopMeditation()
    }
}
```

---

## Step 3: Update ViewController to Setup WebView

Update your `ViewController.swift` or main view controller:

```swift
import UIKit
import WebKit
import UserNotifications

class ViewController: UIViewController {

    var webView: WKWebView!
    private let messageHandler = MeditationScriptMessageHandler()

    override func viewDidLoad() {
        super.viewDidLoad()

        // Configure WKWebView
        let configuration = WKWebViewConfiguration()

        // Add script message handlers
        let contentController = WKUserContentController()
        contentController.add(messageHandler, name: "onMeditationStart")
        contentController.add(messageHandler, name: "onMeditationComplete")
        contentController.add(messageHandler, name: "onMeditationPause")
        contentController.add(messageHandler, name: "onMeditationResume")
        contentController.add(messageHandler, name: "onMeditationStop")

        configuration.userContentController = contentController

        // Allow inline media playback
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []

        // Create WebView
        webView = WKWebView(frame: view.bounds, configuration: configuration)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(webView)

        // Load your web app
        if let url = URL(string: "https://your-meditation-app-url.com") {
            let request = URLRequest(url: url)
            webView.load(request)
        }

        // Request notification permission
        requestNotificationPermission()
    }

    private func requestNotificationPermission() {
        let center = UNUserNotificationCenter.current()
        center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if let error = error {
                print("Notification permission error: \(error)")
            }
            print("Notification permission granted: \(granted)")
        }
    }
}
```

---

## Step 4: Update Info.plist

Add required permissions and capabilities to `Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- App Transport Security -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>

    <!-- Audio Background Mode -->
    <key>UIBackgroundModes</key>
    <array>
        <string>audio</string>
    </array>

    <!-- User Notifications -->
    <key>NSUserNotificationsUsageDescription</key>
    <string>We need to send notifications when your meditation timer completes</string>

    <!-- Microphone (if needed for future features) -->
    <key>NSMicrophoneUsageDescription</key>
    <string>Optional: Record meditation notes</string>
</dict>
</plist>
```

---

## Step 5: Add Bell Sound Resource

1. Add your bell sound file to the project:
   - Right-click project in Navigator
   - "Add Files to [Project]..."
   - Select `bell_sound.mp3` or `bell_sound.wav`
   - Make sure "Copy items if needed" is checked
   - Make sure it's added to target

2. Verify in Build Phases:
   - Select your target
   - Go to "Build Phases"
   - Check "Copy Bundle Resources"
   - Ensure `bell_sound.mp3` is listed

---

## Step 6: Configure Background Modes

1. Select your project target
2. Go to "Signing & Capabilities"
3. Click "+ Capability"
4. Add "Background Modes"
5. Enable:
   - ✅ Audio, AirPlay, and Picture in Picture
   - ✅ Background fetch (optional)

---

## Step 7: Handle App Lifecycle

Update `AppDelegate.swift`:

```swift
import UIKit
import AVFoundation

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

        // Configure audio session for background playback
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try audioSession.setActive(true)
        } catch {
            print("Failed to configure audio session: \(error)")
        }

        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Meditation timer continues in background
        print("App going to background - meditation continues")
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        print("App became active")
    }
}
```

---

## Testing

### Test in Safari Web Inspector (Mac):
1. Enable Web Inspector on iOS device:
   - Settings → Safari → Advanced → Web Inspector
2. Connect device to Mac
3. Open Safari → Develop → [Your Device] → [Your Web App]
4. In Console, type:
   ```javascript
   window.webkit.messageHandlers.onMeditationStart.postMessage({
     action: 'start',
     durationMinutes: 1,
     typeName: 'Test',
     typeId: 'test-id'
   })
   ```

### Test on Device:
1. Build and run app on device
2. Navigate to meditation timer
3. Start a 1-minute meditation
4. Verify:
   - ✅ Notification permission requested
   - ✅ Meditation timer starts
   - ✅ Bell sound plays when complete
   - ✅ Completion notification appears
   - ✅ Works when app is backgrounded

---

## Troubleshooting

### Message handlers not working:
- Check message handler names match exactly
- Verify `contentController.add(messageHandler, name: "...")` is called
- Check JavaScript console for errors
- Use Safari Web Inspector to debug

### Notifications not showing:
- Request notification permission
- Check Settings → Notifications → Your App
- Verify notification content is not empty
- Test with `trigger: nil` for immediate delivery

### Bell sound not playing:
- Check file is in Bundle Resources
- Verify file name and extension match
- Test audio session configuration
- Check device volume and silent mode

### Timer stops in background:
- Enable "Audio" background mode
- Configure AVAudioSession for playback
- Use `.common` run loop mode for timer
- Start background task for extended time

---

## Performance Optimization

1. **Battery Efficiency**: Update notification every 60 seconds
2. **Audio Session**: Use `.mixWithOthers` to allow other apps
3. **Timer Accuracy**: Use `RunLoop.common` mode
4. **Background Task**: Start only when needed
5. **Notification Throttling**: Update only on significant changes

---

## Claude AI Prompts for Implementation

If you're using Claude AI to help implement this, use these prompts:

```
"Implement the MeditationManager.swift file exactly as specified in the iOS guide,
using Swift and following iOS best practices."

"Create the MeditationScriptMessageHandler.swift to handle WKWebView messages
from JavaScript and route them to MeditationManager."

"Update ViewController.swift to configure WKWebView with script message handlers
and handle notification permissions."

"Update Info.plist with required permissions for notifications and audio background mode."

"Configure the iOS project target for background audio and add the bell sound resource."
```

---

## Next Steps

After implementing:
1. ✅ Test all meditation timer events (start, pause, resume, stop, complete)
2. ✅ Test background behavior (home button, app switcher)
3. ✅ Test notification interactions
4. ✅ Test bell sound playback
5. ✅ Test on multiple iOS versions (14.0+)
6. ✅ Submit for App Store review (follow notification guidelines)

---

## App Store Submission Notes

When submitting to App Store:
- Clearly explain notification usage in App Privacy section
- Justify audio background mode (meditation timer)
- Test on all supported iOS versions
- Provide screenshots showing meditation timer workflow
- Include notification permission flow in screenshots

---

## Additional Resources

- [WKWebView Documentation](https://developer.apple.com/documentation/webkit/wkwebview)
- [WKScriptMessageHandler Guide](https://developer.apple.com/documentation/webkit/wkscriptmessagehandler)
- [UserNotifications Framework](https://developer.apple.com/documentation/usernotifications)
- [AVAudioSession Guide](https://developer.apple.com/documentation/avfaudio/avaudiosession)
- [Background Execution](https://developer.apple.com/documentation/uikit/app_and_environment/scenes/preparing_your_ui_to_run_in_the_background)
