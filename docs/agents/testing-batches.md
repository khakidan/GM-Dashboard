# Testing Structure — 12-Batch System

Referenced from the root [AGENTS.md](../../AGENTS.md) (Rule 9: report all 12 batch counts individually after any change — never report only a combined total).

This file is maintained with the same discipline as [ROADMAP.md](ROADMAP.md)/[CHANGELOG.md](CHANGELOG.md)/[file-reference.md](file-reference.md) — kept current every session, not left stale. It was split out of `AGENTS.md` specifically because it's frequently-changing data (updated almost every session as tests are added), unlike `AGENTS.md`'s otherwise-stable rules and conventions, and unlike [testing-philosophy.md](testing-philosophy.md)'s stable quality principles. Update the table and baseline below immediately whenever a test count changes.

**Current baseline: 736 tests.**

Run each batch individually. Never chain with `&&`. Never use glob patterns. Never run all tests at once with `npx vitest run`.

| Batch | Description | Test Count |
|-------|-------------|------------|
| 1 | `src/lib/__tests__` | 453 |
| 2 | `src/services/__tests__` | 37 |
| 3 | `src/hooks/__tests__` | 51 |
| 4 | `src/server/__tests__` + `src/__tests__` | 9 |
| 5A | ActiveEncounterTab hooks (`.test.ts`) | 49 |
| 5B | ActiveEncounterTab components (`.test.tsx`) | 26 |
| 6A | `src/components/PartyTab/__tests__` | 54 |
| 6B | `src/components/EncountersTab/__tests__` | 23 |
| 6C | `src/components/NpcLibraryTab/__tests__` | 15 |
| 7B-1 | Audio + main dashboard top-level components | 13 |
| 7B-2 | Other top-level components | 4 |
| 8 | `src/components/ui/__tests__` | 2 |

```bash
# BATCH 1 — 453 tests
npx vitest run src/lib/__tests__

# BATCH 2 — 37 tests
npx vitest run src/services/__tests__

# BATCH 3 — 51 tests
npx vitest run src/hooks/__tests__

# BATCH 4 — 9 tests
npx vitest run src/server/__tests__ src/__tests__

# BATCH 5A — 49 tests
npx vitest run src/components/ActiveEncounterTab/__tests__/useBatchActions.test.ts src/components/ActiveEncounterTab/__tests__/useCombatSync.test.ts src/components/ActiveEncounterTab/__tests__/useCombatantCard.test.ts src/components/ActiveEncounterTab/__tests__/useCombatantExpanded.test.ts src/components/ActiveEncounterTab/__tests__/useEncounterPresetLoader.test.ts src/components/ActiveEncounterTab/__tests__/useHealthChange.test.ts src/components/ActiveEncounterTab/__tests__/useSelectionMode.test.ts

# BATCH 5B — 26 tests
npx vitest run src/components/ActiveEncounterTab/__tests__/AddNpcCollision.test.tsx src/components/ActiveEncounterTab/__tests__/CasterAttributionDialog.test.tsx src/components/ActiveEncounterTab/__tests__/CombatHeader.test.tsx src/components/ActiveEncounterTab/__tests__/AddCombatantDialog.test.tsx src/components/ActiveEncounterTab/__tests__/CombatantCard.test.tsx src/components/ActiveEncounterTab/__tests__/KeyboardShortcuts.test.tsx src/components/ActiveEncounterTab/__tests__/MultiTargetActionPanel.test.tsx src/components/ActiveEncounterTab/__tests__/NpcReferencePanel.test.tsx src/components/ActiveEncounterTab/__tests__/ShortcutCheatSheet.test.tsx src/components/ActiveEncounterTab/__tests__/combatStarted.test.tsx src/components/ActiveEncounterTab/__tests__/index.test.tsx

# BATCH 6A — 54 tests
npx vitest run src/components/PartyTab/__tests__

# BATCH 6B — 23 tests
npx vitest run src/components/EncountersTab/__tests__

# BATCH 6C — 15 tests
npx vitest run src/components/NpcLibraryTab/__tests__

# BATCH 7B-1 — 13 tests
npx vitest run src/components/__tests__/CommandPalette.test.tsx src/components/__tests__/ErrorBoundary.test.tsx src/components/__tests__/GMDashboard.test.tsx src/components/__tests__/GMDashboardSidebar.test.tsx src/components/__tests__/AudioLibrary.test.tsx

# BATCH 7B-2 — 4 tests
npx vitest run src/components/__tests__/CampaignSelector.test.tsx src/components/__tests__/GMTabContent.test.tsx src/components/__tests__/PlayerView.test.tsx src/components/__tests__/ThemeContext.test.tsx

# BATCH 8 — 2 tests
npx vitest run src/components/ui/__tests__
```

*Note: `EncounterLogModal.test.tsx` (5 tests) and `useEncounterLogs.test.ts` (4 tests) are part of Batch 6B.*

*Note: Batch 3 corrected from 41 → 44 tests (discovered during the useDeathSaves.ts stabilization-counter fix). This was pre-existing staleness — 3 tests were added to `src/hooks/__tests__` in an untracked prior session and never reflected here. No source of the discrepancy beyond "not this session's change" could be confirmed (no git history available in the working copy).*

*Note: Batch 1 corrected from 449 → 450 tests (discovered while adding the `DEFAULT_STATUSES` constant to `lib/constants.ts`). Same pattern as the Batch 2 and Batch 3 corrections above — a standalone, test-file-untouched change that shouldn't have moved the count at all, run against a real, raw, independently-summed terminal output (19 files summing to exactly 450, verified by hand) rather than accepted from a bare claim. The root cause is the same as those two: pre-existing staleness from an untracked prior session, not traceable (no git history available in the working copy).*

*Note: Batch 2 corrected from 34 → 33 tests (discovered during the Badge System Audit's Phase 1-4 verification). `npcs.test.ts` was independently confirmed (direct file inspection) to hold exactly 10 tests. A prior AI Studio claim that it "was documented as 11" is not supported by anything in this file — no per-file counts have ever been recorded here, only batch totals — and was not accepted as fact. The real cause of the batch-total drop from 34 to 33 could not be traced (no git history available); nothing in the Badge Audit's actual file changes (`irvOptions.ts`, `conditionDefinitions.ts`, `resourcePools.ts`, `CombatantCardBadges.tsx`, `CombatantCardHeader.tsx`) touches `src/services/`.*

*Note: Batch 6A corrected from 46 → 51 tests in one update, covering two separate missed updates from the bug-fix queue. The Jack of All Trades multiclass fix added 2 tests to `LevelUpDialog.test.tsx` (17→19) that were verified at the time but never reflected here (46→48 was missed). The short-rest HP cap fix immediately after added 3 more to `usePartyRest.test.ts` (15→18, 48→51), and that's when the earlier miss was caught and both corrected together. This was Claude's own tracking gap, not a data-integrity issue with the tests themselves — both sets of new tests were independently verified against the actual production math before being accepted.*

## Where new test files go

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