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

**`Badge`, `ToggleBadge`, `PipTracker`, `Accordion`, `Callout`, and `SearchInput` are all complete, and the `Accordion` pass's "Pattern C" is also resolved (a small `IconButton` adoption, not a new component)** — see `CHANGELOG.md` for all the full write-ups. What follows is everything else confirmed during this round's audit that hasn't been designed or built yet.

1. **Tab navigation** — confirmed 4 genuinely different visual treatments across dialog/panel-level tabs: segmented/pill-style (`EncounterLogDetails.tsx`), underline-on-active (`NewPlayerDialog.tsx`, `NpcFormFields.tsx`), filled-background-on-active (`AddCombatantDialog.tsx`, which also uses the off-palette `#f5f0d5` tan color previously flagged as a parchment-theme leftover in the `Button` project), and a raised-folder-tab style (`AudioPanel.tsx`). `SidebarIcon.tsx`'s vertical primary-navigation styling is a different concept (app-level nav, not in-dialog tabs) and should not be forced into the same component.
2. **`ResourcePoolsSection.tsx`'s "Reset: Short/Long Rest" chip — explicitly deferred, not decided.** Confirmed via direct read: no border, `rounded` (not `rounded-full`), a single flat neutral tint that never changes color regardless of reset type — a structurally weak match for `Badge`. It's purely informational (tells the GM/player when a resource pool replenishes; content driven by `getResetLabel(pool.reset)`), not interactive and never color-coded. Whether to normalize it into `Badge`'s shape or leave it alone is an open decision, not yet made — revisit once there's a clearer read on what it's actually meant to communicate.
3. **`Accordion` verification pass's "Pattern B" — explicitly deferred, a smaller decision than a full component.** A small inline toggle, embedded in other content, not a dedicated row: `NpcReferencePanel.tsx`'s "▼/▶ Stat Block" button and `StatBlockSkills.tsx`'s icon-only chevron — these two don't really match each other either (one is self-contained text-only, one is icon-only with its label as a separate sibling), so this may not need a shared component at all; worth a quick look before deciding either way.

**Investigated, but likely doesn't need a brand-new component**:
- `EncounterCard.tsx`'s delete button swaps `Trash2` for a spinning `Loader2` mid-delete — rather than a new component, this is probably better solved by adding an optional `loading` prop to the already-existing `Button.tsx`/`IconButton.tsx` (auto-swap to spinner, auto-disable), benefiting every existing destructive button too.

**Status**: `Badge`, `ToggleBadge`, `PipTracker`, `Accordion`, `Callout`, `SearchInput`, and Pattern C's `IconButton` adoption are all done (see `CHANGELOG.md`). Next: pick one of the remaining candidates above — same discipline that's worked well so far, not a repeat of the original large multi-part audit.