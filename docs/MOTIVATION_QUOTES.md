# Motivation Quotes

Manage quotes at `/admin/quotes` using the existing `content:read`, `content:create`, and `content:update` permissions. A quote needs Sinhala or English text (up to 1,200 characters each), an optional author/source (160 characters), order (0–999), and draft/published/archived status. Editing uses a version-checked transaction to prevent overwriting another administrator's changes.

Published quotes appear on `/` and `/dashboard`. The client subscribes to `motivation_quotes` with `status == published`; administrators read the full collection. Drafts and archives are private to content administrators. Documents contain only editorial content and creation/update metadata. Hard deletion is disabled; archiving removes a quote from rotation.

Rotation uses `floor(Date.now() / 14400000) % publishedCount`, ordered by order then document ID. UTC boundaries are 00:00, 04:00, 08:00, 12:00, 16:00, and 20:00 (05:30, 09:30, 13:30, 17:30, 21:30, and 01:30 in Sri Lanka). The loop continues across days and page reloads. The device clock determines the slot. A timer updates an open page at the boundary, and focus/visibility events catch up after sleep. Editorial changes apply immediately and may change the current selection. One published quote remains visible; none hides the card. Missing translations fall back to the available language.

Deploy both the application and `firestore.rules` before use. No composite index, scheduled job, or initial data migration is required. On September 24, 2026, the default database in `nirvanaya-web` was verified as Standard edition in `asia-southeast1`, and the updated Firestore rules compiled and deployed successfully. The application still needs deployment through its hosting workflow; this repository's Firebase configuration only defines Firestore deployment. The CLI required Node's `--use-system-ca` option to use the machine's trusted certificates.

Validation includes rotation boundaries/wraparound, query access, invalid quote data, archive visibility, and stale edit rejection against the local Firestore emulator.
