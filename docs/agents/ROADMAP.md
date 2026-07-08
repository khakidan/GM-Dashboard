# Roadmap

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

None currently open.

### 🟡 Features to Add

None.

### 🔵 Architecture / Technical Debt

**Remaining Technical Debt:** None.

---

## Component Consolidation Candidates (not yet verified or designed)

Surfaced by a user-run AI Studio audit, not this project's own audit cadence. **None of these are confirmed yet** — that same audit also produced a file-tree reconstruction that turned out to be significantly inaccurate before a follow-up correction, so every item below needs its own direct, single-topic verification pass (same discipline as every other component this project) before any design or build work starts.

1. **`EmptyState`** — multiple tabs (`PartyTab`, `EncountersTab`, `NpcLibraryTab`) and `Soundboard.tsx` each implement their own "No [entity] found" display (centered icon, serif title, description, optional action button). Likely shape: explicit named props (`icon`, `title`, `description`, `actionLabel?`, `onAction?`), not a generic `children` wrapper — the structure is fixed and repeatable, closer to `Callout` than to `DialogShell`/`StatTile`.
2. **`LabeledField`/`FormControl`** — a small uppercase, wide-tracked label sitting above a `DebouncedInput`/`DebouncedTextarea`, repeated across `NpcCard.tsx` and `CharacterCardExpanded.tsx` with claimed minor spacing drift (`mb-1` vs `mb-1.5` vs `mb-2`). Plausible, same shape as other label-normalization fixes already done this project.
3. **`ConfirmationDialog`** — a standardized "destructive confirmation" flow built on `DialogShell.tsx`, motivated by `GMDashboardDialogs.tsx`'s Leave Campaign confirmation (currently claimed to be a manual, one-off implementation) and potentially reusable for delete actions in `NpcCard`/`EncounterCard`. Not independently verified — check `GMDashboardDialogs.tsx` directly first.
4. **`DashboardLayout` page-level wrapper** — the top-level structure (fixed header with title/actions, scrollable content area, consistent `bg-[#f8fafc]`) is claimed to repeat across `PartyTab`, `EncountersTab`, `NpcLibraryTab`. Higher risk than every other component built so far — this would be the first *page-layout* wrapper rather than a leaf-level UI element, and layout wrappers tend to accumulate per-page exceptions over time if built without a real audit first. The specific claim that `NpcLibraryTab.tsx` uses "nested headers" while the others use a single-level flex header needs direct verification, not assumption.
5. **Card componentization — `CardShell` complete (see `CHANGELOG.md`), `CardHeader` and `ExpandableContent` still open, deliberately not started yet.**

   Two pieces remain of the original three-part plan. Neither should begin until scoped with the same direct-verification discipline as `CardShell` — don't assume the originating audit's claims about these two pieces are any more accurate than its `CardShell`-related claims turned out to be (several were wrong when checked).

   One concrete finding from the `CardShell` work, directly relevant to `ExpandableContent`: **`EncounterCard.tsx` doesn't use `AnimatePresence`/`motion` for expand/collapse at all**, unlike `CombatantCard.tsx`/`NpcCard.tsx`/`CharacterCard.tsx`, all three of which do. Whatever `ExpandableContent` ends up being, it needs to account for this real structural difference rather than assume all four behave the same way — this may mean `EncounterCard.tsx` doesn't participate in that piece the same way, or needs its own expand mechanism built first.

   Also from that work: `EncounterCard.tsx` has `isUpdating`/`isDeleting` state that currently only drives a generic `opacity-75 pointer-events-none` treatment — a plausible future candidate to wire to `CardShell`'s `syncing` prop, but not done as part of the `CardShell` adoption itself (would have been new behavior, not a like-for-like swap).

## Code Organization / Decomposition (different kind of work — not visual consolidation)

Also surfaced by the same audit, but this is file-size/maintainability work, not visual-consistency work — same category as the earlier "Codebase Modularity Audit," not the component-consolidation projects above. Track and scope separately if pursued.

- **`NpcCard.tsx` decomposition** — claimed to have grown past 500 lines, largely from inline functions like `renderActionFields`/`renderTraitFields`. Line count not independently confirmed.
- **Entity detail decomposition** (`NpcActionEditor.tsx`, `NpcTraitEditor.tsx`) — extracting the above inline functions into their own files under `src/components/ui/`, potentially reusable if a similar trait-based system is ever added for player characters.