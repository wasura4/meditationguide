# Firestore Security Rules (Copy-Paste)

Copy the full block below into Firebase Console → Firestore Database → Rules and click Publish.

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null }
    function isAdmin() {
      return isSignedIn() &&
        exists(/databases/$(database)/documents/admin_users/$(request.auth.uid));
    }

    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Meditation sessions (owner only)
    match /meditation_sessions/{sessionId} {
      allow read: if isSignedIn() && request.auth.uid == resource.data.userId;
      allow create: if isSignedIn() && request.auth.uid == request.resource.data.userId;
      allow update: if isSignedIn() && request.auth.uid == resource.data.userId;
      allow delete: if isSignedIn() && request.auth.uid == resource.data.userId;
    }

    // Admin users
    match /admin_users/{adminId} {
      allow read: if isSignedIn() && request.auth.uid == adminId;
      allow write: if isSignedIn() && request.auth.uid == adminId;
    }

    // Kamatahan audio (public read, admin write)
    match /kamatahan_audio/{audioId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Dhamma posts (public read, admin write)
    match /dhamma_posts/{postId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Playlists (Meditation Guides)
    match /playlists/{playlistId} {
      // Anyone can read public guides; owners and admins can read
      allow read: if resource.data.isPublic == true
                  || (isSignedIn() && (resource.data.userId == request.auth.uid || isAdmin()));

      // Create: owner creating their own OR admin
      allow create: if isSignedIn() && (request.resource.data.userId == request.auth.uid || isAdmin());

      // Update/Delete: owner OR admin
      allow update, delete: if isSignedIn() && (resource.data.userId == request.auth.uid || isAdmin());
    }

    // Audio listens (for play counts)
    match /audio_listens/{listenId} {
      allow read: if true;         // needed for aggregate count()
      allow create: if isSignedIn();
      allow update, delete: if false;
    }

    // Dhamma reads (per-user reading tracking)
    match /dhamma_reads/{readId} {
      allow read: if true;
      allow create: if isSignedIn();
      allow update, delete: if false;
    }

    // Meditation types (public read, admin write)
    match /meditation_types/{typeId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

## Storage Rules (Cover Photo Uploads)

Copy this block into Firebase Console → Storage → Rules if you want admin-only uploads to `playlist_covers/` and public read.

```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isSignedIn() { return request.auth != null }
    function isAdmin() {
      return isSignedIn() &&
        exists(/databases/(default)/documents/admin_users/$(request.auth.uid));
    }

    // Guide cover photos
    match /playlist_covers/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Optional: keep other reads public (adjust as needed)
    match /{allPaths=**} {
      allow read: if true;
    }
  }
}
```

## Storage Rules (Copy-Paste FINAL)

Paste this full block into Firebase Console ? Storage ? Rules. Combines existing dhamma_posts, audio, and adds admin-only playlist_covers. Deny all others.

`ules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isSignedIn() { return request.auth != null }
    function isAdmin() {
      return isSignedIn() &&
        exists(/databases/(default)/documents/admin_users/);
    }

    // Dhamma post images � signed-in users may upload
    match /dhamma_posts/{imageFile} {
      allow read: if true;
      allow write: if isSignedIn();
    }

    // Audio files � signed-in users may upload
    match /audio/{audioFile} {
      allow read: if true;
      allow write: if isSignedIn();
    }

    // Playlist cover photos � admins only
    match /playlist_covers/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Default: deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
`

## Storage Rules (Copy-Paste FINAL)

Paste this full block into Firebase Console ? Storage ? Rules. Combines existing dhamma_posts, audio, and adds admin-only playlist_covers. Deny all others.

```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isSignedIn() { return request.auth != null }
    function isAdmin() {
      return isSignedIn() &&
        exists(/databases/(default)/documents/admin_users/$(request.auth.uid));
    }

    // Dhamma post images � signed-in users may upload
    match /dhamma_posts/{imageFile} {
      allow read: if true;
      allow write: if isSignedIn();
    }

    // Audio files � signed-in users may upload
    match /audio/{audioFile} {
      allow read: if true;
      allow write: if isSignedIn();
    }

    // Playlist cover photos � admins only
    match /playlist_covers/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Default: deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```
