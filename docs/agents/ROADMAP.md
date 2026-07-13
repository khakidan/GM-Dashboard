# Roadmap

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

None currently open. The Full Codebase Audit's bug-hunting phase (every directory: `lib/`, `hooks/`, `services/`, all of `components/`, `src/server/routes/`, `src/context/`, top-level `src/` files, `src/test-utils/fixtures/`) is complete in its entirety — see `CHANGELOG.md` for the full history of every finding, fix, and rejected-as-not-a-bug determination.

### 🟡 Features to Add

None currently open. Badge System Audit & Optimization (Phases 1–4) is complete — see `CHANGELOG.md`.

**Full Codebase Audit (bugs → componentization → UI uniformity) — bug-hunting phase complete in its entirety.** Dan wants a comprehensive pass for logic errors/bugs, oversized files needing decomposition, and UI/UX uniformity closer to established D&D apps (D&D Beyond, Roll20 conventions). Distinct from the earlier "Codebase Modularity Audit" (`CHANGELOG.md`) — that pass checked structural duplication and layer violations across components/lib/services/hooks; this is about behavioral correctness. Explicitly prioritized in this order per Dan: (1) bug-hunting/logic errors, (2) file size & componentization, (3) UI uniformity/D&D-app UX conventions. **Phase 1 is done** — every real directory audited (`lib/`, `hooks/`, `services/`, `components/` in full, `src/server/routes/`, `src/context/`, top-level `src/` files, `src/test-utils/fixtures/`), every finding independently verified against real code and fixed — see `CHANGELOG.md` for the complete history. **Phases 2 and 3 are not yet scoped or started.**

**`PlayerView.tsx` further UI improvements for readability at 10-15 feet** — raised alongside the PC combatant card header redesign. Three specific D&D rules-accuracy bugs on this page were fixed previously (PC "Defeated" mislabeling, HP column hiding real HP, condition capitalization — see `CHANGELOG.md`) prior to the Dead/Stable badge work. Whether any further UI work is wanted on this page beyond the fixes above is still an open question — not yet confirmed either way.

### 🔵 Architecture / Technical Debt

**Remaining Technical Debt:** None.