# WebView Native Audio Integration Guide

This guide explains how to integrate native audio playback for the meditation timer bell sound in your Android and iOS WebView apps, ensuring the bell plays reliably even when the screen is off.

## Overview

The current web implementation uses:
- Web Audio API for bell sound generation
- Wake Lock API to keep screen awake during meditation
- localStorage for timer sound preference

For optimal battery life and reliable audio playback when screen is off, you should implement a **JavaScript Bridge** that communicates between the web layer and native app layer.

---

## Architecture Pattern

```
┌─────────────────────────────────────────────────┐
│           Web Layer (React/Next.js)             │
│  - Timer logic and UI                           │
│  - JavaScript Bridge calls                      │
└─────────────────┬───────────────────────────────┘
                  │
                  │ postMessage / evaluateJavaScript
                  │
┌─────────────────▼───────────────────────────────┐
│           Native Layer (Java/Kotlin/Swift)      │
│  - Receive timer events                         │
│  - Schedule native timer/alarm                  │
│  - Play native audio                            │
│  - Handle background execution                  │
└─────────────────────────────────────────────────┘
```

---

## Implementation Guide

### 1. Android WebView Integration

#### Step 1: Create JavaScript Interface Class

Create a new file: `app/src/main/java/com/yourapp/MeditationBridge.kt`

```kotlin
package com.yourapp

import android.content.Context
import android.media.MediaPlayer
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.util.Log
import java.util.Timer
import java.util.TimerTask

class MeditationBridge(private val context: Context) {
    private var meditationTimer: Timer? = null
    private var mediaPlayer: MediaPlayer? = null

    companion object {
        private const val TAG = "MeditationBridge"
    }

    /**
     * Called from JavaScript when meditation timer starts
     * @param durationSeconds - Duration of meditation in seconds
     */
    @JavascriptInterface
    fun startMeditationTimer(durationSeconds: Int) {
        Log.d(TAG, "Starting meditation timer for $durationSeconds seconds")

        // Cancel any existing timer
        cancelMeditationTimer()

        // Schedule timer to play bell sound
        meditationTimer = Timer()
        meditationTimer?.schedule(object : TimerTask() {
            override fun run() {
                playBellSound()
            }
        }, (durationSeconds * 1000).toLong())
    }

    /**
     * Called from JavaScript when meditation is paused or stopped
     */
    @JavascriptInterface
    fun cancelMeditationTimer() {
        Log.d(TAG, "Cancelling meditation timer")
        meditationTimer?.cancel()
        meditationTimer = null
    }

    /**
     * Called from JavaScript to play bell sound immediately
     */
    @JavascriptInterface
    fun playBellSound() {
        Log.d(TAG, "Playing bell sound")

        Handler(Looper.getMainLooper()).post {
            try {
                // Release any existing MediaPlayer
                mediaPlayer?.release()

                // Create new MediaPlayer with bell sound
                // You'll need to add a bell.mp3 file to res/raw/ folder
                mediaPlayer = MediaPlayer.create(context, R.raw.bell)

                mediaPlayer?.setOnCompletionListener { mp ->
                    mp.release()
                    mediaPlayer = null
                }

                mediaPlayer?.start()

            } catch (e: Exception) {
                Log.e(TAG, "Error playing bell sound", e)
            }
        }
    }

    /**
     * Check if sound is enabled in preferences
     */
    @JavascriptInterface
    fun isSoundEnabled(): Boolean {
        val prefs = context.getSharedPreferences("meditation_prefs", Context.MODE_PRIVATE)
        return prefs.getBoolean("timer_sound_enabled", true)
    }

    /**
     * Save sound preference
     */
    @JavascriptInterface
    fun setSoundEnabled(enabled: Boolean) {
        val prefs = context.getSharedPreferences("meditation_prefs", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("timer_sound_enabled", enabled).apply()
    }

    /**
     * Cleanup resources
     */
    fun destroy() {
        cancelMeditationTimer()
        mediaPlayer?.release()
        mediaPlayer = null
    }
}
```

#### Step 2: Setup WebView with JavaScript Interface

In your `MainActivity.kt`:

```kotlin
package com.yourapp

import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebSettings
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var meditationBridge: MeditationBridge

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)
        meditationBridge = MeditationBridge(this)

        // Enable JavaScript
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
        }

        // Add JavaScript interface
        webView.addJavascriptInterface(meditationBridge, "MeditationNative")

        // Load your app
        webView.loadUrl("https://yourapp.com")
    }

    override fun onDestroy() {
        super.onDestroy()
        meditationBridge.destroy()
    }
}
```

#### Step 3: Add Bell Sound Resource

1. Create a `res/raw/` directory if it doesn't exist
2. Add your bell sound file as `res/raw/bell.mp3` or `res/raw/bell.ogg`
3. You can use the same bell sound from your web app or record a new one

#### Step 4: Update AndroidManifest.xml

Add wake lock permission for keeping app awake:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Permission to keep CPU awake during meditation -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        ...>
        <activity
            android:name=".MainActivity"
            android:keepScreenOn="false"
            ...>
        </activity>
    </application>
</manifest>
```

---

### 2. iOS WebView Integration

#### Step 1: Create JavaScript Bridge Handler

Create a new file: `MeditationBridge.swift`

```swift
import Foundation
import WebKit
import AVFoundation

class MeditationBridge: NSObject, WKScriptMessageHandler {
    private var audioPlayer: AVAudioPlayer?
    private var meditationTimer: Timer?

    // Called when JavaScript sends a message
    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard let dict = message.body as? [String: Any] else { return }

        switch message.name {
        case "startMeditationTimer":
            if let duration = dict["duration"] as? Int {
                startMeditationTimer(durationSeconds: duration)
            }

        case "cancelMeditationTimer":
            cancelMeditationTimer()

        case "playBellSound":
            playBellSound()

        case "setSoundEnabled":
            if let enabled = dict["enabled"] as? Bool {
                setSoundEnabled(enabled: enabled)
            }

        default:
            break
        }
    }

    // Start meditation timer
    func startMeditationTimer(durationSeconds: Int) {
        print("Starting meditation timer for \(durationSeconds) seconds")

        // Cancel any existing timer
        cancelMeditationTimer()

        // Schedule timer
        let duration = TimeInterval(durationSeconds)
        meditationTimer = Timer.scheduledTimer(withTimeInterval: duration, repeats: false) { [weak self] _ in
            self?.playBellSound()
        }
    }

    // Cancel meditation timer
    func cancelMeditationTimer() {
        print("Cancelling meditation timer")
        meditationTimer?.invalidate()
        meditationTimer = nil
    }

    // Play bell sound
    func playBellSound() {
        print("Playing bell sound")

        guard isSoundEnabled() else {
            print("Sound is disabled")
            return
        }

        // Load bell sound from bundle
        guard let bellURL = Bundle.main.url(forResource: "bell", withExtension: "mp3") else {
            print("Bell sound file not found")
            return
        }

        do {
            // Configure audio session for playback
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)

            // Create and play audio
            audioPlayer = try AVAudioPlayer(contentsOf: bellURL)
            audioPlayer?.play()

        } catch {
            print("Error playing bell sound: \(error)")
        }
    }

    // Check if sound is enabled
    func isSoundEnabled() -> Bool {
        return UserDefaults.standard.bool(forKey: "timer_sound_enabled")
    }

    // Save sound preference
    func setSoundEnabled(enabled: Bool) {
        UserDefaults.standard.set(enabled, forKey: "timer_sound_enabled")
    }

    // Cleanup
    func destroy() {
        cancelMeditationTimer()
        audioPlayer?.stop()
        audioPlayer = nil
    }
}
```

#### Step 2: Setup WKWebView with Message Handler

In your `ViewController.swift`:

```swift
import UIKit
import WebKit

class ViewController: UIViewController {
    var webView: WKWebView!
    var meditationBridge: MeditationBridge!

    override func viewDidLoad() {
        super.viewDidLoad()

        // Create WKWebView configuration
        let configuration = WKWebViewConfiguration()

        // Create and add message handler
        meditationBridge = MeditationBridge()
        configuration.userContentController.add(meditationBridge, name: "startMeditationTimer")
        configuration.userContentController.add(meditationBridge, name: "cancelMeditationTimer")
        configuration.userContentController.add(meditationBridge, name: "playBellSound")
        configuration.userContentController.add(meditationBridge, name: "setSoundEnabled")

        // Create and configure webview
        webView = WKWebView(frame: view.bounds, configuration: configuration)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(webView)

        // Load your app
        if let url = URL(string: "https://yourapp.com") {
            webView.load(URLRequest(url: url))
        }
    }

    deinit {
        meditationBridge.destroy()
    }
}
```

#### Step 3: Add Bell Sound to Xcode Project

1. Add your `bell.mp3` file to your Xcode project
2. Make sure it's added to the target in "Build Phases" -> "Copy Bundle Resources"

#### Step 4: Update Info.plist

Add audio background mode capability:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>

<key>NSMicrophoneUsageDescription</key>
<string>We need audio permissions to play meditation bell sounds</string>
```

---

### 3. Web Layer Integration

#### Update MeditationTimer Component

Add this helper function to detect if running in WebView and use native bridge:

```typescript
// src/lib/nativeAudioBridge.ts

interface NativeBridge {
  startMeditationTimer?: (duration: number) => void;
  cancelMeditationTimer?: () => void;
  playBellSound?: () => void;
  setSoundEnabled?: (enabled: boolean) => void;
}

// Detect if running in native WebView
export const isNativeApp = (): boolean => {
  // Android WebView
  if (typeof (window as any).MeditationNative !== 'undefined') {
    return true;
  }

  // iOS WKWebView
  if (typeof (window as any).webkit?.messageHandlers?.startMeditationTimer !== 'undefined') {
    return true;
  }

  return false;
};

// Get native bridge interface
export const getNativeBridge = (): NativeBridge | null => {
  // Android WebView
  if (typeof (window as any).MeditationNative !== 'undefined') {
    return (window as any).MeditationNative;
  }

  // iOS WKWebView
  if (typeof (window as any).webkit?.messageHandlers !== 'undefined') {
    const handlers = (window as any).webkit.messageHandlers;
    return {
      startMeditationTimer: (duration: number) => {
        handlers.startMeditationTimer?.postMessage({ duration });
      },
      cancelMeditationTimer: () => {
        handlers.cancelMeditationTimer?.postMessage({});
      },
      playBellSound: () => {
        handlers.playBellSound?.postMessage({});
      },
      setSoundEnabled: (enabled: boolean) => {
        handlers.setSoundEnabled?.postMessage({ enabled });
      }
    };
  }

  return null;
};

// Start meditation timer (uses native if available, fallback to web)
export const startMeditationTimer = (durationSeconds: number): void => {
  const bridge = getNativeBridge();
  if (bridge?.startMeditationTimer) {
    console.log('Using native meditation timer');
    bridge.startMeditationTimer(durationSeconds);
  } else {
    console.log('Native bridge not available, using web timer');
  }
};

// Cancel meditation timer
export const cancelMeditationTimer = (): void => {
  const bridge = getNativeBridge();
  if (bridge?.cancelMeditationTimer) {
    bridge.cancelMeditationTimer();
  }
};

// Play bell sound (uses native if available, fallback to Web Audio API)
export const playMeditationBell = (): void => {
  const bridge = getNativeBridge();
  if (bridge?.playBellSound) {
    console.log('Playing native bell sound');
    bridge.playBellSound();
  } else {
    console.log('Native bridge not available, using Web Audio API');
    // Fall back to existing Web Audio API implementation
    import('./audioUtils').then(({ playBellSound }) => {
      playBellSound();
    });
  }
};
```

#### Update MeditationTimer.tsx

```typescript
import { startMeditationTimer, cancelMeditationTimer, playMeditationBell, isNativeApp } from '@/lib/nativeAudioBridge';

// In startTimer function:
const startTimer = useCallback(async () => {
  if (!isRunning) {
    const now = Date.now();

    // Start native timer if available (for background audio)
    if (isNativeApp()) {
      startMeditationTimer(total);
      console.log('Native timer started');
    } else {
      // Request wake lock for web version
      await requestWakeLock();
    }

    setIsRunning(true);
    // ... rest of timer logic
  }
}, [isRunning, total, requestWakeLock]);

// In pauseTimer function:
const pauseTimer = useCallback(async () => {
  if (isRunning && !isPaused) {
    // Cancel native timer
    if (isNativeApp()) {
      cancelMeditationTimer();
    } else {
      await releaseWakeLock();
    }
    // ... rest of pause logic
  }
}, [isRunning, isPaused, releaseWakeLock]);

// In completeSession function:
const completeSession = useCallback(() => {
  // Play bell sound (native or web)
  playMeditationBell();
  handleSessionEnd('completed');
}, [handleSessionEnd]);
```

---

## Testing

### Android Testing

1. **Test in Debug Mode:**
   ```bash
   # Enable WebView debugging
   adb shell settings put global debug_app com.yourapp

   # Open Chrome DevTools
   chrome://inspect/#devices
   ```

2. **Test Bell Sound:**
   - Start meditation timer
   - Lock screen
   - Wait for timer to complete
   - Bell should play even with screen off

3. **Test Pause/Resume:**
   - Pause timer, verify native timer cancels
   - Resume timer, verify native timer restarts

### iOS Testing

1. **Test in Simulator:**
   - Run app in Xcode
   - Check console logs for bridge messages

2. **Test on Device:**
   - Build and install on physical device
   - Test with screen locked
   - Verify audio plays in background

3. **Safari Web Inspector:**
   - Enable Web Inspector in iOS Settings
   - Connect device and inspect in Safari

---

## Benefits of Native Integration

✅ **Reliable Audio Playback**
- Bell plays even when screen is off
- Works in background/minimized state
- No JavaScript throttling issues

✅ **Better Battery Life**
- Screen can turn off during meditation
- Native timers use less CPU
- No need for Wake Lock API

✅ **Improved User Experience**
- More reliable notifications
- Native audio quality
- Better background handling

✅ **Platform Integration**
- Uses native audio session (iOS)
- Respects system audio settings
- Works with media controls

---

## Troubleshooting

### Android Issues

**Problem:** JavaScript interface not working
- **Solution:** Check `@JavascriptInterface` annotation is present
- **Solution:** Verify JavaScript is enabled in WebView settings

**Problem:** Audio not playing when screen is off
- **Solution:** Add WAKE_LOCK permission
- **Solution:** Use MediaPlayer instead of SoundPool

### iOS Issues

**Problem:** Message handlers not receiving messages
- **Solution:** Verify message handler names match exactly
- **Solution:** Check userContentController.add() was called

**Problem:** Audio stops when app goes to background
- **Solution:** Add 'audio' to UIBackgroundModes
- **Solution:** Configure AVAudioSession properly

---

## Next Steps

1. ✅ Implement native bridge in your WebView apps
2. ✅ Add bell sound files to both platforms
3. ✅ Update web code to use native bridge when available
4. ✅ Test thoroughly on both platforms
5. ✅ Deploy and monitor user feedback

---

## Resources

- [Android WebView JavaScript Interface](https://developer.android.com/develop/ui/views/layout/webapps/webview#BindingJavaScript)
- [iOS WKWebView Message Handlers](https://developer.apple.com/documentation/webkit/wkscriptmessagehandler)
- [Android MediaPlayer Guide](https://developer.android.com/guide/topics/media/mediaplayer)
- [iOS AVAudioPlayer Guide](https://developer.apple.com/documentation/avfoundation/avaudioplayer)
- [Background Audio iOS](https://developer.apple.com/documentation/avfoundation/media_playback/configuring_your_app_for_media_playback)

---

**Created:** 2025-01-17
**Version:** 1.0
**For:** Nirvanaya Meditation App WebView Integration
