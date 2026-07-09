# Roadmap

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

None currently open. (The `useNpcLibrary.ts` double-confirmation bug is fixed — confirmed directly, zero `confirm()` calls remain in that file, Batch 6C matches baseline. See `CHANGELOG.md`.)

### 🟡 Features to Add

**3 raw `confirm()`/`window.confirm()` call sites remain, discovered by the real exhaustive audit (`grep -rn "confirm(" src/`) but not part of the original request** — the other 5 originally-known sites are fully migrated to `ConfirmationDialog` (see `CHANGELOG.md`). Not yet scoped or designed — should get the same direct-verification treatment as everything else before building:

- `useCombatConcentration.ts:63` — "already concentrating, end previous and start new?" — a different *kind* of confirmation than a destructive delete (an override/replace warning), worth checking whether `ConfirmationDialog`'s wording (`confirmLabel`/`cancelLabel` defaults) genuinely fits before assuming it does.
- `useBatchActions.ts:311` — bulk combatant removal, genuinely destructive and irreversible, a natural fit.
- `useSettings.ts:83` — resetting the spreadsheet configuration, a significant, app-wide action.
- All three are (or are likely) hooks, not components — same architectural split needed as `useParty.ts`/`useCombatantMutations.ts` (confirmation lives at the component level, the hook function becomes unconditional) — confirm which component each is actually called from before building.

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
   - Does not fit: the initiative circle (a circular avatar, not a horizontal pill).
## Code Organization / Decomposition (different kind of work — not visual consolidation)

Also surfaced by the same audit, but this is file-size/maintainability work, not visual-consistency work — same category as the earlier "Codebase Modularity Audit," not the component-consolidation projects above. Track and scope separately if pursued.

- **`NpcCard.tsx` decomposition** — claimed to have grown past 500 lines, largely from inline functions like `renderActionFields`/`renderTraitFields`. Line count not independently confirmed.
- **Entity detail decomposition** (`NpcActionEditor.tsx`, `NpcTraitEditor.tsx`) — extracting the above inline functions into their own files under `src/components/ui/`, potentially reusable if a similar trait-based system is ever added for player characters.