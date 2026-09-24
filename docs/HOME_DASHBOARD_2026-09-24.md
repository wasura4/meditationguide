# Scenic home dashboard

The signed-in dashboard uses the supplied lake-and-monk image with theme-derived overlays, translucent cards, and large iOS-style typography. It preserves the app brand and the existing navigation.

## Practice data

- Today's minutes, lifetime minutes, distinct practice days, current streak, and Monday–Sunday activity use all of the user's completed sessions. Incomplete, duplicate, invalid, and future entries do not inflate these totals.
- Practice dates use session start time so delayed syncs stay on the correct day. A streak remains active through today if the last practice was yesterday.
- The editable daily goal defaults to 20 minutes and accepts whole minutes from 1 to 120. It saves as optional `users/{uid}.preferences.dailyGoalMinutes` using the existing preference update. No migration or new rules/index are needed for this dashboard.
- Loading and unavailable history are explicit; the Begin meditation action remains available.
- Guided practice opens the actual listening library. Published Dhamma reading and journal/learning shortcuts remain accessible.

## Theme

UI colors use shared tokens rather than colors sampled from the reference. The background artwork retains its original colors. Admin Theme now subscribes to the existing theme document for live updates. Its base colors apply in light mode; dark mode retains the established dark surfaces with shared admin accent colors.

## Verification

- 48 application tests pass, including five dashboard tests for totals, deduplication, late sync, streaks, DST, and goal validation.
- TypeScript, targeted ESLint, and 850 English/Sinhala translation keys pass.
- Production build passes; existing warnings elsewhere remain.
- Local Firebase emulator browser checks: light/dark, English/Sinhala, 320px/390px mobile and desktop, no horizontal overflow, saved goal survives reload, invalid goal cannot save, and live theme accent/base updates without reload.
- Temporary emulator theme colors and the test user's 20-minute goal were restored. No production data or deployment was changed.

The scenic PNG is explicitly tracked because this repository otherwise ignores `public/`.
