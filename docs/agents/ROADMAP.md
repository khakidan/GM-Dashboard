# Roadmap

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

None currently open. (Five `NewPlayerDialog` resource pool bugs were resolved in an earlier session.)

### 🟡 Features to Add

None.

### 🔵 Architecture / Technical Debt

**Remaining Technical Debt:** None.

(Previously tracked here: unused `isActive`/`isSyncing`/`isSelectable`/`isSelected` declarations on `CombatantCardProps` — confirmed dead via codebase-wide search, removed from the interface and from `CombatantCard.test.tsx`'s `defaultProps`. Verified: TypeScript clean, Batch 5B 26/26, zero behavior change. See `CHANGELOG.md`.)

---

## Second Round of Shared UI Component Consolidation — remaining candidates (not yet built)

**`Badge`, `ToggleBadge`, `PipTracker`, `Accordion`, `Callout`, `SearchInput`, both `Accordion`-pass patterns (B and C), the `ResourcePoolsSection.tsx` reset chip, and `Tabs` (4 of its 5 originally-confirmed instances) are all complete** — see `CHANGELOG.md` for all the full write-ups. **One small honest gap remains:**

1. **`NpcFormFields.tsx` — never actually re-verified or adopted during the `Tabs` build.** The original audit named this as a 5th underline-style tab instance alongside `NewPlayerDialog.tsx`, but it was only carried through the design discussion and build prompt as 4 files — an oversight caught after the fact, not a deliberate exclusion. Since it was already using the underline visual style, it may need no visual change at all, but it almost certainly still lacks `Tabs.tsx`'s real `role="tablist"`/`role="tab"`/`aria-selected`/keyboard-navigation fix, the same gap the other four instances had before this round. Needs a quick direct verification (upload + check) before either adopting `Tabs` there or confirming it's a non-issue.

**Investigated, but likely doesn't need a brand-new component**:
- `EncounterCard.tsx`'s delete button swaps `Trash2` for a spinning `Loader2` mid-delete — rather than a new component, this is probably better solved by adding an optional `loading` prop to the already-existing `Button.tsx`/`IconButton.tsx` (auto-swap to spinner, auto-disable), benefiting every existing destructive button too.

**Status**: everything in this consolidation round is done except confirming `NpcFormFields.tsx`. This is the last item before the entire second Shared UI Component Consolidation round can be closed out for good.