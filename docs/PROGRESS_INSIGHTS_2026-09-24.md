# Progress: practice insights

The Progress page now explains completed practice, compares matching periods, and offers a next action using today's saved goal. UI colors come from shared Admin Theme tokens. English and Sinhala use the same layout with translated dates and labels.

## Definitions

- Home and Progress share valid-session filtering: deduplicate IDs, reject invalid/future dates and non-positive durations, and use practice start time rather than record creation time.
- Completed sessions determine minutes, practice days, type shares, and streaks. Early-ended sessions keep their actual minutes and are reported separately. Typical duration is the median completed-session duration.
- 7/30/90-day views include today and the preceding 6/29/89 local dates. Comparisons use the preceding matching interval through the same local clock time on its final day. All Time reads the full owner history without the previous 1,000-document limit.
- Current streak comes from Home's calculation; longest streak uses distinct consecutive local calendar dates. Neither is affected by the selected period. DST calculations use calendar-day arithmetic.
- Goal progress describes today only. Historical goal achievement is not inferred from today's preference, because historical goals are not recorded.

## Interaction

- Summary, expandable methodology and period comparisons, today’s next action, theme-colored bars with explicit scale and exact-value table, monthly calendar, streaks, and type breakdown.
- Calendar browsing is independent of the selected summary period and explicitly labelled. Select a date to inspect its completed/early-ended sessions and expand reflections. Open Logbook for editing or broader history.
- Goal adjustment links to the existing Home goal controls. A met goal offers Dhamma reading; otherwise the action opens meditation setup without silently changing its duration.
- Logbook, learning paths, and My Path remain accessible. Future calendar days are disabled; unavailable history has retry UI, and new accounts still have a working Begin action.
- No meditation-type query is required: saved session names remain available even if types are retired or their catalogue cannot load.

## Validation and scope

- 54 application tests pass, including six new Progress tests for period boundaries, partial-day comparisons, duplicates, early endings, old/current streak separation, more than 1,000 sessions, bounded chart aggregation, and DST.
- Targeted ESLint, TypeScript/build checks, and translation validation pass. Existing unrelated build warnings remain.
- Local emulator browser checks cover English/light at 390px, Sinhala/dark at 320px without horizontal overflow, seven-day and all-time filters, comparison dates, calendar selection, reflection expansion, goal-adjustment navigation, and the goal-met recommendation. The temporary test goal and appearance settings were restored.
- No Firestore rules, indexes, migrations, or native builds are needed. Learning completion analytics, goal history, mood trends, and reading/listening instrumentation remain future work.
- Production is unchanged by this implementation branch.
