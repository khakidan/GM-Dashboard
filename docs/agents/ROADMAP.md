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

1. **`EmptyState` — verification complete across all 6 real instances, design decision needed before the staged build begins (same approach as `CardShell`: verify first, build in small sequential steps).**

   **Confirmed directly, not assumed — genuinely more divergent than expected**, at least 4 distinct structural variants, not just color/padding drift:

   | | Box? | Title | Description | Icon size | Padding |
   |---|---|---|---|---|---|
   | `PartyTab.tsx` | `bg-white border rounded-2xl shadow-sm` | `<h3>` serif | separate `<p>` | `w-12 h-12` opacity-20 | `py-16`, `mb-6` |
   | `EncountersTab.tsx` | same box | `<h3>` serif | separate `<p>` | same | `py-20`, `mb-8` — **already differs from `PartyTab.tsx`** |
   | `NpcLibraryTab.tsx` | **no box at all** | `<h3>` serif | separate `<p>` | same | `py-20`, `mb-6` |
   | `PlayerView.tsx` (2 instances) | box, different padding again (`py-24`) | one instance uses a small bold-uppercase `<p>` as a pseudo-title instead of `<h3>`; the other has **no title at all**, just one paragraph | inconsistent — see title column | same | `py-24` |
   | `Soundboard.tsx` | no box, much smaller scale (fits inside a dialog form, not a full tab) | **no title at all** | one combined sentence, no split | `w-8 h-8`, different color family (`text-stone-300`, not `text-[#8d8db9]`) | `py-6` |

   `Soundboard.tsx`'s instance in particular may not even be the same pattern semantically — smaller, boxless, no title, different color scheme, embedded in a dialog rather than a full-tab state. Worth deciding explicitly whether it's in scope at all rather than assumed to be.

   **Design decided**: `Soundboard.tsx` is out of scope — different pattern, not just drift (per explicit decision). The box treatment is **not** an optional prop — always applied uniformly (per explicit decision), meaning `NpcLibraryTab.tsx`'s adoption will be a real, deliberate visual *addition* (gaining a box it doesn't have today), not a preserved difference. `title` is optional (per explicit decision, since `PlayerView.tsx`'s "Peace reigns..." instance has none). No `size` axis needed — without `Soundboard.tsx` in scope, the remaining 5 real instances are close enough in scale already. `icon` is a component reference (not a pre-rendered element), sized/colored consistently by `EmptyState` itself, matching `Callout`'s "shell owns the visual treatment" precedent. `actionLabel`/`onAction` render a real `Button` internally, fixing the fact that every instance today uses a raw one-off `<button>`.

**Staged build plan, same discipline as `CardShell`** (verify first, build in small sequential steps, hardest/most-different case saved for later): 1) build `EmptyState.tsx` + adopt in `PartyTab.tsx` (closest to a clean reference case) — **in progress now**; 2) adopt in `EncountersTab.tsx` (near-identical to `PartyTab.tsx`, but normalize the confirmed `py-20`/`mb-8` vs. `py-16`/`mb-6` drift to match); 3) adopt in `NpcLibraryTab.tsx` (the real visual change — gains the box treatment it doesn't have today); 4) adopt in both `PlayerView.tsx` instances (needs the optional-`title` case exercised for real, and its non-standard bold-uppercase pseudo-title normalized into a real title+description split).

2. **`PlayerView.tsx` — an entire page never yet reviewed for componentization, tracked here so it isn't forgotten.** This is a read-only, large-text TV display shown to players during combat — a fundamentally different context from every other page (no sidebar/tabs, read from across a room, nothing on it is ever clickable). Findings from a first pass:
   - Two genuine `EmptyState` instances (folded into that entry above).
   - A clean, low-risk `CardShell` reuse opportunity — the table wrapper and both empty-state boxes all hand-roll `CardShell`'s exact base shape, with no emphasis-state needed (pure read-only display, no syncing/highlight concept applies).
   - A genuinely new gap: the death-save tracker is `PipTracker`-shaped (a row of state-colored dots) but must be **read-only** — this page is pure display, nothing should ever be clickable. This is the first concrete case actually validating a `PipDisplay`/read-only-pip need (the earlier hit-dice question turned out to need real interactivity instead, so this is a genuinely different, still-open case). Also renders literal Unicode characters (`●`/`○`/`♥`) rather than styled circle elements — a bigger visual change than a typical drift-fix if ever unified with `PipTracker`'s look.
   - The health-status pill and round-indicator pill are both `Badge`-shaped, but neither currently varies background color by state (only text color does) — check whether that's deliberate before assuming `Badge`'s color formula should apply.
   - **Critical constraint for anything built here**: every shared component so far was sized for a GM working up close on a laptop. This page is read from across a room. `Badge`'s default padding is already noticeably smaller than what this page currently uses — naively adopting existing components as-is could make this page *less* readable, the opposite of its purpose. Any adoption here needs this solved explicitly, not glossed over.
   - Does not fit: the initiative circle (a circular avatar, not a horizontal pill) and `DashboardLayout` (this isn't a GM dashboard tab at all).
3. **`LabeledField`/`FormControl`** — a small uppercase, wide-tracked label sitting above a `DebouncedInput`/`DebouncedTextarea`, repeated across `NpcCard.tsx` and `CharacterCardExpanded.tsx` with claimed minor spacing drift (`mb-1` vs `mb-1.5` vs `mb-2`). Plausible, same shape as other label-normalization fixes already done this project.
4. **`ConfirmationDialog`** — a standardized "destructive confirmation" flow built on `DialogShell.tsx`, motivated by `GMDashboardDialogs.tsx`'s Leave Campaign confirmation (currently claimed to be a manual, one-off implementation) and potentially reusable for delete actions in `NpcCard`/`EncounterCard`. Not independently verified — check `GMDashboardDialogs.tsx` directly first.
5. **`DashboardLayout` page-level wrapper** — the top-level structure (fixed header with title/actions, scrollable content area, consistent `bg-[#f8fafc]`) is claimed to repeat across `PartyTab`, `EncountersTab`, `NpcLibraryTab`. Higher risk than every other component built so far — this would be the first *page-layout* wrapper rather than a leaf-level UI element, and layout wrappers tend to accumulate per-page exceptions over time if built without a real audit first. The specific claim that `NpcLibraryTab.tsx` uses "nested headers" while the others use a single-level flex header needs direct verification, not assumption.
6. **Card componentization — `CardShell` complete (see `CHANGELOG.md`), `CardHeader` and `ExpandableContent` still open, deliberately not started yet.**

   Two pieces remain of the original three-part plan. Neither should begin until scoped with the same direct-verification discipline as `CardShell` — don't assume the originating audit's claims about these two pieces are any more accurate than its `CardShell`-related claims turned out to be (several were wrong when checked).

   One concrete finding from the `CardShell` work, directly relevant to `ExpandableContent`: **`EncounterCard.tsx` doesn't use `AnimatePresence`/`motion` for expand/collapse at all**, unlike `CombatantCard.tsx`/`NpcCard.tsx`/`CharacterCard.tsx`, all three of which do. Whatever `ExpandableContent` ends up being, it needs to account for this real structural difference rather than assume all four behave the same way — this may mean `EncounterCard.tsx` doesn't participate in that piece the same way, or needs its own expand mechanism built first.

   Also from that work: `EncounterCard.tsx` has `isUpdating`/`isDeleting` state that currently only drives a generic `opacity-75 pointer-events-none` treatment — a plausible future candidate to wire to `CardShell`'s `syncing` prop, but not done as part of the `CardShell` adoption itself (would have been new behavior, not a like-for-like swap).

## Code Organization / Decomposition (different kind of work — not visual consolidation)

Also surfaced by the same audit, but this is file-size/maintainability work, not visual-consistency work — same category as the earlier "Codebase Modularity Audit," not the component-consolidation projects above. Track and scope separately if pursued.

- **`NpcCard.tsx` decomposition** — claimed to have grown past 500 lines, largely from inline functions like `renderActionFields`/`renderTraitFields`. Line count not independently confirmed.
- **Entity detail decomposition** (`NpcActionEditor.tsx`, `NpcTraitEditor.tsx`) — extracting the above inline functions into their own files under `src/components/ui/`, potentially reusable if a similar trait-based system is ever added for player characters.