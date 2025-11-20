# Android Native Bridge Implementation Guide

This guide provides step-by-step instructions for implementing the meditation timer native bridge in your Android WebView app.

## Overview

The web app now communicates with Android native code to:
- Show persistent notifications during meditation
- Play bell sound when meditation completes
- Keep meditation running in background
- Update notification with remaining time

## Prerequisites

- Android Studio
- Minimum SDK: 26 (Android 8.0)
- Target SDK: 34+
- Kotlin or Java

---

## Step 1: Create the JavaScript Bridge Interface

Create a new file: `app/src/main/java/com/yourapp/meditation/MeditationBridge.kt`

```kotlin
package com.yourapp.meditation

import android.content.Context
import android.webkit.JavascriptInterface
import android.util.Log

class MeditationBridge(
    private val context: Context,
    private val meditationService: MeditationService
) {
    companion object {
        private const val TAG = "MeditationBridge"
    }

    /**
     * Called from JavaScript when meditation starts
     * @param durationMinutes Duration in minutes
     * @param typeName Name of meditation type
     * @param typeId ID of meditation type
     */
    @JavascriptInterface
    fun onMeditationStart(durationMinutes: Int, typeName: String, typeId: String) {
        Log.d(TAG, "Meditation started: $durationMinutes min, type: $typeName")

        // Start foreground service with notification
        meditationService.startMeditation(
            durationMinutes = durationMinutes,
            typeName = typeName,
            typeId = typeId
        )
    }

    /**
     * Called from JavaScript when meditation completes
     * @param durationMinutes Duration completed in minutes
     * @param typeName Name of meditation type
     * @param typeId ID of meditation type
     */
    @JavascriptInterface
    fun onMeditationComplete(durationMinutes: Int, typeName: String, typeId: String) {
        Log.d(TAG, "Meditation completed: $durationMinutes min, type: $typeName")

        // Play completion sound
        meditationService.playCompletionSound()

        // Show completion notification
        meditationService.showCompletionNotification(typeName, durationMinutes)

        // Stop foreground service
        meditationService.stopMeditation()
    }

    /**
     * Called from JavaScript when meditation is paused
     * @param elapsedSeconds Time elapsed in seconds
     * @param remainingSeconds Time remaining in seconds
     */
    @JavascriptInterface
    fun onMeditationPause(elapsedSeconds: Int, remainingSeconds: Int) {
        Log.d(TAG, "Meditation paused: elapsed=$elapsedSeconds, remaining=$remainingSeconds")

        meditationService.pauseMeditation(elapsedSeconds, remainingSeconds)
    }

    /**
     * Called from JavaScript when meditation is resumed
     * @param remainingSeconds Time remaining in seconds
     */
    @JavascriptInterface
    fun onMeditationResume(remainingSeconds: Int) {
        Log.d(TAG, "Meditation resumed: remaining=$remainingSeconds")

        meditationService.resumeMeditation(remainingSeconds)
    }

    /**
     * Called from JavaScript when meditation is stopped/cancelled
     * @param elapsedSeconds Time elapsed before stopping
     */
    @JavascriptInterface
    fun onMeditationStop(elapsedSeconds: Int) {
        Log.d(TAG, "Meditation stopped: elapsed=$elapsedSeconds")

        meditationService.stopMeditation()
    }
}
```

---

## Step 2: Create the Meditation Foreground Service

Create: `app/src/main/java/com/yourapp/meditation/MeditationService.kt`

```kotlin
package com.yourapp.meditation

import android.app.*
import android.content.Context
import android.content.Intent
import android.media.MediaPlayer
import android.os.Build
import android.os.CountDownTimer
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.yourapp.R
import com.yourapp.MainActivity

class MeditationService : Service() {
    companion object {
        private const val TAG = "MeditationService"
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "meditation_channel"
        private const val CHANNEL_NAME = "Meditation Timer"

        // Actions
        const val ACTION_START = "com.yourapp.meditation.START"
        const val ACTION_STOP = "com.yourapp.meditation.STOP"
        const val ACTION_PAUSE = "com.yourapp.meditation.PAUSE"
        const val ACTION_RESUME = "com.yourapp.meditation.RESUME"
    }

    private var countDownTimer: CountDownTimer? = null
    private var mediaPlayer: MediaPlayer? = null
    private var remainingSeconds = 0
    private var isPaused = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    fun startMeditation(durationMinutes: Int, typeName: String, typeId: String) {
        remainingSeconds = durationMinutes * 60

        // Start as foreground service
        val notification = buildNotification(
            title = "Meditation in Progress",
            content = "$typeName - ${formatTime(remainingSeconds)} remaining",
            ongoing = true
        )
        startForeground(NOTIFICATION_ID, notification)

        // Start countdown timer
        startTimer()
    }

    fun pauseMeditation(elapsedSeconds: Int, remainingSec: Int) {
        isPaused = true
        remainingSeconds = remainingSec
        countDownTimer?.cancel()

        // Update notification
        updateNotification(
            title = "Meditation Paused",
            content = "${formatTime(remainingSeconds)} remaining",
            ongoing = true
        )
    }

    fun resumeMeditation(remainingSec: Int) {
        isPaused = false
        remainingSeconds = remainingSec
        startTimer()

        // Update notification
        updateNotification(
            title = "Meditation in Progress",
            content = "${formatTime(remainingSeconds)} remaining",
            ongoing = true
        )
    }

    fun stopMeditation() {
        countDownTimer?.cancel()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    fun playCompletionSound() {
        try {
            // Play bell sound from assets or raw resources
            mediaPlayer = MediaPlayer.create(this, R.raw.bell_sound)
            mediaPlayer?.setOnCompletionListener {
                it.release()
                mediaPlayer = null
            }
            mediaPlayer?.start()
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error playing completion sound", e)
        }
    }

    fun showCompletionNotification(typeName: String, durationMinutes: Int) {
        val notification = buildNotification(
            title = "Meditation Complete! 🧘",
            content = "You completed $durationMinutes minutes of $typeName",
            ongoing = false,
            priority = NotificationCompat.PRIORITY_HIGH
        )

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID + 1, notification)
    }

    private fun startTimer() {
        countDownTimer = object : CountDownTimer((remainingSeconds * 1000).toLong(), 1000) {
            override fun onTick(millisUntilFinished: Long) {
                remainingSeconds = (millisUntilFinished / 1000).toInt()

                // Update notification every 60 seconds (to save battery)
                if (remainingSeconds % 60 == 0) {
                    updateNotification(
                        title = "Meditation in Progress",
                        content = "${formatTime(remainingSeconds)} remaining",
                        ongoing = true
                    )
                }
            }

            override fun onFinish() {
                // Timer completed - notification will be handled by JavaScript callback
                stopMeditation()
            }
        }.start()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW // Low importance for ongoing notification
            ).apply {
                description = "Meditation timer notifications"
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }

            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(
        title: String,
        content: String,
        ongoing: Boolean,
        priority: Int = NotificationCompat.PRIORITY_LOW
    ): Notification {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(R.drawable.ic_meditation) // Add your meditation icon
            .setContentIntent(pendingIntent)
            .setOngoing(ongoing)
            .setPriority(priority)
            .setAutoCancel(!ongoing)
            .build()
    }

    private fun updateNotification(title: String, content: String, ongoing: Boolean) {
        val notification = buildNotification(title, content, ongoing)
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    private fun formatTime(seconds: Int): String {
        val minutes = seconds / 60
        val secs = seconds % 60
        return String.format("%d:%02d", minutes, secs)
    }

    override fun onDestroy() {
        super.onDestroy()
        countDownTimer?.cancel()
        mediaPlayer?.release()
    }
}
```

---

## Step 3: Update MainActivity to Inject Bridge

Update your `MainActivity.kt`:

```kotlin
package com.yourapp

import android.os.Bundle
import android.webkit.WebView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var meditationService: MeditationService
    private lateinit var meditationBridge: MeditationBridge

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize meditation service
        meditationService = MeditationService()
        meditationBridge = MeditationBridge(this, meditationService)

        // Setup WebView
        webView = findViewById(R.id.webView)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
        }

        // IMPORTANT: Inject JavaScript bridge
        webView.addJavascriptInterface(meditationBridge, "Android")

        // Load your web app
        webView.loadUrl("https://your-meditation-app-url.com")
    }
}
```

---

## Step 4: Add Required Permissions

Update `AndroidManifest.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:name=".MeditationApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/Theme.YourApp">

        <!-- Main Activity -->
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Meditation Foreground Service -->
        <service
            android:name=".meditation.MeditationService"
            android:foregroundServiceType="mediaPlayback"
            android:exported="false" />
    </application>
</manifest>
```

---

## Step 5: Add Bell Sound Resource

1. Create `app/src/main/res/raw/` directory (if it doesn't exist)
2. Add your bell sound file: `bell_sound.mp3` or `bell_sound.wav`
3. Make sure it's a short, pleasant bell sound (recommended: 2-5 seconds)

---

## Step 6: Add Meditation Icon

1. Add meditation icon to `res/drawable/ic_meditation.xml` (vector drawable) or `res/mipmap/`
2. Use a simple meditation icon (lotus, person meditating, etc.)

Example vector drawable (`res/drawable/ic_meditation.xml`):

```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FF000000"
        android:pathData="M12,2c1.1,0 2,0.9 2,2s-0.9,2 -2,2 -2,-0.9 -2,-2 0.9,-2 2,-2zM21,9h-6v13h-2v-6h-2v6L9,22L9,9L3,9L3,7h18v2z"/>
</vector>
```

---

## Step 7: Request Notification Permission (Android 13+)

For Android 13 (API 33) and above, request notification permission at runtime:

Add to `MainActivity.kt`:

```kotlin
import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {
    private val NOTIFICATION_PERMISSION_CODE = 100

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Request notification permission for Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                    NOTIFICATION_PERMISSION_CODE
                )
            }
        }

        // ... rest of onCreate code
    }
}
```

---

## Testing

### Test in Chrome DevTools (Desktop):
1. Open Chrome DevTools
2. Go to Console
3. Type: `window.Android.onMeditationStart(5, "Test", "test-id")`
4. Should see log in Android Studio

### Test on Device:
1. Build and install app on device
2. Navigate to meditation timer in web app
3. Start a 1-minute meditation
4. Verify:
   - ✅ Notification appears
   - ✅ Notification updates countdown
   - ✅ Bell sound plays when complete
   - ✅ Completion notification appears
   - ✅ Works when app is backgrounded

---

## Troubleshooting

### Bridge not working:
- Check `webView.addJavascriptInterface(meditationBridge, "Android")` is called
- Verify JavaScript is enabled in WebView settings
- Check logs: `adb logcat | grep Meditation`

### Notification not showing:
- Request POST_NOTIFICATIONS permission (Android 13+)
- Check notification channel is created
- Verify service is started with `startForeground()`

### Bell sound not playing:
- Check file exists in `res/raw/bell_sound.mp3`
- Verify file format (MP3 or WAV recommended)
- Check audio focus/volume settings

### Service stops in background:
- Use `startForeground()` with persistent notification
- Add foreground service type in manifest
- Consider using WorkManager for longer sessions

---

## Performance Optimization

1. **Battery Efficiency**: Update notification every 60 seconds, not every second
2. **Wake Lock**: System handles wake lock via WebView
3. **Sound Pre-loading**: Pre-load MediaPlayer when service starts
4. **Notification Throttling**: Only update notification on significant changes

---

## Claude AI Prompts for Implementation

If you're using Claude AI to help implement this, use these prompts:

```
"Implement the MeditationBridge.kt file exactly as specified in the Android guide,
using Kotlin and following Android best practices."

"Create the MeditationService.kt foreground service with countdown timer,
notification updates, and bell sound playback."

"Update MainActivity.kt to inject the JavaScript bridge into the WebView
and handle notification permissions for Android 13+."

"Add the required permissions and service declaration to AndroidManifest.xml
as specified in the guide."
```

---

## Next Steps

After implementing:
1. ✅ Test all meditation timer events (start, pause, resume, stop, complete)
2. ✅ Test background behavior (home button, app switcher)
3. ✅ Test notification interactions
4. ✅ Test bell sound playback
5. ✅ Test on multiple Android versions (8.0+)
6. ✅ Add analytics/error tracking

---

## Additional Resources

- [Android Foreground Services](https://developer.android.com/develop/background-work/services/foreground-services)
- [WebView JavaScript Bridge](https://developer.android.com/develop/ui/views/layout/webapps/webview#BindingJavaScript)
- [Android Notifications](https://developer.android.com/develop/ui/views/notifications)
- [MediaPlayer Guide](https://developer.android.com/media/platform/mediaplayer)
