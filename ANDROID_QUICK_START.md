# Nirvanaya Android App - Quick Start Guide

## Firebase Configuration

### 1. Add Android App to Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project "nirvanaya-web"
3. Click "Add app" → Android
4. Package name: `com.nirvanaya.meditation`
5. Download `google-services.json` and place in `app/` directory

### 2. Firebase Config Values

```kotlin
// app/build.gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.1'
    }
}

// app/build.gradle (dependencies)
dependencies {
    implementation platform('com.google.firebase:firebase-bom:33.1.0')
    implementation 'com.google.firebase:firebase-auth'
    implementation 'com.google.firebase:firebase-firestore'
    implementation 'com.google.firebase:firebase-storage'
    implementation 'com.google.android.gms:play-services-auth:20.7.0'
}

apply plugin: 'com.google.gms.google-services'
```

## Core Data Models

### User Model
```kotlin
data class User(
    val id: String = "",
    val email: String = "",
    val displayName: String = "",
    val role: UserRole = UserRole.USER,
    val preferences: UserPreferences = UserPreferences(),
    val isAnonymous: Boolean = false
)

enum class UserRole { OWNER, ADMIN, EDITOR, USER }
```

### Meditation Session Model
```kotlin
data class MeditationSession(
    val id: String = "",
    val userId: String = "",
    val typeId: String = "",
    val typeName: String = "",
    val startTime: Timestamp = Timestamp.now(),
    val duration: Int = 0,
    val status: SessionStatus = SessionStatus.ACTIVE,
    val notes: String? = null,
    val rating: Int? = null
)

enum class SessionStatus { ACTIVE, PAUSED, COMPLETED, ABANDONED }
```

### Audio Track Model
```kotlin
data class KamatahanAudio(
    val id: String = "",
    val title: String = "",
    val description: String = "",
    val category: String = "meditation",
    val duration: Long = 0,
    val fileUrl: String = "",
    val language: String = "en",
    val isPublic: Boolean = true
)
```

### Dhamma Post Model
```kotlin
data class DhammaPost(
    val id: String = "",
    val title: String = "",
    val content: String = "",
    val category: String = "meditation",
    val tags: List<String> = emptyList(),
    val language: String = "en",
    val status: String = "published",
    val authorName: String = "",
    val viewCount: Int = 0
)
```

## Authentication Setup

### Auth Repository
```kotlin
class AuthRepository(private val firebaseAuth: FirebaseAuth) {

    fun signInWithEmail(email: String, password: String): Flow<Resource<User>> = flow {
        try {
            emit(Resource.Loading())
            val result = firebaseAuth.signInWithEmailAndPassword(email, password).await()

            // Get user data from Firestore
            val user = createUserFromFirebaseUser(result.user!!)
            emit(Resource.Success(user))
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Authentication failed"))
        }
    }

    private suspend fun createUserFromFirebaseUser(firebaseUser: FirebaseUser): User {
        val firestore = Firebase.firestore
        val userDoc = firestore.collection("users").document(firebaseUser.uid).get().await()

        return if (userDoc.exists()) {
            userDoc.toObject(User::class.java)!!
        } else {
            // Create new user
            val newUser = User(
                id = firebaseUser.uid,
                email = firebaseUser.email ?: "",
                displayName = firebaseUser.displayName ?: "",
                isAnonymous = firebaseUser.isAnonymous
            )
            firestore.collection("users").document(firebaseUser.uid).set(newUser).await()
            newUser
        }
    }

    fun getCurrentUser(): User? {
        val firebaseUser = firebaseAuth.currentUser
        return firebaseUser?.let {
            // Return cached user or fetch from Firestore
            null // Implement caching
        }
    }
}
```

## Service Classes

### MeditationService
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

    suspend fun getUserSessions(userId: String): Result<List<MeditationSession>> {
        return try {
            val query = firestore.collection("meditation_sessions")
                .whereEqualTo("userId", userId)
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .get()
                .await()

            val sessions = query.documents.mapNotNull { it.toObject<MeditationSession>() }
            Result.success(sessions)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

### AudioService
```kotlin
class AudioService {
    private val firestore = Firebase.firestore

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
}
```

### DhammaService
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
}
```

## Admin Integration

### Admin Authentication
```kotlin
class AdminAuthRepository {
    private val firestore = Firebase.firestore
    private val auth = Firebase.auth

    suspend fun signInAsAdmin(email: String, password: String): Result<AdminUser> {
        return try {
            val result = auth.signInWithEmailAndPassword(email, password).await()
            val userId = result.user?.uid ?: throw Exception("Authentication failed")

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

### Admin Content Management
```kotlin
class AdminContentService {
    private val firestore = Firebase.firestore
    private val storage = Firebase.storage
    private val auth = Firebase.auth

    suspend fun uploadAudioTrack(
        title: String,
        description: String,
        category: String,
        audioFile: Uri
    ): Result<String> {
        return try {
            val currentUser = auth.currentUser ?: throw Exception("Not authenticated")

            // Upload to Storage
            val storageRef = storage.reference
            val fileName = "${System.currentTimeMillis()}_${UUID.randomUUID()}"
            val audioRef = storageRef.child("audio/$fileName")

            val uploadTask = audioRef.putFile(audioFile).await()
            val downloadUrl = uploadTask.storage.downloadUrl.await()

            // Save to Firestore
            val audioTrack = KamatahanAudio(
                title = title,
                description = description,
                category = category,
                fileUrl = downloadUrl.toString(),
                fileName = fileName
            )

            val docRef = firestore.collection("kamatahan_audio").add(audioTrack).await()
            Result.success(docRef.id)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

## Key Integration Points

### 1. Firebase Project ID
- Use existing project: `nirvanaya-web`
- All data will be shared between web and Android apps

### 2. Shared Collections
- `users` - User profiles
- `meditation_sessions` - Session data
- `kamatahan_audio` - Audio content
- `dhamma_posts` - Dhamma teachings
- `admin_users` - Admin accounts

### 3. Security Rules
- Users can only access their own data
- Public content (audio/posts) is readable by all
- Admin operations require admin authentication
- Content creation restricted to admins

### 4. Data Synchronization
- Firestore handles real-time sync
- Enable offline persistence for better UX
- Handle network state changes gracefully

## Next Steps

1. **Set up Android project** with Firebase
2. **Implement authentication** (email/password + Google)
3. **Create data models** matching the web app
4. **Build core services** (Meditation, Audio, Dhamma)
5. **Implement admin panel** for content management
6. **Add offline support** and error handling
7. **Test thoroughly** with existing web app data
8. **Deploy to Play Store**

## Testing with Web App

1. Create test user on web app
2. Add meditation sessions via web
3. Verify data appears in Android app
4. Test admin content creation
5. Ensure real-time sync works

## Support

- Refer to web app code in `src/lib/` for service implementations
- Check `src/types/` for complete data structures
- Review Firebase security rules in project files
- Test all operations match web app behavior


