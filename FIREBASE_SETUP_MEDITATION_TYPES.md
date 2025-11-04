# Firebase Setup for Meditation Types

## 🔥 Required Firebase Configuration

### 1. Update Firestore Security Rules

Go to **Firebase Console > Firestore Database > Rules** and add this rule:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ... existing rules ...
    
    // Meditation types collection - admins can manage, users can read active types
    match /meditation_types/{typeId} {
      allow read: if true; // Anyone can read meditation types
      allow write: if request.auth.uid != null && 
                   exists(/databases/$(database)/documents/admin_users/$(request.auth.uid));
    }
  }
}
```

### 2. Create Admin User with Content Permissions

If you don't have an admin user yet, create one in Firestore:

**Collection:** `admin_users`
**Document ID:** (your Firebase user UID)

**Document Structure:**
```json
{
  "id": "YOUR_USER_UID",
  "email": "your-admin@email.com",
  "displayName": "Admin Name",
  "role": "super_admin",
  "permissions": [
    {
      "resource": "content",
      "actions": ["create", "read", "update", "delete"]
    },
    {
      "resource": "audio",
      "actions": ["create", "read", "update", "delete"]
    },
    {
      "resource": "dhamma",
      "actions": ["create", "read", "update", "delete"]
    },
    {
      "resource": "analytics",
      "actions": ["read"]
    }
  ],
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

### 3. Create Initial Meditation Types (Optional)

You can create initial meditation types manually or through the admin panel:

**Collection:** `meditation_types`

**Example Document:**
```json
{
  "name": "Anapanasathi Meditation",
  "description": "Mindfulness of breathing - the foundation of Buddhist meditation practice",
  "category": "theravada",
  "defaultDuration": 20,
  "isActive": true,
  "order": 1,
  "tags": ["breathing", "mindfulness", "foundation"],
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

### 4. Verify Collection Indexes

Firestore will automatically create indexes, but if you get index errors, create a composite index:

**Collection:** `meditation_types`
**Fields:** `isActive` (Ascending), `order` (Ascending)

## ✅ Checklist

- [ ] Firestore rules updated with `meditation_types` collection
- [ ] Admin user created with `content` permissions
- [ ] Admin user has `isActive: true`
- [ ] Test admin login to verify access
- [ ] Test meditation types page loads correctly
- [ ] Create at least one meditation type through admin panel

## 🐛 Troubleshooting

**Error: "Failed to load meditation types"**
- Check Firestore rules are updated
- Verify `meditation_types` collection exists
- Check browser console for specific error messages

**Error: "Not an admin user"**
- Verify admin user document exists in `admin_users` collection
- Check admin user has `isActive: true`
- Verify user UID matches the document ID

**Admin panel not showing "Meditation Types" menu**
- Check admin user has `content:read` permission
- Verify admin user role includes content management
- Check browser console for permission errors
