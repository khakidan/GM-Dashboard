# Roadmap

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

None currently open. (The `useNpcLibrary.ts` double-confirmation bug is fixed — confirmed directly, zero `confirm()` calls remain in that file, Batch 6C matches baseline. See `CHANGELOG.md`.)

### 🟡 Features to Add

**`PlayerView.tsx` further UI improvements for readability at 10-15 feet** — raised in the same original request as the now-completed PC combatant card header redesign (see `CHANGELOG.md`), but not yet scoped or discussed beyond the initial ask. Not yet started.

### 🔵 Architecture / Technical Debt

**Remaining Technical Debt:** None.