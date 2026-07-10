# Roadmap

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

**All 5 originally-reported Active Encounter bugs are now resolved** — #1 confirmed by the user to be a one-off glitch, not a real bug; #5 confirmed fixed by the same #2/#3 turn-skip fix, as suspected. See `CHANGELOG.md` for #2/#3/#4.

**2 new items found while re-testing, not yet investigated**:
1. **`actionContext` (the damage/healing "Source" combatant and action type) doesn't reset when Next Turn is clicked.** Expected: advancing the turn should automatically move the source to the newly-active combatant, regardless of what was manually set during the previous turn. Actual: the manually-set source and type persist across the turn change. Likely fix location: `useCombatTurn.ts`'s `nextTurn()` — confirmed this function currently updates `activeTurnId`/`round`/`combatants` but never touches `actionContext` at all. Not yet verified against the actual UI consumer of `actionContext` (likely `GlobalActionContextPanel.tsx`, referenced in `index.tsx` but not yet requested/seen).
2. **The "Type" label (for the damage-type selector) isn't visually distinct enough from the actual damage type options it displays** — a UI clarity request, not a logic bug. Same file as #1 above, not yet seen directly.

### 🟡 Features to Add

**`PlayerView.tsx` further UI improvements for readability at 10-15 feet** — raised alongside the now-completed PC combatant card header redesign (see `CHANGELOG.md`). Three specific D&D rules-accuracy bugs on this page are now fixed (PC "Defeated" mislabeling, HP column hiding real HP, condition capitalization — see `CHANGELOG.md`). Whether any further UI work is wanted on this page beyond those three fixes is still an open question — not yet confirmed either way.

### 🔵 Architecture / Technical Debt

**Remaining Technical Debt:** None.