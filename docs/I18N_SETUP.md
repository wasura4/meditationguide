# i18n Setup (Admin-Managed English → Sinhala)

This guide explains how the app’s language system works and how to set up Firebase so an admin can populate Sinhala translations for every English term.

## Overview

- English source strings live in `src/i18n/locales/en/common.json`.
- Admin can manage Sinhala translations at `/admin/settings` → “Languages” tab.
- The LanguageProvider loads English by default, then merges any Sinhala overrides from Firestore.
- A key collector script scans code for `t('…')` usages and reports missing keys.

## Firestore

Create a collection named `translations` with documents shaped like:

```
translations/{docId}
  key: string          // e.g. "navigation.home"
  english: string      // current English source text
  sinhala: string      // Sinhala translation (can be empty initially)
  category: string     // freeform grouping, e.g. "navigation", "dashboard"
  createdAt: timestamp
  updatedAt: timestamp
  updatedBy: string    // admin UID
```

Security rules (add to your Firestore Rules):

```
match /translations/{docId} {
  allow read: if true;              // users need to read to merge translations
  allow write: if isAdmin();        // only admins can create/update translations
}
```

Note: `isAdmin()` is already defined in `docs/FIRESTORE_RULES.md` and checks an `admin_users/{uid}` document.

## Populate Admin Account

Ensure your admin user exists under:

```
admin_users/{adminUid}
```

The document can be empty; its existence is what marks the account as admin for rules.

## Using the Admin UI

- Go to `/admin/settings` → Languages tab.
- You will see a combined list of all keys from `en/common.json` and any existing docs from `translations`.
- Use the filters to:
  - Search by key/text.
  - Filter by category.
  - Show only entries “Missing Sinhala”.
  - Show only entries where “English updated” (English source changed vs DB).
- Click “Edit” to provide/update Sinhala, then “Save”.

## Key Collector

Run the collector to detect missing keys referenced in code:

```
npm run i18n:collect
```

Strict check (CI-friendly):

```
npm run i18n:check
```

Automatically write missing keys into `en/common.json` with placeholder English (equal to the key):

```
npm run i18n:write
```

## Language Switcher

- Users can switch language in Settings → Language.
- The app persists the choice and sets `<html lang="…">` in layout for accessibility.

## Notes

- If English source strings change, the Admin UI shows “English updated” so you can review Sinhala.
- Keep `en/common.json` as the canonical source for all display text.

