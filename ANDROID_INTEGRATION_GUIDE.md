# Nirvanaya Android App Integration Guide

## Overview

This guide provides comprehensive documentation for building an Android application that integrates with the existing Nirvanaya Web meditation platform. The Android app will share the same Firebase backend, authentication system, and admin panel as the web application.

## Table of Contents

1. [Project Architecture](#project-architecture)
2. [Firebase Integration](#firebase-integration)
3. [Authentication System](#authentication-system)
4. [Data Structures & APIs](#data-structures--apis)
5. [Admin Panel Integration](#admin-panel-integration)
6. [Android Development Setup](#android-development-setup)
7. [Security Considerations](#security-considerations)
8. [Implementation Guidelines](#implementation-guidelines)
9. [Testing & Deployment](#testing--deployment)

---

## Project Architecture

### Shared Backend Architecture

```
┌─────────────────────────────────────────────────┐
│                    Firebase                      │
├─────────────────────────────────────────────────┤
│ • Authentication (Email/Password, Google)       │
│ • Firestore Database                            │
│ • Cloud Storage                                 │
│ • Cloud Functions (optional)                    │
└─────────────────────────────────────────────────┘
                    ▲
                    │
        ┌───────────┼───────────┐
        │           │           │
┌───────▼─────┐ ┌───▼─────┐ ┌───▼─────┐
│   Web App   │ │Android │ │  Admin   │
│ (Next.js)   │ │  App    │ │  Panel   │
└─────────────┘ └─────────┘ └─────────┘
```

### Firebase Project Configuration

**Project ID**: `nirvanaya-web`
**Region**: Default (us-central1)

**Firebase Services Used:**
- **Authentication**: Email/Password, Google Sign-In
- **Firestore**: Main database for all app data
- **Storage**: Audio files and user uploads
- **Functions**: Optional for complex operations

---

## Firebase Integration

### Firebase Configuration for Android

Add to `app/build.gradle`:

```gradle
dependencies {
    // Firebase BOM
    implementation platform('com.google.firebase:firebase-bom:33.1.0')

    // Firebase services
    implementation 'com.google.firebase:firebase-auth'
    implementation 'com.google.firebase:firebase-firestore'
    implementation 'com.google.firebase:firebase-storage'
    implementation 'com.google.firebase:firebase-analytics'
}
```

### Firebase Config (google-services.json)

The Firebase config is already established in the web app:

```json
{
  "project_info": {
    "project_number": "902030886680",
    "project_id": "nirvanaya-web",
    "storage_bucket": "nirvanaya-web.firebasestorage.app"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:902030886680:android:your_android_app_id"
      },
      "oauth_client": [...],
      "api_key": [...],
      "services": {...}
    }
  ],
  "configuration_version": "1"
}
```

**Important**: You'll need to add your Android app to the Firebase project and download the updated `google-services.json`.

---

## Authentication System

### Supported Authentication Methods

1. **Email/Password Authentication**
2. **Google Sign-In**
3. **Anonymous Authentication** (for guest users)

### User Roles & Permissions

```kotlin
enum class UserRole {
    OWNER,      // Super admin
    ADMIN,      // Content admin
    EDITOR,     // Content editor
    USER        // Regular user
}
```

### User Data Structure

```kotlin
data class User(
    val id: String = "",
    val email: String = "",
    val displayName: String = "",
    val photoURL: String? = null,
    val role: UserRole = UserRole.USER,
    val createdAt: Timestamp = Timestamp.now(),
    val lastLoginAt: Timestamp = Timestamp.now(),
    val preferences: UserPreferences = UserPreferences(),
    val isAnonymous: Boolean = false
)

data class UserPreferences(
    val theme: Theme = Theme.SYSTEM,
    val timeFormat: TimeFormat = TimeFormat.H12,
    val defaultMeditationType: String = "anapanasathi",
    val language: String = "en",
    val notifications: NotificationSettings = NotificationSettings()
)
```

### Authentication Flow Implementation

```kotlin
class AuthRepository(private val firebaseAuth: FirebaseAuth) {

    fun signInWithEmail(email: String, password: String): Flow<Resource<User>> = flow {
        try {
            emit(Resource.Loading())
            val result = firebaseAuth.signInWithEmailAndPassword(email, password).await()
            val user = result.user?.let { createUserFromFirebaseUser(it) }
            emit(Resource.Success(user))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Authentication failed"))
        }
    }

    fun signInWithGoogle(): Flow<Resource<User>> = flow {
        // Google Sign-In implementation
    }

    fun signInAnonymously(): Flow<Resource<User>> = flow {
        try {
            emit(Resource.Loading())
            val result = firebaseAuth.signInAnonymously().await()
            val user = result.user?.let { createUserFromFirebaseUser(it) }
            emit(Resource.Success(user))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Anonymous sign-in failed"))
        }
    }

    private suspend fun createUserFromFirebaseUser(firebaseUser: FirebaseUser): User {
        val firestore = Firebase.firestore
        val userDoc = firestore.collection("users").document(firebaseUser.uid).get().await()

        return if (userDoc.exists()) {
            userDoc.toObject(User::class.java)!!
        } else {
            // Create new user document
            val newUser = User(
                id = firebaseUser.uid,
                email = firebaseUser.email ?: "",
                displayName = firebaseUser.displayName ?: "",
                photoURL = firebaseUser.photoUrl?.toString(),
                role = UserRole.USER,
                isAnonymous = firebaseUser.isAnonymous
            )
            firestore.collection("users").document(firebaseUser.uid).set(newUser).await()
            newUser
        }
    }
}
```

---

## Data Structures & APIs

### Core Collections

#### 1. Users Collection
```kotlin
// Firestore path: /users/{userId}
data class User(
    val id: String,
    val email: String,
    val displayName: String,
    val photoURL: String?,
    val role: UserRole,
    val createdAt: Timestamp,
    val lastLoginAt: Timestamp,
    val preferences: UserPreferences,
    val isAnonymous: Boolean
)
```

#### 2. Meditation Sessions Collection
```kotlin
// Firestore path: /meditation_sessions/{sessionId}
data class MeditationSession(
    val id: String = "",
    val userId: String = "",
    val typeId: String = "",
    val typeName: String = "",
    val startTime: Timestamp = Timestamp.now(),
    val endTime: Timestamp? = null,
    val duration: Int = 0, // minutes
    val status: SessionStatus = SessionStatus.ACTIVE,
    val notes: String? = null,
    val rating: Int? = null, // 1-5
    val mood: Mood? = null,
    val distractions: List<String> = emptyList(),
    val insights: List<String> = emptyList(),
    val tags: List<String> = emptyList(),
    val createdAt: Timestamp = Timestamp.now(),
    val updatedAt: Timestamp = Timestamp.now()
)
```

#### 3. Kamatahan Audio Collection
```kotlin
// Firestore path: /kamatahan_audio/{audioId}
data class KamatahanAudio(
    val id: String = "",
    val title: String = "",
    val description: String = "",
    val category: AudioCategory = AudioCategory.MEDITATION,
    val duration: Long = 0, // seconds
    val durationFormatted: String = "",
    val fileUrl: String = "",
    val fileName: String = "",
    val fileSize: Long = 0,
    val fileType: String = "",
    val language: String = "en",
    val isPublic: Boolean = true,
    val status: ContentStatus = ContentStatus.ACTIVE,
    val uploadedBy: String = "",
    val createdAt: Timestamp = Timestamp.now(),
    val updatedAt: Timestamp = Timestamp.now()
)
```

#### 4. Dhamma Posts Collection
```kotlin
// Firestore path: /dhamma_posts/{postId}
data class DhammaPost(
    val id: String = "",
    val title: String = "",
    val content: String = "",
    val excerpt: String? = null,
    val featuredImage: String? = null,
    val category: DhammaCategory = DhammaCategory.MEDITATION,
    val tags: List<String> = emptyList(),
    val language: String = "en",
    val status: ContentStatus = ContentStatus.DRAFT,
    val featured: Boolean = false,
    val authorId: String = "",
    val authorName: String = "",
    val readTime: Int = 0,
    val viewCount: Int = 0,
    val createdAt: Timestamp = Timestamp.now(),
    val updatedAt: Timestamp = Timestamp.now(),
    val publishedAt: Timestamp? = null,
    val seoTitle: String? = null,
    val seoDescription: String? = null
)
```

#### 5. Admin Users Collection
```kotlin
// Firestore path: /admin_users/{adminId}
data class AdminUser(
    val id: String = "",
    val email: String = "",
    val displayName: String = "",
    val role: AdminRole = AdminRole.CONTENT_ADMIN,
    val permissions: List<AdminPermission> = emptyList(),
    val isActive: Boolean = true,
    val lastLogin: Timestamp? = null,
    val createdAt: Timestamp = Timestamp.now(),
    val updatedAt: Timestamp = Timestamp.now()
)
```

### Service Classes Implementation

#### MeditationService.kt
```kotlin
class MeditationService {
    private val firestore = Firebase.firestore
    private val auth = Firebase.auth

    suspend fun saveSession(session: MeditationSession): Result<String> {
        return try {
            val docRef = firestore.collection("meditation_sessions").add(session).await()
            Result.success(docRef.id)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getUserSessions(userId: String, limit: Int = 50): Result<List<MeditationSession>> {
        return try {
            val query = firestore.collection("meditation_sessions")
                .whereEqualTo("userId", userId)
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .limit(limit.toLong())
                .get()
                .await()

            val sessions = query.documents.mapNotNull { it.toObject<MeditationSession>() }
            Result.success(sessions)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getUserStats(userId: String): Result<UserStats> {
        return try {
            val sessions = getUserSessions(userId, 1000).getOrThrow()

            val stats = UserStats(
                totalSessions = sessions.size,
                totalMinutes = sessions.sumOf { it.duration },
                averageSessionLength = if (sessions.isNotEmpty()) sessions.sumOf { it.duration } / sessions.size else 0,
                favoriteType = sessions.groupBy { it.typeId }
                    .maxByOrNull { it.value.size }?.key ?: "",
                currentStreak = calculateCurrentStreak(sessions),
                longestStreak = calculateLongestStreak(sessions)
            )

            Result.success(stats)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun calculateCurrentStreak(sessions: List<MeditationSession>): Int {
        // Implementation for streak calculation
        // Similar logic to web app
        return 0
    }

    private fun calculateLongestStreak(sessions: List<MeditationSession>): Int {
        // Implementation for longest streak calculation
        return 0
    }
}
```

#### AudioService.kt
```kotlin
class AudioService {
    private val firestore = Firebase.firestore
    private val storage = Firebase.storage

    suspend fun getPublicAudioTracks(): Result<List<KamatahanAudio>> {
        return try {
            val query = firestore.collection("kamatahan_audio")
                .whereEqualTo("isPublic", true)
                .whereEqualTo("status", "active")
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .get()
                .await()

            val tracks = query.documents.mapNotNull { it.toObject<KamatahanAudio>() }
            Result.success(tracks)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getAudioTrack(trackId: String): Result<KamatahanAudio> {
        return try {
            val doc = firestore.collection("kamatahan_audio").document(trackId).get().await()
            val track = doc.toObject<KamatahanAudio>()
            if (track != null) {
                Result.success(track)
            } else {
                Result.failure(Exception("Track not found"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

#### DhammaService.kt
```kotlin
class DhammaService {
    private val firestore = Firebase.firestore

    suspend fun getPublishedPosts(): Result<List<DhammaPost>> {
        return try {
            val query = firestore.collection("dhamma_posts")
                .whereEqualTo("status", "published")
                .orderBy("publishedAt", Query.Direction.DESCENDING)
                .get()
                .await()

            val posts = query.documents.mapNotNull { it.toObject<DhammaPost>() }
            Result.success(posts)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getPostById(postId: String): Result<DhammaPost> {
        return try {
            val doc = firestore.collection("dhamma_posts").document(postId).get().await()
            val post = doc.toObject<DhammaPost>()
            if (post != null) {
                // Increment view count
                incrementViewCount(postId)
                Result.success(post)
            } else {
                Result.failure(Exception("Post not found"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private suspend fun incrementViewCount(postId: String) {
        try {
            val docRef = firestore.collection("dhamma_posts").document(postId)
            firestore.runTransaction { transaction ->
                val snapshot = transaction.get(docRef)
                val currentViews = snapshot.getLong("viewCount") ?: 0
                transaction.update(docRef, "viewCount", currentViews + 1)
            }.await()
        } catch (e: Exception) {
            // Don't throw error for view count updates
        }
    }
}
```

---

## Admin Panel Integration

### Admin Authentication

Admin users are stored in a separate collection (`/admin_users/{adminId}`) and have elevated permissions.

```kotlin
class AdminAuthRepository(private val firebaseAuth: FirebaseAuth) {

    suspend fun signInAsAdmin(email: String, password: String): Result<AdminUser> {
        return try {
            val result = firebaseAuth.signInWithEmailAndPassword(email, password).await()
            val userId = result.user?.uid ?: throw Exception("Authentication failed")

            // Check if user is admin
            val firestore = Firebase.firestore
            val adminDoc = firestore.collection("admin_users").document(userId).get().await()

            if (adminDoc.exists()) {
                val adminUser = adminDoc.toObject(AdminUser::class.java)
                if (adminUser?.isActive == true) {
                    Result.success(adminUser)
                } else {
                    Result.failure(Exception("Admin account is inactive"))
                }
            } else {
                Result.failure(Exception("Not an admin user"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

### Admin Permissions

```kotlin
enum class AdminPermission {
    AUDIO_CREATE, AUDIO_READ, AUDIO_UPDATE, AUDIO_DELETE,
    DHAMMA_CREATE, DHAMMA_READ, DHAMMA_UPDATE, DHAMMA_DELETE,
    USERS_READ, USERS_UPDATE, USERS_DELETE,
    ANALYTICS_READ, SETTINGS_UPDATE
}

enum class AdminRole {
    SUPER_ADMIN,    // All permissions
    CONTENT_ADMIN,  // Audio and Dhamma management
    MODERATOR       // Read-only access
}
```

### Content Management APIs

```kotlin
class AdminContentService {
    private val firestore = Firebase.firestore
    private val storage = Firebase.storage
    private val auth = Firebase.auth

    suspend fun uploadAudioTrack(
        title: String,
        description: String,
        category: AudioCategory,
        audioFile: Uri,
        language: String = "en"
    ): Result<String> {
        return try {
            val currentUser = auth.currentUser ?: throw Exception("Not authenticated")

            // Upload file to Storage
            val storageRef = storage.reference
            val fileName = "${System.currentTimeMillis()}_${audioFile.lastPathSegment}"
            val audioRef = storageRef.child("audio/$fileName")

            val uploadTask = audioRef.putFile(audioFile).await()
            val downloadUrl = uploadTask.storage.downloadUrl.await()

            // Create Firestore document
            val audioTrack = KamatahanAudio(
                title = title,
                description = description,
                category = category,
                fileUrl = downloadUrl.toString(),
                fileName = fileName,
                language = language,
                uploadedBy = currentUser.uid
            )

            val docRef = firestore.collection("kamatahan_audio").add(audioTrack).await()
            Result.success(docRef.id)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createDhammaPost(post: DhammaPostFormData): Result<String> {
        return try {
            val currentUser = auth.currentUser ?: throw Exception("Not authenticated")

            // Get admin user details
            val adminDoc = firestore.collection("admin_users").document(currentUser.uid).get().await()
            val adminUser = adminDoc.toObject(AdminUser::class.java) ?: throw Exception("Admin not found")

            val newPost = DhammaPost(
                title = post.title,
                content = post.content,
                excerpt = post.excerpt,
                featuredImage = post.featuredImage,
                category = post.category,
                tags = post.tags,
                language = post.language,
                status = post.status,
                featured = post.featured,
                authorId = currentUser.uid,
                authorName = adminUser.displayName,
                seoTitle = post.seoTitle,
                seoDescription = post.seoDescription
            )

            val docRef = firestore.collection("dhamma_posts").add(newPost).await()
            Result.success(docRef.id)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

---

## Android Development Setup

### Project Structure

```
app/src/main/java/com/nirvanaya/meditation/
├── data/
│   ├── models/           # Data classes
│   ├── repositories/     # Data access layer
│   ├── services/         # Firebase services
│   └── local/            # Local storage (Room/SharedPreferences)
├── ui/
│   ├── auth/             # Authentication screens
│   ├── meditation/       # Meditation timer & sessions
│   ├── audio/            # Audio player & library
│   ├── dhamma/           # Dhamma content
│   ├── dashboard/        # User dashboard
│   ├── admin/            # Admin panel
│   └── components/       # Reusable UI components
├── di/                   # Dependency injection (Hilt)
├── utils/                # Utilities and helpers
└── MainActivity.kt
```

### Dependencies (build.gradle)

```gradle
dependencies {
    // Core Android
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'

    // Architecture Components
    implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0'
    implementation 'androidx.lifecycle:lifecycle-livedata-ktx:2.7.0'
    implementation 'androidx.activity:activity-ktx:1.8.2'
    implementation 'androidx.fragment:fragment-ktx:1.6.2'

    // Firebase
    implementation platform('com.google.firebase:firebase-bom:33.1.0')
    implementation 'com.google.firebase:firebase-auth'
    implementation 'com.google.firebase:firebase-firestore'
    implementation 'com.google.firebase:firebase-storage'
    implementation 'com.google.firebase:firebase-analytics'

    // Google Sign-In
    implementation 'com.google.android.gms:play-services-auth:20.7.0'

    // Dependency Injection
    implementation 'com.google.dagger:hilt-android:2.48'
    kapt 'com.google.dagger:hilt-compiler:2.48'

    // Networking
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'

    // Async
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.7.3'

    // Media
    implementation 'androidx.media3:media3-exoplayer:1.3.1'
    implementation 'androidx.media3:media3-ui:1.3.1'

    // Image Loading
    implementation 'com.github.bumptech.glide:glide:4.16.0'
    kapt 'com.github.bumptech.glide:compiler:4.16.0'

    // Room database
    implementation 'androidx.room:room-runtime:2.6.1'
    implementation 'androidx.room:room-ktx:2.6.1'
    kapt 'androidx.room:room-compiler:2.6.1'

    // View Binding
    implementation 'androidx.viewbinding:viewbinding:8.2.2'

    // Work Manager (for background tasks)
    implementation 'androidx.work:work-runtime-ktx:2.9.0'
}
```

### Application Class

```kotlin
@HiltAndroidApp
class NirvanayaApplication : Application() {

    override fun onCreate() {
        super.onCreate()

        // Initialize Firebase
        FirebaseApp.initializeApp(this)

        // Enable Firestore offline persistence
        val firestore = Firebase.firestore
        val settings = FirebaseFirestoreSettings.Builder()
            .setPersistenceEnabled(true)
            .build()
        firestore.firestoreSettings = settings
    }
}
```

### Hilt Dependency Injection

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object FirebaseModule {

    @Provides
    @Singleton
    fun provideFirebaseAuth(): FirebaseAuth = Firebase.auth

    @Provides
    @Singleton
    fun provideFirebaseFirestore(): FirebaseFirestore = Firebase.firestore

    @Provides
    @Singleton
    fun provideFirebaseStorage(): FirebaseStorage = Firebase.storage
}

@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {

    @Provides
    @Singleton
    fun provideAuthRepository(
        auth: FirebaseAuth,
        firestore: FirebaseFirestore
    ): AuthRepository = AuthRepository(auth, firestore)

    @Provides
    @Singleton
    fun provideMeditationService(
        firestore: FirebaseFirestore,
        auth: FirebaseAuth
    ): MeditationService = MeditationService(firestore, auth)
}
```

---

## Security Considerations

### Firestore Security Rules

The Android app must respect the same security rules as the web app:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Users can read/write their own meditation sessions
    match /meditation_sessions/{sessionId} {
      allow read: if request.auth.uid != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid != null && request.auth.uid == request.resource.data.userId;
      allow update: if request.auth.uid != null && request.auth.uid == resource.data.userId;
      allow delete: if request.auth.uid != null && request.auth.uid == resource.data.userId;
    }

    // Admin users collection - secure access
    match /admin_users/{adminId} {
      allow read, write: if request.auth.uid != null && request.auth.uid == adminId;
    }

    // Kamatahan audio collection - admins can manage, users can read public files
    match /kamatahan_audio/{audioId} {
      allow read: if true; // Anyone can read audio metadata
      allow write: if request.auth.uid != null && 
                   exists(/databases/$(database)/documents/admin_users/$(request.auth.uid));
    }

    // Dhamma posts collection - admins can manage, users can read published posts
    match /dhamma_posts/{postId} {
      allow read: if true; // Anyone can read post metadata
      allow write: if request.auth.uid != null && 
                   exists(/databases/$(database)/documents/admin_users/$(request.auth.uid));
    }
  }
}
```

### Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Audio files - only admins can upload/delete, users can read public files
    match /audio/{audioFile} {
      allow read: if true; // Anyone can read audio files
      allow write: if request.auth != null; // Only authenticated users can write (admins)
    }

    // Default rule - deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### Android Security Best Practices

1. **Certificate Pinning**: Implement SSL certificate pinning for Firebase requests
2. **ProGuard/R8**: Enable code obfuscation for release builds
3. **API Keys**: Keep Firebase config secure (it's public by design but monitor usage)
4. **Authentication State**: Properly handle authentication state changes
5. **Data Validation**: Validate all data before sending to Firestore
6. **Offline Security**: Handle offline data securely with local encryption if needed

---

## Implementation Guidelines

### State Management

Use ViewModels with LiveData/Flow for reactive state management:

```kotlin
class MeditationViewModel @ViewModelInject constructor(
    private val meditationService: MeditationService,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _meditationState = MutableLiveData<MeditationState>()
    val meditationState: LiveData<MeditationState> = _meditationState

    fun startMeditation(typeId: String, duration: Int) {
        viewModelScope.launch {
            _meditationState.value = MeditationState.Loading

            try {
                val currentUser = authRepository.getCurrentUser()
                if (currentUser != null) {
                    val session = MeditationSession(
                        userId = currentUser.id,
                        typeId = typeId,
                        duration = duration,
                        status = SessionStatus.ACTIVE
                    )

                    val result = meditationService.saveSession(session)
                    result.fold(
                        onSuccess = { sessionId ->
                            _meditationState.value = MeditationState.Active(sessionId)
                        },
                        onFailure = { error ->
                            _meditationState.value = MeditationState.Error(error.message ?: "Failed to start session")
                        }
                    )
                } else {
                    _meditationState.value = MeditationState.Error("User not authenticated")
                }
            } catch (e: Exception) {
                _meditationState.value = MeditationState.Error(e.message ?: "Unknown error")
            }
        }
    }
}
```

### Error Handling

Implement comprehensive error handling:

```kotlin
sealed class Resource<T>(
    val data: T? = null,
    val message: String? = null
) {
    class Success<T>(data: T) : Resource<T>(data)
    class Error<T>(message: String, data: T? = null) : Resource<T>(data, message)
    class Loading<T>(data: T? = null) : Resource<T>(data)
}
```

### Offline Support

Implement offline-first architecture using Firestore's offline capabilities:

```kotlin
class OfflineManager(private val context: Context) {

    fun enableOfflinePersistence() {
        val firestore = Firebase.firestore
        val settings = FirebaseFirestoreSettings.Builder()
            .setPersistenceEnabled(true)
            .setCacheSizeBytes(FirebaseFirestoreSettings.CACHE_SIZE_UNLIMITED)
            .build()
        firestore.firestoreSettings = settings
    }

    fun syncPendingData() {
        // Implement sync logic for pending operations
    }

    fun getConnectionStatus(): Flow<NetworkStatus> {
        // Monitor network connectivity
    }
}
```

### Audio Playback

Implement audio playback using ExoPlayer:

```kotlin
class AudioPlayerManager @Inject constructor(
    private val context: Context
) {
    private var exoPlayer: ExoPlayer? = null

    fun initialize() {
        exoPlayer = ExoPlayer.Builder(context).build()
    }

    fun playAudio(url: String) {
        val mediaItem = MediaItem.fromUri(url)
        exoPlayer?.setMediaItem(mediaItem)
        exoPlayer?.prepare()
        exoPlayer?.play()
    }

    fun pause() {
        exoPlayer?.pause()
    }

    fun stop() {
        exoPlayer?.stop()
    }

    fun release() {
        exoPlayer?.release()
        exoPlayer = null
    }

    fun getCurrentPosition(): Long {
        return exoPlayer?.currentPosition ?: 0
    }

    fun seekTo(position: Long) {
        exoPlayer?.seekTo(position)
    }
}
```

---

## Testing & Deployment

### Testing Strategy

1. **Unit Tests**: Test business logic and services
2. **Integration Tests**: Test Firebase interactions
3. **UI Tests**: Test user interface components
4. **End-to-End Tests**: Test complete user flows

### Firebase Test Lab

Use Firebase Test Lab for automated testing on real devices:

```kotlin
// Example instrumented test
@RunWith(AndroidJUnit4::class)
class MeditationServiceTest {

    @get:Rule
    val instantTaskExecutorRule = InstantTaskExecutorRule()

    @Mock
    private lateinit var mockFirestore: FirebaseFirestore

    @Mock
    private lateinit var mockAuth: FirebaseAuth

    private lateinit var meditationService: MeditationService

    @Before
    fun setup() {
        MockitoAnnotations.openMocks(this)
        meditationService = MeditationService(mockFirestore, mockAuth)
    }

    @Test
    fun saveSession_shouldReturnSuccess() = runBlocking {
        // Test implementation
    }
}
```

### Deployment

1. **Google Play Store**: Prepare for release
2. **Firebase App Distribution**: Distribute beta versions
3. **CI/CD**: Set up automated builds and deployments

### Build Configuration

```gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            buildConfigField "String", "FIREBASE_PROJECT_ID", "\"nirvanaya-web\""
            buildConfigField "String", "API_BASE_URL", "\"https://your-api-endpoint.com\""
        }
        debug {
            buildConfigField "String", "FIREBASE_PROJECT_ID", "\"nirvanaya-web\""
            buildConfigField "String", "API_BASE_URL", "\"https://dev-api-endpoint.com\""
        }
    }
}
```

---

## Quick Start Checklist

- [ ] Set up Firebase project and add Android app
- [ ] Configure authentication (Email/Password + Google)
- [ ] Implement user authentication flow
- [ ] Create data models matching web app
- [ ] Implement MeditationService for session management
- [ ] Implement AudioService for Kamatahan content
- [ ] Implement DhammaService for teachings
- [ ] Create admin authentication and content management
- [ ] Implement offline support
- [ ] Add comprehensive error handling
- [ ] Implement audio playback with ExoPlayer
- [ ] Create responsive UI following web app design
- [ ] Test all Firebase interactions
- [ ] Set up CI/CD pipeline
- [ ] Prepare for Play Store deployment

---

## Support & Resources

### Key Firebase Documentation
- [Firebase Android SDK](https://firebase.google.com/docs/android/setup)
- [Firestore Android Guide](https://firebase.google.com/docs/firestore/android/get-started)
- [Firebase Auth Android](https://firebase.google.com/docs/auth/android/start)

### Android Development Resources
- [Android Developer Guides](https://developer.android.com/guide)
- [Material Design Guidelines](https://material.io/design)
- [Kotlin Documentation](https://kotlinlang.org/docs/)

### Nirvanaya Web App Reference
- Review the web app's service classes in `src/lib/`
- Check data types in `src/types/`
- Study Firebase security rules
- Review authentication flows

---

**Note**: This documentation is based on the existing Nirvanaya web application architecture. Ensure all implementations maintain compatibility with the shared Firebase backend and follow the established security rules and data structures.

For any questions or clarifications, refer to the web app's codebase and Firebase project configuration.


