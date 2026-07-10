# Roadmap

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

**A PC at 0 HP is being fully skipped in turn order, rather than being given a turn to roll a death saving throw — the earlier turn-skip generalization (see `CHANGELOG.md`, "Active Encounter Bug Investigation") was too broad and needs correcting, not extending.** The correct rule: NPCs at 0 HP always skip (unchanged, this part was right). PCs at 0 HP should only skip once they're stable or truly dead (3 failed saves) — otherwise they must still take their turn, since that's exactly when `useCombatTurn.ts`'s existing death-save-reminder logic (`getDeathSaveReminder`/`recordDeathSave`) is supposed to fire, and it currently never gets the chance to.

This surfaced 3 more confirmed, related gaps while investigating:

1. **Death saves are never logged to the combat log at all.** `useDeathSaves.ts` never calls `addCombatEvent` anywhere — not for individual save rolls, and not even when a PC actually dies (3 failed saves). No existing `CombatEventType` fits "a death save was rolled" — a new one is needed.
2. **A confirmed, connected bug beyond just incomplete logging**: `useCombatLifecycle.ts`'s Victory/Defeat outcome calculation checks for `combatant-defeated` events per PC to detect a full party wipe. Since a PC dying via 3 failed death saves never fires that event today, a full party death by death-saves specifically would currently be misreported as "Incomplete" instead of "Defeat" in the saved encounter log.
3. **Stabilized PCs have no distinct visual treatment, and their turn isn't correctly held until healed.** Confirmed directly: `CombatantCardHeader.tsx`'s health-status badge only renders when `currentHp > 0` — at 0 HP, no status badge shows at all today, not even "Unconscious," just the death-save pips. This needs a real addition (a 0-HP status badge for this file, not a fix to an existing one), distinguishing Unconscious / Stable / Defeated, with Stable getting its own distinct look. `PlayerView.tsx` already distinguishes Unconscious/Defeated but has no separate Stable case yet either. Turn-skip logic (see the main fix above) needs to treat "stable" as a skip condition alongside "3 failed saves."

**Staged plan**:
1. `getNextActiveTurnIndex()` in `combatLogic.ts` — narrow, mechanical correction (NPCs always skip; PCs skip only if stable or `deathSavesFails >= 3`). No new event type needed. **Done, verified directly**: `isDowned` renamed to `isSkippable` throughout, both branches (main loop and no-active-turn fallback) correctly apply the PC-aware rule, 3 pre-existing tests correctly updated (not silently broken) to reflect the corrected behavior, 2 new tests added covering both directions. Batch 1 (19 files/448 tests) matches baseline.
2. Death-save logging — add a new `CombatEventType` to `combatLog.ts`, wire `addCombatEvent` calls into `useDeathSaves.ts`'s `recordDeathSave`/`checkDeathSaveOutcome`, and fire `combatant-defeated` on the 3-fails death outcome specifically to fix the Victory/Defeat detection gap in item 2 above. Not yet started.
3. Stable-PC visual treatment — `CombatantCardHeader.tsx` (add the missing 0-HP status badge, Unconscious/Stable/Defeated) and `PlayerView.tsx` (add the missing Stable case alongside the existing Unconscious/Defeated). Not yet started, depends on stages 1-2 landing first since the turn-skip and logging behavior should be correct before the visual treatment is built on top of it.

### 🟡 Features to Add

**`PlayerView.tsx` further UI improvements for readability at 10-15 feet** — raised alongside the now-completed PC combatant card header redesign (see `CHANGELOG.md`). Three specific D&D rules-accuracy bugs on this page are now fixed (PC "Defeated" mislabeling, HP column hiding real HP, condition capitalization — see `CHANGELOG.md`). Whether any further UI work is wanted on this page beyond those three fixes is still an open question — not yet confirmed either way.

### 🔵 Architecture / Technical Debt

**Remaining Technical Debt:** None.