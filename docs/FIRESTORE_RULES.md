rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null }
    function isAdmin() {
      return isSignedIn() && exists(/databases//documents/admin_users/);
    }

    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Users can read/write their own meditation sessions
    match /meditation_sessions/{sessionId} {
      allow read: if isSignedIn() && request.auth.uid == resource.data.userId;
      allow create: if isSignedIn() && request.auth.uid == request.resource.data.userId;
      allow update: if isSignedIn() && request.auth.uid == resource.data.userId;
      allow delete: if isSignedIn() && request.auth.uid == resource.data.userId;
    }

    // Admin users collection - secure access
    match /admin_users/{adminId} {
      allow read: if isSignedIn() && request.auth.uid == adminId;
      allow write: if isSignedIn() && request.auth.uid == adminId;
    }

    // Kamatahan audio - admins manage, anyone can read metadata
    match /kamatahan_audio/{audioId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Dhamma posts - admins manage, anyone can read published posts
    match /dhamma_posts/{postId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Playlists (Meditation Guides)
    // - Public guides are readable by anyone
    // - Users can manage their own (resource.data.userId == uid)
    // - Admins can create/update/delete any
    match /playlists/{playlistId} {
      allow read: if resource.data.isPublic == true
                  || (isSignedIn() && (
                       resource.data.userId == request.auth.uid
                       || isAdmin()
                     ));

      allow create: if isSignedIn() && (
                      request.resource.data.userId == request.auth.uid
                      || isAdmin()
                    );

      allow update, delete: if isSignedIn() && (
                              resource.data.userId == request.auth.uid
                              || isAdmin()
                            );
    }

    // Audio listens (per‑play events used for counts)
    match /audio_listens/{listenId} {
      allow read: if true;
      allow create: if isSignedIn();
      allow update, delete: if false;
    }

    // Meditation types - admins manage, anyone can read
    match /meditation_types/{typeId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}

// Optional: Firebase Storage rules for cover photo uploads
/*
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /playlist_covers/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && exists(/databases/(default)/documents/admin_users/);
    }
  }
}
*/
