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

1. **`PlayerView.tsx` — an entire page never yet reviewed for componentization, tracked here so it isn't forgotten.** This is a read-only, large-text TV display shown to players during combat — a fundamentally different context from every other page (no sidebar/tabs, read from across a room, nothing on it is ever clickable). `EmptyState` is now adopted here (see `CHANGELOG.md`). Remaining findings from the first pass:
   - A clean, low-risk `CardShell` reuse opportunity — the table wrapper hand-rolls `CardShell`'s exact base shape, with no emphasis-state needed (pure read-only display, no syncing/highlight concept applies).
   - A genuinely new gap: the death-save tracker is `PipTracker`-shaped (a row of state-colored dots) but must be **read-only** — this page is pure display, nothing should ever be clickable. This is the first concrete case actually validating a `PipDisplay`/read-only-pip need (the earlier hit-dice question turned out to need real interactivity instead, so this is a genuinely different, still-open case). Also renders literal Unicode characters (`●`/`○`/`♥`) rather than styled circle elements — a bigger visual change than a typical drift-fix if ever unified with `PipTracker`'s look.
   - The health-status pill and round-indicator pill are both `Badge`-shaped, but neither currently varies background color by state (only text color does) — check whether that's deliberate before assuming `Badge`'s color formula should apply.
   - **Critical constraint for anything built here, now confirmed with real numbers, not just a general caution**: every shared component so far was sized for a GM working up close on a laptop. This page is read from across a room. The `EmptyState` adoption here happened to be safe — its fixed `text-lg`/`text-sm` sizing is actually slightly *larger* than this page's own small `text-xs` empty-state labels — but that was a coincidence specific to those two elements, not a general rule. The rest of the page is **not** safe by default: the combatant table currently uses genuinely large text (`text-xl`/`text-2xl` for names and HP), deliberately sized for cross-the-room reading, which is much bigger than any shared component's normal GM-dashboard-scale defaults (`Badge`'s padding/text size, a typical `PipTracker` dot size, etc.). Naively adopting those components here with their standard sizing would shrink this page down, the opposite of its purpose. Any future work on the health-status pill, the round-indicator pill, or the death-save pips needs to explicitly preserve or exceed the current large sizing — never just apply a component's normal default and assume it's fine.
   - Does not fit: the initiative circle (a circular avatar, not a horizontal pill) and `DashboardLayout` (this isn't a GM dashboard tab at all).

2. **`LabeledField`/`FormControl`** — a small uppercase, wide-tracked label sitting above a `DebouncedInput`/`DebouncedTextarea`, repeated across `NpcCard.tsx` and `CharacterCardExpanded.tsx` with claimed minor spacing drift (`mb-1` vs `mb-1.5` vs `mb-2`). Plausible, same shape as other label-normalization fixes already done this project.
3. **`ConfirmationDialog`** — a standardized "destructive confirmation" flow built on `DialogShell.tsx`, motivated by `GMDashboardDialogs.tsx`'s Leave Campaign confirmation (currently claimed to be a manual, one-off implementation) and potentially reusable for delete actions in `NpcCard`/`EncounterCard`. Not independently verified — check `GMDashboardDialogs.tsx` directly first.
4. **`DashboardLayout` page-level wrapper** — the top-level structure (fixed header with title/actions, scrollable content area, consistent `bg-[#f8fafc]`) is claimed to repeat across `PartyTab`, `EncountersTab`, `NpcLibraryTab`. Higher risk than every other component built so far — this would be the first *page-layout* wrapper rather than a leaf-level UI element, and layout wrappers tend to accumulate per-page exceptions over time if built without a real audit first. The specific claim that `NpcLibraryTab.tsx` uses "nested headers" while the others use a single-level flex header needs direct verification, not assumption.
## Code Organization / Decomposition (different kind of work — not visual consolidation)

Also surfaced by the same audit, but this is file-size/maintainability work, not visual-consistency work — same category as the earlier "Codebase Modularity Audit," not the component-consolidation projects above. Track and scope separately if pursued.

- **`NpcCard.tsx` decomposition** — claimed to have grown past 500 lines, largely from inline functions like `renderActionFields`/`renderTraitFields`. Line count not independently confirmed.
- **Entity detail decomposition** (`NpcActionEditor.tsx`, `NpcTraitEditor.tsx`) — extracting the above inline functions into their own files under `src/components/ui/`, potentially reusable if a similar trait-based system is ever added for player characters.