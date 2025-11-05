# Firestore Security Rules (Copy‑Paste)

Use these rules to enable public reading of published playlists, user ownership for personal playlists, and admin control for all playlist CRUD. They also preserve your existing behavior for users, sessions, audio, dhamma posts, and meditation types.

Copy everything inside the code block into your Firestore Rules and Publish.

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null }
    function isAdmin() {
      return isSignedIn() && exists(/databases/$(database)/documents/admin_users/$(request.auth.uid));
    }

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
      allow read: if request.auth.uid != null && request.auth.uid == adminId;
      allow write: if request.auth.uid != null && request.auth.uid == adminId;
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

    // Playlists
    // - Public playlists are readable by anyone
    // - Users can fully manage their own playlists (resource.data.userId == uid)
    // - Admins can create/update/delete any playlist
    match /playlists/{playlistId} {
      // Read if public, or owner, or admin
      allow read: if resource.data.isPublic == true
                  || (request.auth.uid != null && (
                       resource.data.userId == request.auth.uid
                       || isAdmin()
                     ));

      // Create if user creates their own (userId == uid) OR admin creates
      allow create: if request.auth.uid != null && (
                      request.resource.data.userId == request.auth.uid
                      || isAdmin()
                    );

      // Update/Delete if owner OR admin
      allow update, delete: if request.auth.uid != null && (
                              resource.data.userId == request.auth.uid
                              || isAdmin()
                            );
    }

    // Meditation types - admins manage, anyone can read
    match /meditation_types/{typeId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

## How to Apply
- In Firebase Console → Firestore Database → Rules
- Replace existing content with the block above
- Click Publish

## Notes
- Existing playlists that have `userId` stay valid; admin‑created playlists may have `createdBy` as metadata but rules do not require it.
- Public playlists (isPublic == true) are readable by anyone, so they appear for all users.
- If you later add ordering/pagination to playlist queries, we can add indexes as needed.
