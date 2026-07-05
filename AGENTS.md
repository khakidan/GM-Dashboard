# GM Dashboard — AI Agent Instructions

This file is the authoritative guide for AI coding agents working on this project. Read it completely before making any changes.

This file covers rules and systems relevant to nearly every session. Deeper reference material lives in `docs/agents/` and is linked below — read the linked file for the area you're working in before starting.

---

## Project Overview

A full-stack web application for Dungeons & Dragons 5e Game Masters. The GM uses it to run combat encounters, track party health and resources, manage NPCs, and create an immersive atmosphere with ambient audio. Built with React, TypeScript, Vite, Tailwind CSS v4, and an Express backend. Data is stored in Google Sheets and accessed via the Google Sheets API with OAuth2 authentication.

---

## Style Guide

[docs/agents/STYLE_GUIDE.md](docs/agents/STYLE_GUIDE.md) is the **primary and authoritative source** for all user interface styling, components, colors, and layout guidelines. All new UI developments must strictly adhere to the defined "Minimalist Sleek" aesthetic and contrast guidelines. Read it before making any UI/styling change — do not rely on visual pattern-matching from existing components alone.

---

## Hard Rules — Never Violate These

1. **Google Sheets is the SSOT.** Never store character, NPC, or encounter data anywhere else. See [docs/agents/schema.md](docs/agents/schema.md) for what's allowed in localStorage/IndexedDB.

2. **Dependency direction is one-way:** `lib ← services ← hooks ← components`. A component must never import directly from `services`.

3. **Test batches are fixed.** Never chain batches with `&&`, never use glob patterns, never run `npx vitest run` without specifying files/directories, and never reorganize test batches without updating the batch list below.

   **3.1. No parallel test execution.** Never run multiple test batches simultaneously or in parallel. Each batch command must complete before the next begins. Do not use background tasks, scheduled timers, or task queues.

   **3.2. No interleaving edits and test runs.** Never edit files while tests are still running. Wait for all test output, then make targeted fixes.

   **3.3. Syntax error recovery.** If a test fails because of a syntax or transform error in a file you just edited:
   - Stop immediately.
   - Fix only the syntax error.
   - Re-run only the affected batch.
   - Do not attempt unrelated fixes until the syntax error is resolved.

4. **Never delete tests instead of fixing them.** If behavior changes, update the tests rather than removing coverage.

5. **Do not use `.toBeDefined()` or `.toBeTruthy()` on DOM elements.** Use `.toBeInTheDocument()` instead.

6. **Exactly one `useAudioEngine` call.** It belongs only in `GMDashboard.tsx`.

7. **`NpcFormFields` is shared.** Any field added to `NewNpcDialog` must also appear in the Combat Sidebar Create NPC tab because both use `NpcFormFields.tsx`.

8. **Campaign creation must stay synchronized.** Whenever a sheet column is added, update `POST /api/campaigns/create` so newly created campaigns receive the correct schema.

9. **Report all 12 batch counts individually** after any change. Never report only a combined total.

10. **Never re-report findings from previous prompts in the same session.** Only document changes made in the current prompt. If verifying earlier work, simply state **"confirmed unchanged."** Each response should address only what the current prompt asked.

11. **Delete root-level scripts immediately.** Any `fix*.cjs`, `scan*.ts`, or `replace.js` files found in the project root are diagnostic artifacts and must be removed.

12. **Keep documentation current.** After any session that adds files, moves files, changes the test baseline, or affects architecture, update the relevant file:

    - New `lib` files → [docs/agents/file-reference.md](docs/agents/file-reference.md)
    - New shared UI components → [docs/agents/file-reference.md](docs/agents/file-reference.md)
    - File moves → both the old and new sections of file-reference.md
    - Test count changes → baseline and per-batch counts below in this file
    - New explicit Batch 5A/5B/7B-1/7B-2 files → the batch list below in this file
    - New NPC schema columns → [docs/agents/schema.md](docs/agents/schema.md) and TypeScript interfaces
    - New architectural patterns → [docs/agents/patterns.md](docs/agents/patterns.md)
    - New color tokens, component styles, or layout conventions → [docs/agents/STYLE_GUIDE.md](docs/agents/STYLE_GUIDE.md)
    - Completed or newly-scoped refactor/decomposition work → [docs/agents/decomposition-log.md](docs/agents/decomposition-log.md)

    **Only update the specific file relevant to the change.** Do not open or re-read the other docs/agents/ files unless the work actually touches that area — this keeps each update focused and avoids accidentally carrying stale context between unrelated topics.

    Completed decomposition/refactor plans get removed entirely from decomposition-log.md once done, not archived — but the write-up documenting what was actually built stays, matching the pattern already established there. If the technical debt list in that file is empty, it should say "None."

13. **Contrast on solid blue backgrounds.** All `bg-[#2563eb]` elements must use `text-white`. Never use `text-[#0f172a]` on a solid blue background.

14. **Avoid inline styles.** Do not use `style={{}}` when Tailwind can accomplish the same result. Dynamic animation calculations in overlay components are the only exception.

---

## The Golden Rule — Single Source of Truth

**Google Sheets is the database. The app is the GUI.**

- Every character stat, NPC stat, encounter record, and combatant record lives in Google Sheets and nowhere else.
- When the GM makes a change in the UI, it writes to the sheet via `updateCharacterDB` → `queueWrite`.
- The Zustand store holds an in-memory cache of the sheet data for rendering speed. It is NOT the source of truth.

Full detail on what's allowed in localStorage/IndexedDB and the sheet-by-sheet schema: [docs/agents/schema.md](docs/agents/schema.md).

---

## Architecture — Layer Dependency Rules

```text
lib/          Pure utilities. No React, no imports from other layers.
              ↓
services/     Network calls to Google Sheets API. Imports from lib only.
              ↓
hooks/        Zustand store + React hooks. Imports from lib and services.
              ↓
components/   UI only. Imports from hooks, lib, and other components.
              Never imports from services directly.
```

Violations of this dependency direction are bugs. A component should never call `sheetsService` directly—it calls a hook which calls a service.

Full file-by-file inventory of what lives in each layer: [docs/agents/file-reference.md](docs/agents/file-reference.md).

---

## Testing Structure — 12-Batch System

**Current baseline: 692 tests.**

Run each batch individually. Never chain with `&&`. Never use glob patterns. Never run all tests at once with `npx vitest run`.

| Batch | Description | Test Count |
|-------|-------------|------------|
| 1 | `src/lib/__tests__` | 439 |
| 2 | `src/services/__tests__` | 34 |
| 3 | `src/hooks/__tests__` | 41 |
| 4 | `src/server/__tests__` + `src/__tests__` | 9 |
| 5A | ActiveEncounterTab hooks (`.test.ts`) | 45 |
| 5B | ActiveEncounterTab components (`.test.tsx`) | 26 |
| 6A | `src/components/PartyTab/__tests__` | 46 |
| 6B | `src/components/EncountersTab/__tests__` | 20 |
| 6C | `src/components/NpcLibraryTab/__tests__` | 13 |
| 7B-1 | Audio + main dashboard top-level components | 13 |
| 7B-2 | Other top-level components | 4 |
| 8 | `src/components/ui/__tests__` | 2 |

```bash
# BATCH 1 — 439 tests
npx vitest run src/lib/__tests__

# BATCH 2 — 34 tests
npx vitest run src/services/__tests__

# BATCH 3 — 41 tests
npx vitest run src/hooks/__tests__

# BATCH 4 — 9 tests
npx vitest run src/server/__tests__ src/__tests__

# BATCH 5A — 45 tests
npx vitest run src/components/ActiveEncounterTab/__tests__/useBatchActions.test.ts src/components/ActiveEncounterTab/__tests__/useCombatSync.test.ts src/components/ActiveEncounterTab/__tests__/useCombatantCard.test.ts src/components/ActiveEncounterTab/__tests__/useCombatantExpanded.test.ts src/components/ActiveEncounterTab/__tests__/useEncounterPresetLoader.test.ts src/components/ActiveEncounterTab/__tests__/useHealthChange.test.ts src/components/ActiveEncounterTab/__tests__/useSelectionMode.test.ts

# BATCH 5B — 26 tests
npx vitest run src/components/ActiveEncounterTab/__tests__/AddNpcCollision.test.tsx src/components/ActiveEncounterTab/__tests__/CasterAttributionDialog.test.tsx src/components/ActiveEncounterTab/__tests__/CombatHeader.test.tsx src/components/ActiveEncounterTab/__tests__/CombatSidebar.test.tsx src/components/ActiveEncounterTab/__tests__/CombatantCard.test.tsx src/components/ActiveEncounterTab/__tests__/KeyboardShortcuts.test.tsx src/components/ActiveEncounterTab/__tests__/MultiTargetActionPanel.test.tsx src/components/ActiveEncounterTab/__tests__/NpcReferencePanel.test.tsx src/components/ActiveEncounterTab/__tests__/ShortcutCheatSheet.test.tsx src/components/ActiveEncounterTab/__tests__/combatStarted.test.tsx src/components/ActiveEncounterTab/__tests__/index.test.tsx

# BATCH 6A — 46 tests
npx vitest run src/components/PartyTab/__tests__

# BATCH 6B — 20 tests
npx vitest run src/components/EncountersTab/__tests__

# BATCH 6C — 13 tests
npx vitest run src/components/NpcLibraryTab/__tests__

# BATCH 7B-1 — 13 tests
npx vitest run src/components/__tests__/CommandPalette.test.tsx src/components/__tests__/ErrorBoundary.test.tsx src/components/__tests__/GMDashboard.test.tsx src/components/__tests__/GMDashboardSidebar.test.tsx src/components/__tests__/AudioLibrary.test.tsx

# BATCH 7B-2 — 4 tests
npx vitest run src/components/__tests__/CampaignSelector.test.tsx src/components/__tests__/GMTabContent.test.tsx src/components/__tests__/PlayerView.test.tsx src/components/__tests__/ThemeContext.test.tsx

# BATCH 8 — 2 tests
npx vitest run src/components/ui/__tests__
```

*Note: `EncounterLogModal.test.tsx` (5 tests) and `useEncounterLogs.test.ts` (4 tests) are part of Batch 6B.*

### Where new test files go

| New test covers | Add to batch |
|-----------------|--------------|
| `src/lib/` | Batch 1 (auto-picked up) |
| `src/services/` | Batch 2 (auto-picked up) |
| `src/hooks/` | Batch 3 (auto-picked up) |
| AET hook (`.test.ts`) | Add to Batch 5A explicitly |
| AET component (`.test.tsx`) | Add to Batch 5B explicitly |
| PartyTab | Batch 6A (auto-picked up) |
| EncountersTab | Batch 6B (auto-picked up) |
| NpcLibraryTab | Batch 6C (auto-picked up) |
| Audio or main dashboard | Add to Batch 7B-1 explicitly |
| Other top-level component | Add to Batch 7B-2 explicitly |
| `src/components/ui/` | Batch 8 (auto-picked up) |

---

## TypeScript Build Check

Always run after making changes:

```bash
npx tsc -p tsconfig.build.json --noEmit
```

The exit code must be **0**. Any TypeScript errors are blocking and must be resolved before proceeding.

If checking whether errors are pre-existing vs. newly introduced, don't rely on eyeballing truncated terminal output — pipe to a file and use `wc -l` / `grep` for an exact count, and compare against a copy of the pre-change file rather than assuming.

---

## Testing Philosophy

This project follows the testing principles established by Kent C. Dodds and the Testing Library team — full detail, anti-patterns, and examples in [docs/agents/testing-philosophy.md](docs/agents/testing-philosophy.md). Read it before writing any tests.

---

## Reference Index

- [docs/agents/STYLE_GUIDE.md](docs/agents/STYLE_GUIDE.md) — **Primary source for UI styling.** Colors, components, layout, the "Minimalist Sleek" design tokens. Read before any UI/styling work.
- [docs/agents/schema.md](docs/agents/schema.md) — Google Sheets schema (all sheets, all columns), localStorage/IndexedDB rules, campaign creation, `handleUpdate` whitelist
- [docs/agents/file-reference.md](docs/agents/file-reference.md) — File-by-file inventory of `lib/`, `services/`, `hooks/`, `server/routes/`, `test-utils/`, and `components/`
- [docs/agents/patterns.md](docs/agents/patterns.md) — Patterns and Conventions, Architectural Decisions, Workflows
- [docs/agents/testing-philosophy.md](docs/agents/testing-philosophy.md) — Kent C. Dodds testing standards, anti-patterns, seam test standard
- [docs/agents/decomposition-log.md](docs/agents/decomposition-log.md) — Completed refactor write-ups, in-progress/scoped decomposition plans, remaining technical debt