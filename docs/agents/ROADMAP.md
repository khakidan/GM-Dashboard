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
5. **Card componentization** (`CardShell`, then `CardHeader`, then `ExpandableContent` — three separate efforts, `CardShell` in progress now):

   **Verified directly, not assumed** (the original audit's specific illustrative code — the exact `bg-[#fcfdff]`, the claim that the `AnimatePresence` block is byte-identical everywhere — turned out to be wrong when checked; real backgrounds are `bg-white`, transition timing differs, `border-t` presence differs):

   | | Outer container | Emphasis concept | `overflow-hidden` |
   |---|---|---|---|
   | `CombatantCard.tsx` | `motion.div` | `isSelected` + `isActive` (selection mode, whose turn) — combat-specific | only on the *inner* expand wrapper |
   | `NpcCard.tsx` | plain `<div>` | `isSyncing` | on the *outer* container |
   | `CharacterCard.tsx` | plain `<div>` | `isSyncing` — **byte-identical to `NpcCard.tsx`**, confirmed | on the *outer* container |
   | `EncounterCard.tsx` | plain `<div>` | none | on the *outer* container |

   **Design decided**: option 1 from the two framings discussed — `CardShell` exposes named, shell-owned semantic states (`syncing?: boolean`, `highlight?: 'selected' | 'active-turn' | null`, `cornerBadge?: React.ReactNode`), not a generic style-passthrough. The shell decides the actual CSS for each named state once; cards just declare which state applies. `syncing`'s styling and badge (`Loader2` spin + "Syncing" text, `top-2 right-10`) are shell-owned by construction, since 2 of 4 real instances already agreed on it exactly. `highlight` and `cornerBadge` exist for `CombatantCard.tsx`'s narrower, combat-specific need, and won't be used by the other three.

   **A real, load-bearing constraint, not a detail**: `CardShell`'s own container must NOT have `overflow-hidden` (unlike 3 of the 4 originals) — `CombatantCard.tsx`'s turn-order badge is positioned `-top-3`, extending above the card's own top edge, and would be clipped otherwise. Each card's own inner `AnimatePresence` expand/collapse wrapper keeps owning its own `overflow-hidden`, unaffected by this.

   **Build sequencing, deliberately split into small steps** (learned from this project's own history — bundling a new component with several adoptions of differing complexity in one prompt has repeatedly caused problems): 1) build `CardShell.tsx` + adopt in `NpcCard.tsx` (simplest real case, `syncing` only) — **done, verified directly**: `CardShell.tsx` correctly omits `overflow-hidden`, `NpcCard.tsx`'s own inner expand-wrapper `overflow-hidden` untouched, Batch 6C (5 files/13 tests) matches baseline; 2) adopt in `CharacterCard.tsx` — **done, verified directly**: near-mechanical as expected given the confirmed byte-identical match, `Loader2` import cleanly removed, Batch 6A (9 files/46 tests) matches baseline; 3) adopt in `CombatantCard.tsx` — **done, verified directly, the hardest step**: `highlight`/`cornerBadge` correctly mapped, motion props (`layout`/`initial`/`animate`) correctly pass through `CardShell`'s prop-spreading to the underlying `motion.div` (a good validation that the shell's design was appropriately general, not over-constrained), the dead-NPC-vs-dead-PC className distinction genuinely preserved (more detailed than the prompt's own paraphrase — confirmed against the real file, not assumed), inner `overflow-hidden` untouched, Batch 5B (11 files/26 tests) matches baseline; 4) adopt in `EncounterCard.tsx` (simplest of all, no `syncing`/`highlight` at all — though check whether it has an `isUpdating`/`isDeleting`-equivalent state that could plausibly wire to `syncing` as a *future* enhancement; don't wire it during this adoption, that would be new behavior beyond scope) — **next, and last**.

   `CardHeader` and `ExpandableContent` are explicitly not started — do not begin either until `CardShell` is fully adopted across all four.

## Code Organization / Decomposition (different kind of work — not visual consolidation)

Also surfaced by the same audit, but this is file-size/maintainability work, not visual-consistency work — same category as the earlier "Codebase Modularity Audit," not the component-consolidation projects above. Track and scope separately if pursued.

- **`NpcCard.tsx` decomposition** — claimed to have grown past 500 lines, largely from inline functions like `renderActionFields`/`renderTraitFields`. Line count not independently confirmed.
- **Entity detail decomposition** (`NpcActionEditor.tsx`, `NpcTraitEditor.tsx`) — extracting the above inline functions into their own files under `src/components/ui/`, potentially reusable if a similar trait-based system is ever added for player characters.