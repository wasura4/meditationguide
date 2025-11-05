Playlists Firestore Setup

Collection: `playlists`

Recommended fields per document:
- `name` string (required)
- `description` string
- `audioFiles` array of objects (KamatahanAudio)
- `isPublic` boolean (default true)
- `createdBy` string (admin uid)
- `createdAt` timestamp
- `updatedAt` timestamp

Notes
- User clients read public playlists by `isPublic == true`.
- Admin UI creates/edits/deletes playlists and sets `isPublic`.
- For scalability, you may store `audioFiles` as an array of audio file IDs instead of full objects; update read logic to join metadata from `kamatahan_audio` when displaying.

Security Rules (example)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null }
    function isAdmin() { return isSignedIn() && exists(/databases/$(database)/documents/admin_users/$(request.auth.uid)) }

    match /playlists/{playlistId} {
      allow read: if resource.data.isPublic == true || isAdmin();
      allow create, update, delete: if isAdmin();
    }

    // Existing collections ...
  }
}
```

Indexes
- No composite index required for current queries.
- Queries used: `where('isPublic', '==', true)` and by document ID. If you later add ordering/pagination, create indexes accordingly.

Client Collections Involved
- `kamatahan_audio`: audio items users/admins can add to playlists.
- `admin_users`: used by AdminAuthContext to determine admin privileges.

Migration Tip
- If you previously used `userId` for user-created playlists, admin-created playlists now use `createdBy`. The user UI merges public playlists regardless of owner, so both models can coexist.

