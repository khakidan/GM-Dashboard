# Roadmap

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

None currently open. (The `useNpcLibrary.ts` double-confirmation bug is fixed — confirmed directly, zero `confirm()` calls remain in that file, Batch 6C matches baseline. See `CHANGELOG.md`.)

### 🟡 Features to Add

None.

### 🔵 Architecture / Technical Debt

**A real, unaddressed duplication found immediately after the `NpcCard.tsx` decomposition, while updating `file-reference.md` — see `CHANGELOG.md` for the full story.** `NpcFormFields.tsx` already delegates to `NpcActionEditors.tsx` (`TraitFieldsEditor`/`ActionFieldsEditor`/`ReactionFieldsEditor`/`LegendaryActionFieldsEditor`), which is nearly byte-for-byte identical to what `NpcCard.tsx` had inline before its own decomposition into `NpcSimpleFieldEditor.tsx`/`NpcCombatActionFields.tsx` — including the same internal duplication (its `TraitFieldsEditor`/`ReactionFieldsEditor` are identical to each other; its `ActionFieldsEditor`/`LegendaryActionFieldsEditor` are near-identical to each other). This means `NpcCard.tsx` and `NpcFormFields.tsx` were each independently maintaining their own hand-copied version of the same two shapes.

Confirmed directly: `NpcActionEditors.tsx`'s editors support a `compact?: boolean` prop (`px-2 py-1.5` vs `px-4 py-3`), and `NpcFormFields.tsx` genuinely passes this through to all four (propagated from its own `compact` prop, ultimately from `AddCombatantDialog.tsx`'s "Create NPC" tab, which passes `compact`). `NpcSimpleFieldEditor.tsx`/`NpcCombatActionFields.tsx` don't support this at all — they'd need it before they can be a true replacement.

**To actually finish this properly**:
1. Add `compact?: boolean` to both `NpcSimpleFieldEditor.tsx` and `NpcCombatActionFields.tsx`, matching `NpcActionEditors.tsx`'s exact conditional padding.
2. Migrate `NpcFormFields.tsx` to use the two new shared components instead of `NpcActionEditors.tsx`'s four.
3. Remove `NpcActionEditors.tsx` entirely once nothing references it — confirm via direct search first, don't assume.

Not yet scoped into a build prompt.