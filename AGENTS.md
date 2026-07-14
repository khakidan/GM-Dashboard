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

9. **Report all 12 batch counts individually after any change. Never report only a combined total.** For whichever batch(es) actually cover the files touched by the current change, genuinely re-run them and report real, fresh terminal output. For every other batch, do not re-run it and do not recite a count from memory — memory of the current baseline has proven unreliable. Instead, state plainly "not touched by this change — see docs/agents/testing-batches.md for the current baseline" and defer to that file as the authoritative source.

10. **Never re-report findings from previous prompts in the same session.** Only document changes made in the current prompt. If verifying earlier work, simply state **"confirmed unchanged."** Each response should address only what the current prompt asked.

11. **Delete root-level scripts immediately.** Any `fix*.cjs`, `scan*.ts`, or `replace.js` files found in the project root are diagnostic artifacts and must be removed.

12. **Keep documentation current.** After any session that adds files, moves files, changes the test baseline, or affects architecture, update the relevant file:

    - New `lib` files → [docs/agents/file-reference.md](docs/agents/file-reference.md)
    - New shared UI components → [docs/agents/file-reference.md](docs/agents/file-reference.md)
    - File moves → both the old and new sections of file-reference.md
    - Test count changes → baseline and per-batch counts in [docs/agents/testing-batches.md](docs/agents/testing-batches.md)
    - New explicit Batch 5A/5B/7B-1/7B-2 files → the batch list in [docs/agents/testing-batches.md](docs/agents/testing-batches.md)
    - New NPC schema columns → [docs/agents/schema.md](docs/agents/schema.md) and TypeScript interfaces
    - New architectural patterns → [docs/agents/patterns.md](docs/agents/patterns.md)
    - New color tokens, component styles, or layout conventions → [docs/agents/STYLE_GUIDE.md](docs/agents/STYLE_GUIDE.md)
    - Newly-scoped or still-in-progress refactor/decomposition work, and current pending features → [docs/agents/ROADMAP.md](docs/agents/ROADMAP.md)
    - Completed refactor/decomposition work → [docs/agents/CHANGELOG.md](docs/agents/CHANGELOG.md)

    **Only update the specific file relevant to the change.** Do not open or re-read the other docs/agents/ files unless the work actually touches that area — this keeps each update focused and avoids accidentally carrying stale context between unrelated topics.

    **When work in ROADMAP.md completes**: remove it entirely from ROADMAP.md (do not leave a "done" marker there — ROADMAP.md should only ever contain what's still open) and add a write-up documenting what was actually built to CHANGELOG.md instead. This keeps ROADMAP.md permanently small and current, so it can be read in full without wading through historical detail, while CHANGELOG.md accumulates the durable record. If ROADMAP.md's technical debt list is empty, it should say "None."

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

Full batch table, bash commands, and "where new test files go" reference: [docs/agents/testing-batches.md](docs/agents/testing-batches.md). Run each batch individually — never chain with `&&`, never use glob patterns, never run all tests at once with `npx vitest run`.

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
- [docs/agents/testing-batches.md](docs/agents/testing-batches.md) — The 12-batch test table, bash commands, and current baseline count. Updated every session as test counts change — read this for the live numbers, not this file.
- [docs/agents/ROADMAP.md](docs/agents/ROADMAP.md) — **Read this for current status.** Pending features, in-progress/scoped work not yet built. Kept small and current — everything here is still open.
- [docs/agents/CHANGELOG.md](docs/agents/CHANGELOG.md) — Historical record of completed refactor/decomposition write-ups. Read for rationale/history on a specific past decision; not needed to know what's currently being worked on.