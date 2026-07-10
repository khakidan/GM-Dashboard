# Roadmap

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

**5 user-reported bugs on the Active Encounter page, none yet investigated or verified against the real code — report findings before proposing any fix, same discipline as everything else in this project.** Grouped by likely-shared root cause, not confirmed:

1. **Call For Initiative animation doesn't fire on the GM's side** when the button is pressed. Player-view side not yet checked. Likely thread: `CombatHeader.tsx`'s `onCallInitiative` handler, or wherever `fireInitiativeEvent` is actually triggered/consumed.
2. **A dead PC's turn is not skipped** — the turn tracker advances to their turn instead of passing over them, and their info isn't grayed out the way a defeated NPC's is. Likely the same underlying "whose turn is next" mechanism as #3 below — investigate together, not necessarily two separate fixes.
3. **A PC who succeeds all 3 death saves becomes "Stabilized" but their turn isn't skipped** — they should remain unconscious-and-skipped until actually healed to 1+ HP, not treated as able to act just because they stabilized. Likely shares a root cause with #2.
4. **Clicking "End Encounter" no longer triggers the combat-log-writing action** — previously did (per user, "like it used to"), implying a regression, not a feature gap. This is a prerequisite to investigating #5, since there's no log to inspect without it firing.
5. **Round-counting on the Structured View may be skipping rounds with no events** (user saw Round 1 → Round 3, no Round 2, in a real encounter log) — cannot be confirmed as a genuine bug versus expected behavior (an empty round with zero tracked events might correctly not render) until #4 is fixed and a real log can be inspected. Needs: whatever groups events into "Round N" buckets for the Structured View (likely `EncounterLogDetails.tsx`), and wherever the round counter itself increments (likely `combatLogSlice.ts` or similar).

**Suggested investigation order**: #4 first (unblocks #5), then #2/#3 together (likely shared mechanism), then #1 (independent). Not yet started — no files requested, no root cause confirmed for any of these.

### 🟡 Features to Add

**`PlayerView.tsx` further UI improvements for readability at 10-15 feet** — raised alongside the now-completed PC combatant card header redesign (see `CHANGELOG.md`). Three specific D&D rules-accuracy bugs on this page are now fixed (PC "Defeated" mislabeling, HP column hiding real HP, condition capitalization — see `CHANGELOG.md`). Whether any further UI work is wanted on this page beyond those three fixes is still an open question — not yet confirmed either way.

### 🔵 Architecture / Technical Debt

**Remaining Technical Debt:** None.