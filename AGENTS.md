# GM Dashboard — AI Agent Instructions

This file is the authoritative guide for AI coding agents working on this project. Read it completely before making any changes.

---

## Project Overview

A full-stack web application for Dungeons & Dragons 5e Game Masters. The GM uses it to run combat encounters, track party health and resources, manage NPCs, and create an immersive atmosphere with ambient audio. Built with React, TypeScript, Vite, Tailwind CSS v4, and an Express backend. Data is stored in Google Sheets and accessed via the Google Sheets API with OAuth2 authentication.

---

## Style Guide

For all user interface styling, components, colors, and layout guidelines, refer to [STYLE_GUIDE.md](STYLE_GUIDE.md). This guide was revised in this session to add the Command Palette section, the Slate Dark color token, and the ReferenceDetailDialog badges/panels. All new UI developments must strictly adhere to the defined "Minimalist Sleek" aesthetic and contrast guidelines.

---

## Hard Rules — Never Violate These

1. **Google Sheets is the SSOT.** Never store character, NPC, or encounter data anywhere else.

2. **Dependency direction is one-way:** `lib ← services ← hooks ← components`. A component must never import directly from `services`.

3. **Test batches are fixed.** Never chain batches with `&&`, never use glob patterns, never run `npx vitest run` without specifying files/directories, and never reorganize test batches without updating `AGENTS.md`.

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

10. **Never re-report findings from previous prompts in the same session.** Only document changes made in the current prompt. If verifying earlier work, simply state **"confirmed unchanged."** This includes not re-answering previously-asked meta/discovery questions (such as the markdown/backtick rendering discussion from earlier this session) in later, unrelated responses — even if the current response happens to involve tooling or verification steps. Each response should address only what the current prompt asked.

11. **Delete root-level scripts immediately.** Any `fix*.cjs`, `scan*.ts`, or `replace.js` files found in the project root are diagnostic artifacts and must be removed.

12. **Keep `AGENTS.md` current.** After any session that adds files, moves files, changes the test baseline, or affects architecture, update this document.

    Specifically update:

    - New `lib` files → `src/lib/`
    - New shared UI components → `src/components/ui/`
    - File moves → both the old and new sections
    - Test count changes → baseline and per-batch counts
    - New explicit Batch 5A/5B/7B-1/7B-2 files
    - New NPC schema columns → schema table and TypeScript interfaces
    - New architectural patterns → **Patterns and Conventions**

13. **Contrast on solid blue backgrounds.** All `bg-[#2563eb]` elements must use `text-white`. Never use `text-[#0f172a]` on a solid blue background.

14. **Avoid inline styles.** Do not use `style={{}}` when Tailwind can accomplish the same result. Dynamic animation calculations in overlay components are the only exception.

---

## The Golden Rule — Single Source of Truth

**Google Sheets is the database. The app is the GUI.**

- Every character stat, NPC stat, encounter record, and combatant record lives in Google Sheets and nowhere else.
- When the GM makes a change in the UI, it writes to the sheet via `updateCharacterDB` → `queueWrite`.
- The Zustand store holds an in-memory cache of the sheet data for rendering speed. It is NOT the source of truth.

**What is allowed in localStorage:**

- UI preferences (active tab, theme)
- Audio configuration (volume, soundboard layout) — scoped per campaign
- Mood presets — scoped per campaign
- The write retry queue (for offline recovery)
- combatState for cross-tab Player View sync
- `hasInitialSynced` — always stored as false

**What is allowed in IndexedDB:**

- Audio file blobs — scoped per campaign using `gm_audio_files_{campaignId}` as the database name

**What is NOT allowed outside Sheets:**

- Character HP, conditions, stats
- NPC data
- Encounter data
- Resource pools
- Anything that should persist across sessions or devices

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

---

## Google Sheets Schema

### Characters (A2:Z — 26 columns)

| Col | Index | Field | Notes |
|-----|-------|-------|-------|
| A | 0 | id | Primary key |
| B | 1 | playerName | |
| C | 2 | characterName | |
| D | 3 | ac | Number, default 10 |
| E | 4 | maxHp | Number, default 10 |
| F | 5 | tempHp | Number, default 0 |
| G | 6 | currentHp | Number, default 10 |
| H | 7 | conditions | Comma-separated string |
| I | 8 | passivePerception | Number, default 10 |
| J | 9 | level | Number, default 1 |
| K | 10 | statusId | FK → Status |
| L | 11 | notes | |
| M | 12 | resistances | Comma-separated |
| N | 13 | immunities | Comma-separated |
| O | 14 | vulnerabilities | Comma-separated |
| P | 15 | tempHpMax | Number, default 0 |
| Q | 16 | tempAc | Number, default 0 |
| R | 17 | deathSavesFails | Number, default 0 |
| S | 18 | deathSavesSuccesses | Number, default 0 |
| T | 19 | class | String |
| U | 20 | hitDiceConfig | JSON string |
| V | 21 | hitDiceUsed | JSON string, default {} |
| W | 22 | resourcePools | JSON string, default [] |
| X | 23 | abilityScores | JSON string |
| Y | 24 | proficiencies | JSON string |
| Z | 25 | spellcastingAbility | Text, e.g. 'INT', 'WIS', 'CHA', '' |

### NPCs (A2:Y — 25 columns)

| Col | Index | Field | Notes |
|-----|-------|-------|-------|
| A | 0 | id | Primary key |
| B | 1 | name | |
| C | 2 | ac | Number, default 10 |
| D | 3 | maxHp | Number, default 10 |
| E | 4 | tempHp | Number, default 0 |
| F | 5 | currentHp | Number, default 10 |
| G | 6 | conditions | Comma-separated |
| H | 7 | notes | |
| I | 8 | resistances | Comma-separated damage types |
| J | 9 | immunities | Comma-separated damage types AND condition immunities |
| K | 10 | vulnerabilities | Comma-separated |
| L | 11 | legendaryActions | Number, default 0 |
| M | 12 | legendaryResistances | Number, default 0 |
| N | 13 | rechargeAbilities | JSON string |
| O | 14 | abilityScores | JSON string |
| P | 15 | proficiencies | JSON string |
| Q | 16 | speed | Text, e.g. "30 ft., fly 60 ft." |
| R | 17 | senses | Text, e.g. "darkvision 60 ft." |
| S | 18 | languages | Text |
| T | 19 | challengeRating | Text, e.g. "1/4", "16" |
| U | 20 | traits | JSON: NpcTrait[] |
| V | 21 | actions | JSON: NpcAction[] |
| W | 22 | reactions | JSON: NpcReaction[] |
| X | 23 | legendaryActionsList | JSON: NpcLegendaryAction[] |
| Y | 24 | spellcastingAbility | String |

**NPC TypeScript interfaces** (in src/types.ts):

```ts
NpcTrait: { name, description }

NpcAction: {
  name,
  description,
  attackBonus?,
  damage?,
  saveDC?,
  saveType?,
  range?,
  recharge?
}

NpcReaction: {
  name,
  description
}

NpcLegendaryAction: {
  name,
  description,
  cost?,
  attackBonus?,
  damage?,
  saveDC?,
  saveType?
}
```

Note: `immunities` (col J) stores BOTH damage immunities and condition immunities as a comma-separated string. There is no separate `conditionImmunities` column.

### Encounters (A2:G — 7 columns)

| Col | Index | Field | Notes |
|-----|-------|-------|-------|
| A | 0 | id | Primary key |
| B | 1 | name | |
| C | 2 | location | |
| D | 3 | difficultyId | FK → Difficulty_Level |
| E | 4 | npcDefinitions | Comma-separated |
| F | 5 | currentRound | Number, default 0 |
| G | 6 | activeTurnId | Combatant ID string |

### Encounter_Combatants (A2:K — 11 columns)

| Col | Index | Field | Notes |
|-----|-------|-------|-------|
| A | 0 | id | Primary key |
| B | 1 | encounterId | FK → Encounters |
| C | 2 | playerId | FK → Characters (null if NPC) |
| D | 3 | npcId | FK → NPCs (null if PC) |
| E | 4 | quantity | Number, default 1 |
| F | 5 | initiative | Number, default 0 |
| G | 6 | conditionTimers | JSON string |
| H | 7 | npcCurrentHp | Number, default -1 |
| I | 8 | npcTempHp | Number, default 0 |
| J | 9 | npcCurrentConditions | Comma-separated |
| K | 10 | npcTempAcMod | Number, default 0 |

### Conditions (A2:C — 3 columns)

| Col | Index | Field | Notes |
|-----|-------|-------|-------|
| A | 0 | name | |
| B | 1 | description | |
| C | 2 | source | |

### Spells (A2:N — 14 columns)

| Col | Index | Field | Notes |
|-----|-------|-------|-------|
| A | 0 | name | |
| B | 1 | level | |
| C | 2 | school | |
| D | 3 | castingTime | |
| E | 4 | range | |
| F | 5 | components | |
| G | 6 | materials | |
| H | 7 | duration | |
| I | 8 | concentration | |
| J | 9 | ritual | |
| K | 10 | classes | |
| L | 11 | description | |
| M | 12 | higherLevel | |
| N | 13 | source | |

### EncounterLogs (A2:J — 10 columns)

| Col | Index | Field | Notes |
|-----|-------|-------|-------|
| A | 0 | id | Primary key |
| B | 1 | encounterId | FK → Encounters |
| C | 2 | encounterName | |
| D | 3 | location | |
| E | 4 | date | ISO string |
| F | 5 | durationRounds | Number |
| G | 6 | outcome | String |
| H | 7 | partySnapshot | JSON string |
| I | 8 | events | JSON string |
| J | 9 | transcript | Markdown string |

### Status (read-only)

IDs: 1=Active, 2=Inactive, 3=Deceased

### Difficulty_Level (read-only)

IDs: 1=Easy, 2=Medium, 3=Hard, 4=Deadly

---

## Campaign Creation

`POST /api/campaigns/create` in `src/server/routes/campaigns.ts` creates all 7 sheets with the correct headers. When adding a column to any sheet, update this endpoint too or existing campaigns will have the wrong schema.

---

## Key Files Reference

- `src/index.css` — Global stylesheet. Note that the sleek-modern block is now structural-only (font, radius, shadows, button interactions). All parchment/gold override rules have been removed.

### src/lib/

- `constants.ts` — `OVERLAY_DURATIONS`, `ANIMATION_TIMING`, `SHEET_RANGES`, `WRITE_QUEUE`, `STORAGE_KEYS`, `TIMERS`, `MOODS`, `AUDIO`, `campaignKey()` helper
- `sheetSchemas.ts` — Zod validation for each sheet row. Defines defaults for every column. NPC schema covers 25 columns (0–24).
- `sheetAdapters.ts` — Maps raw row arrays from the API into typed model objects.
- `sheetSyncParser.ts` — Validates full campaign workbooks on initial sync. Note the addition of `parseConditions` and `parseSpells` functions alongside the existing `parseNPCs`.
- `combatLogic.ts` — HP/damage/healing math, IRV application, health status calculation.
- `combatLog.ts` — Generates readable Markdown transcripts from structured combat events. Also exports shared `ACTION_TYPE_LABELS`.
- `combatantBuilder.ts` — Pure function that builds combatant state from characters + NPCs + encounterCombatants. Combatant type includes class, level, abilityScores, proficiencies, and all 8 NPC stat block fields (speed, senses, languages, challengeRating, traits, actions, reactions, legendaryActionsList) passed through from the NPC source. Includes `buildSingleNpcCombatant()` helper for adding NPC instances to combat.
- `classResources.ts` — `CLASS_RESOURCE_SUGGESTIONS` mapping for all 13 standard 5e classes and `getClassResourceSuggestions()`. Includes Rogue (Sneak Attack d6), updated Paladin (Lay on Hands), and updated Warlock (Warlock Spell Slots, short rest). Pools that unlock after level 1 (Ki Points, Sorcery Points, Action Surge, Channel Divinity) are absent from level 1 suggestions and appear automatically via `getResourcePoolSuggestions()` on level up. Returns deep-copied `ResourcePool[]` suggestions. Returns `[]` for unknown/custom classes (e.g. Vitalist).
- `hitDice.ts` — Hit dice parsing, spending, recovery. Includes `CLASS_HIT_DIE_MAP`.
- `resourcePools.ts` — `ResourcePool` interface (`{ name, current, max, reset }`), parse/serialize/spend/recover/reset/add/remove/update. Includes `EFFECT_RESOURCE_MAP` for auto-decrement when effects are applied. Note: the rest field is named `reset` (not `restoreOn`).
- `resourcePoolScaling.ts` — Level-based resource pool scaling. Exports `ResourcePoolSuggestion`, `POOL_LEVEL_TABLES` (covering Rage, Ki Points, Sorcery Points, Action Surge, Channel Divinity, Lay on Hands, Warlock Spell Slots, and Sneak Attack (d6)), `getAutoScaledMax()`, and `getResourcePoolSuggestions()`. All values follow D&D 5e 2014 rules. Used by `LevelUpDialog` to pre-fill pool max suggestions when a character levels up. Returns both scaled existing pools and new pools the character should gain.
- `spellcasting.ts` — Spellcasting utilities. Exports `SpellcastingAbility` (`'STR'|'DEX'|'CON'|'INT'|'WIS'|'CHA'|null`), `SPELLCASTING_ABILITY_MAP` (12 classes), `CLASS_SAVING_THROW_MAP` (mapping each class to its two PHB saving throw proficiencies), `getAutoSpellcastingAbility()`, `getEffectiveSpellcastingAbility()`, `calculateSpellSaveDC()`, and `calculateSpellAttackBonus()`. Ability score keys are uppercase (`STR`, `DEX`, etc.) to match `AbilityScores`.
- `concentrationCheck.ts` — `concentrationCheckDc()`, `isConcentrating()`, `fireConcentrationAlert()`.
- `conditionDefinitions.ts` — `CONDITION_MECHANICS` booleans for every condition.
- `conditionDescriptions.ts` — Official D&D 5e rules text for 35+ conditions and effects. Powers the `ConditionPopover` component.
- `conditions/index.ts` — Barrel export for all condition-related exports.
- `irvOptions.ts` — `CONDITION_OPTIONS`, `EFFECT_OPTIONS`, `CONCENTRATION_EFFECTS`, `CONDITION_IMMUNITY_MAP`, `IRV_OPTIONS`.
- `abilityScores.ts` — `AbilityScores` and `Proficiencies` types, `calculateModifier()`, `proficiencyBonusFromLevel()`, `proficiencyBonusFromCR()`, skill/save helpers, parse/serialize helpers. `Proficiencies` includes optional `spellcastingAbility?: SpellcastingAbility` for GM override of auto-derived caster stat and optional `toughFeat?: boolean` (defaulting to `false` in `DEFAULT_PROFICIENCIES`).
- `audioFileStore.ts` — IndexedDB persistence for audio blobs, scoped per campaign.
- `diceRoller.ts` — Parses dice notation (e.g. `1d20+5`) and generates results.
- `utils.ts` — `tailwind-merge` helper.

### src/services/

- `dbOperations/` — Folder containing decomposed sheet operation modules.
  - `shared.ts` — Foundational helper functions, row mapping utilities, and sheets API call proxy wrappers.
  - `encounterLogs.ts` — Handles appending, reading, and deleting encounter logs.
  - `npcs.ts` — Handles adding, updating, resetting HP, and deleting NPCs.
  - `characters.ts` — Handles adding, updating, and deleting characters, and updating death saves.
  - `encounterCombatants.ts` — Handles adding, updating, and deleting encounter combatant records.
  - `encounters.ts` — Handles adding, updating, and deleting encounters (with cascaded delete of combatants and logs).
  - `index.ts` — Pure barrel file re-exporting all entity-specific CRUD operations and helpers from the sub-modules.
- `sheetsService.ts` — Raw Google Sheets API calls.
- `writeQueue.ts` — FIFO queue with localStorage retry. Typed values only: `(string|number|boolean|null)[][]`.
- `googleAuth.ts` — OAuth2 flow with Google Identity Services.

### src/hooks/

- `dashboardStore.ts` — Single Zustand store. Holds characters, NPCs, encounters, encounterCombatants, statuses, difficulties, campaign context, combatState, and combatLog. Has localStorage persistence.
- `useAppState.ts` — Thin wrapper re-exporting `useDashboardStore`.
- `useCampaign.ts` — `createCampaign`, `connectCampaign`, `openCampaign`, `deleteCampaign`, `closeCampaign`, `extractSpreadsheetId`.
- `useSheetSync.ts` — Full campaign workbook pull and Zustand population. Also fetches `Conditions!A2:C` and `Spells!A2:N`, wrapped in `try/catch` since older campaigns may not have those tabs.
- `useEncounterLifecycle.ts` — Combat setup, initiative, round advancement, battle end. Calls `initCombatLog`, `addCombatEvent`, `advanceCombatLogRound`, and `clearCombatLog`.
- `useEncounterResume.ts` — Detects and restores in-progress encounters on sync.
- `useAudioEngine.ts` — Two-deck crossfade, IndexedDB audio, ambient + sound effects. Called **once** in `GMDashboard`.
- `useMoodPresets.ts` — Five mood categories, one-to-one track assignment, campaign-scoped.
- `useDashboardShortcuts.ts` — Global keyboard events and mood shortcuts (`Alt+1–5`).
- `useNetworkState.ts` — Online/offline detection, triggers write retry.
- `useTabState.ts` — Active navigation tab with localStorage persistence.
- `useSettings.ts` — App configuration and JSON export.
- `useReferenceDataSeeder.ts` — Seeder utilities for Conditions and Spells reference data.

### src/server/routes/

- `campaigns.ts` — `POST /api/campaigns/create` provisions all 6 sheets with correct headers.
- `auth.ts` — Proxies OAuth token exchanges (keeps secrets off the client).
- `health.ts` — Health check endpoint.

### src/test-utils/fixtures/

Shared test data factories used across many test files. These are not tests themselves.

- `characterFixtures.ts` — Mock `Character` objects for use in component and hook tests.
- `combatantFixtures.ts` — Mock `Combatant` objects for use in `ActiveEncounterTab` tests.

### src/components/

- `GMDashboard.tsx` — Root shell. Calls `useAudioEngine(campaign.id)` and `useMoodPresets(campaign.id)` exactly once.
- `GMDashboardSidebar.tsx` — Permanent icon sidebar with hover tooltips via `SidebarIcon`.
- `GMTabContent.tsx` — Routes sidebar selection to `PartyTab`, `EncountersTab`, `NpcLibraryTab`, `ActiveEncounterTab`, and `SettingsPage`.
- `EncounterLogModal.tsx` — Modal for browsing past encounter logs. Shows collapsible event view and raw transcript toggle.
- `CampaignSelector.tsx` — Pre-dashboard launcher for campaign create/connect/switch.
- `PlayerView.tsx` — Cross-tab broadcast view for a second monitor.
- `ReferenceDataSeeder.tsx` — Settings page button that one-time seeds the Conditions and Spells sheet tabs from the Open5e public API (SRD content). Manual trigger only, idempotent (checks for existing data before writing).
- `ReferenceDetailDialog.tsx` — Modal shown when a condition or spell is selected from Command Palette search. Displays spell metadata (level, school, components, concentration/ritual badges) and renders the full description and `higherLevel` rules text using `react-markdown` with `remark-gfm`.
- `CommandPalette.tsx` — Cmd+K global search. Searches Conditions and Spells reference data (shown after 2+ characters typed) in addition to navigation and action commands.
- `AudioPanel.tsx` — `M` key modal with **Ambient**, **Soundboard**, and **Library** tabs.
- `AmbientPlayer.tsx` — Mood presets, track list, and volume.
- `Soundboard.tsx` — 3×4 configurable sound effect grid, campaign-scoped layout.
- `AudioLibrary.tsx` — Tabbed audio file manager with drag-and-drop and mood assignment.
- `SettingsPage.tsx` — Settings page layout with `SheetConnectionSettings` full width, Auth + Backup in a two-column grid, and `GMTestingTools` full width.

### src/components/auth/

- `AuthPortalSettings.tsx` — Authentication portal configuration UI.
- `AuthRelay.tsx` — OAuth relay handler.

### src/components/ui/ (shared components)

- `CardNumberInput.tsx` — Local-state wrapper for numeric inline edit fields on character and NPC cards. Commits on blur or Enter and reverts to the last valid value if cleared without entering a number. Used by `CharacterCardExpanded` and `NpcCard`. Same editing pattern as `AbilityScoreInput`, but without the 1–30 clamp and with a configurable fallback value.
- `ConditionChips.tsx` — Condition/effect chip input with popover, immunity checking, timer prompts, and `onConditionAdded` callback for resource auto-decrement.
- `ConditionPopover.tsx` — Hover popover showing official rules text for any condition or effect.
- `IrvMultiSelect.tsx` — Compact multi-select for resistances, immunities, and vulnerabilities.
- `StatBlock.tsx` — Orchestrator (117 lines). Delegates rendering to `StatBlockScores.tsx`, `StatBlockSaves.tsx`, `StatBlockPassive.tsx`, and `StatBlockSkills.tsx`. All five live in `src/components/ui/`.
- `NpcFormFields.tsx` — Shared form fields used by both `NewNpcDialog` and the Combat Sidebar Create NPC tab. Must stay in sync between both usages. Contains internal four-tab navigation (Identity, Combat, Abilities, Stat Block) while keeping the external API (`data`, `onChange`, `errors`, `compact`) unchanged. Includes text fields (name, AC, HP, notes, IRV, CR, speed, senses, languages) and four list editors (traits, actions, reactions, legendary actions) using `NpcListEditor`. `rechargeAbilities` has been removed from `NpcFormData`, `DEFAULT_NPC_FORM_DATA`, and associated handlers. Recharge is now represented only by the `recharge` field on `NpcAction`.
- `NpcListEditor.tsx` — Generic list editor used by `NpcFormFields` for traits, actions, reactions, and legendary actions. Generic over `T extends { name: string }`. Entries render through a `renderFields` prop and include Add/Remove controls.
- `NpcStatBlockSection.tsx` — Pure display component for one NPC stat block section (traits, actions, reactions, or legendary actions). Accepts a `title` and `items[]` with optional metadata. Also exports `formatActionMeta(action)` to build a compact mechanical summary string from `NpcAction` fields (`attackBonus`, `damage`, `saveDC`, `saveType`, `range`, `recharge`). Returns `null` when empty.
- `ResourcePoolsSection.tsx` — Shared pip tracker UI used by both `CharacterCardExpanded` (Party tab) and `CombatantCardExpanded` (Active Encounter tab).
- `SpellcastingStatsRow.tsx` — Displays Spell Save DC and Spell Attack Bonus inline on character and NPC cards. When `onOverrideChange` is supplied (Party tab, NPC Library), renders a spellcasting ability override dropdown. When omitted (Active Encounter), renders read-only. Non-casters with no override return `null`.
- `DebouncedInput.tsx` — Standard debounced input (light parchment theme).
- `DebouncedTextarea.tsx` — Standard debounced textarea (light parchment theme).

### src/components/PartyTab/

- `CharacterResourceSection.tsx` — Condition chips with `onConditionAdded` that automatically decrement matching resource pools.
- `hooks/useParty.ts` — Character CRUD plus `handleLongRest` and `handleShortRest`, both of which reset resource pools appropriately.
- `LevelUpDialog.tsx` — Level-up flow. Writes `level`, `class`, `hitDiceConfig`, `maxHp`, `currentHp`, `ac`, `passivePerception`, `resistances`, `immunities`, `vulnerabilities`, `notes`, `proficiencies`, and `resourcePools`. HP increase is entered as a dice roll rather than a Max HP total. CON modifier is auto-added with helper text. Tough feat checkbox persists `toughFeat: boolean` in the proficiencies JSON. Resource Pools display pre-filled scaling suggestions via `getResourcePoolSuggestions()`, editable before confirmation. Newly gained pools can be individually included or excluded.
- `NewPlayerDialog.tsx` — Four-tab character creation form. All Identity tab inputs now include proper `id` and `htmlFor` attributes for accessibility.

### src/components/ActiveEncounterTab/

- `CombatHeader.tsx` — Encounter controls. Includes **End Encounter** (writes log) and **Cancel Encounter** (discards log, destructive style).
- `CombatantCardHeader.tsx` — Compact `[-] N/M [+]` resource counter row for every PC resource pool in collapsed view.
- `CombatantCardExpanded.tsx` — Full `ResourcePoolsSection` for player combatants.
- `GlobalActionContextPanel.tsx` — Global Source/Type context panel displayed when combat is active (`combatStarted: true`).
- `NpcReferencePanel.tsx` — Collapsible NPC stat block reference displayed on NPC combatants during encounters. Manages its own expanded state. Hidden when the combatant has no stat block data. Toggle text is `"▶ Stat Block"` / `"▼ Stat Block"`. Displays CR, speed, senses, languages, and all four `NpcStatBlockSection` lists. Imports both `NpcStatBlockSection` and `formatActionMeta`.
- `CombatMechanicsSummary.tsx` — Pure presentational component showing combat mechanics (speed restrictions, advantage/disadvantage, auto-fail warnings) from a `mechanicalSummary` object. No store access.
- `CombatantIrvDisplay.tsx` — Read-only display for combatant resistances, immunities, and vulnerabilities.
- `hooks/useDeathSaves.ts` — Death saving throw state and stabilization logic.
- `hooks/useCombatantExpanded.ts` — Encapsulates resource pool updates and condition-triggered resource depletion via `onConditionAdded`. Used by `CombatantCardExpanded`.
- `hooks/useHealthChange.ts` — Damage/healing with IRV math. Fires `fireConcentrationAlert()` whenever a concentrating combatant takes damage.
- `hooks/useCombatSync.ts` — Turn, round, and combatant synchronization. Calls `initCombatLog`, `addCombatEvent`, `advanceCombatLogRound`, and `clearCombatLog`. Implements `cancelCombat`, `resetCombat`, initiative sorting on first turn, dead-NPC skipping, and NPC initiative as `1d20 + DEX modifier`.
- `hooks/useEncounterPresetLoader.ts` — Handles adding PC and NPC presets to active encounters. Implements rollback fix: state snapshots are now captured BEFORE optimistic updates (not after), so a failed DB write correctly rolls back to pre-update state and shows a toast.error to the GM.
- `hooks/useEncounterKeyboard.ts` — Global combat keyboard shortcuts. Escape exits selection mode, clears `expandedIds`, and closes modals.

### src/components/EncountersTab/

- `hooks/useEncounterLogs.ts` — On-demand hook for `EncounterLogs` sheet data. Not part of global Zustand sync. Exposes `fetchLogsForEncounter()` (returns logs filtered by encounter, newest first) and `deleteLog()`.

### src/components/NpcLibraryTab/

- `NpcCard.tsx` — NPC library card. Expanded view displays `StatBlock`, `SpellcastingStatsRow`, editable combat stats (AC, HP, IRV, etc.), and read-only stat block sections (CR, speed, senses, languages, traits, actions, reactions, legendary actions) via `NpcStatBlockSection`.
- `NewNpcDialog.tsx` — NPC creation dialog using the shared `NpcFormFields` component.

---

## handleUpdate Whitelist (`useParty.ts`)

The following fields are accepted by `handleUpdate` and write to the sheet:

`playerName`, `characterName`, `class`, `ac`, `maxHp`, `tempHp`, `currentHp`, `conditions`, `passivePerception`, `level`, `statusId`, `notes`, `resistances`, `immunities`, `vulnerabilities`, `tempAc`, `deathSavesFails`, `deathSavesSuccesses`, `hitDiceConfig`, `hitDiceUsed`, `resourcePools`, `abilityScores`, `proficiencies`

When adding a new character field, add it to this whitelist and to `dbOperations.ts`.

---

## Testing Structure — 12-Batch System

**Current baseline: 692 tests.**

All batches must pass with zero failures. No batch should exceed 35 seconds.

Run each batch individually. Never chain with `&&`. Never use glob patterns. Never run all tests at once with `npx vitest run`.

| Batch | Description | Test Count |
|-------|-------------|-----------:|
| 1 | Lib | 439 |
| 2 | Services | 34 |
| 3 | Hooks | 41 |
| 4 | Server | 9 |
| 5A | AET Hooks | 45 |
| 5B | AET Components | 26 |
| 6A | PartyTab | 46 |
| 6B | Encounters | 20 |
| 6C | NpcLibrary | 13 |
| 7B-1 | Top-Level 1 | 13 |
| 7B-2 | Top-Level 2 | 4 |
| 8 | UI | 2 |
| **Total** | | **692** |

*Note: `EncounterLogModal.test.tsx` (5 tests) and `useEncounterLogs.test.ts` (4 tests) were added to Batch 6B.*

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

## Patterns and Conventions

### Optimistic update pattern

Every mutation follows this sequence:

1. Snapshot current Zustand state.
2. Apply the change optimistically to the Zustand store.
3. Update the UI immediately (zero perceived latency).
4. Call `updateCharacterDB` (or equivalent), which calls `queueWrite`.
5. On success: nothing more needed.
6. On failure: revert Zustand to the snapshot, show a Sonner toast, and cache the write to `STORAGE_KEYS.writeRetryQueue`.

### Write queue

`writeQueue.ts` batches API calls to avoid rate limits. It polls on an interval defined by `TIMERS.writeQueuePollingMs`. Pending writes survive page refresh via localStorage. When the browser comes back online, `retryPersistedWrites()` is called automatically.

### Campaign-scoped storage

Every localStorage key and IndexedDB name must be scoped to the campaign.

- Use `campaignKey(key, campaignId)` from `constants.ts` for localStorage.
- Use `gm_audio_files_{campaignId}` for IndexedDB audio.

Never use a bare localStorage key that is shared across all campaigns.

### Concentration check

When any combatant or character with the `concentrating` condition takes damage:

- Call `concentrationCheckDc(damage)` to calculate the DC.
- Call `fireConcentrationAlert(name, damage)` to display the Sonner toast.
- This fires in `useHealthChange.ts` for combat and `useParty.ts` for Party Tab HP changes.
- Each source fires independently. There should never be double-firing between tabs.

### Recharge pattern

When defining a recharge ability for an NPC, `parseRechargeOn` accepts both full format (`Recharge 5-6`) and bare format (`5-6`, `5-`, `6`, `4-6`). The GM should enter the **bare format** in the recharge field. Do **not** revert to requiring the `"Recharge"` prefix.

### Resource pool auto-decrement

When certain effects are applied via `ConditionChips`, the `onConditionAdded` callback fires. If `getResourceForEffect()` returns a non-null resource name, the matching pool is decremented by 1 and saved.

Current mappings (`EFFECT_RESOURCE_MAP`):

- `raging` → `rage`
- `wild shaped` → `wild shape`
- `action surge (used)` → `action surge`
- `second wind (used)` → `second wind`
- `bardic inspiration (given)` → `bardic inspiration`

### Spellcasting stats display

`SpellcastingStatsRow` derives Spell Save DC and Spell Attack Bonus from `abilityScores` + `proficiencyBonus`.

The spellcasting ability is resolved in the following order:

1. `proficiencies.spellcastingAbility` override (if the key exists, even if its value is `null`; `null` means the GM explicitly marked the creature as a non-caster).
2. Auto-derived from class using `SPELLCASTING_ABILITY_MAP` in `spellcasting.ts`.
3. If neither resolves, the row renders nothing.

The distinction between `undefined` and `null` is critical:

- `undefined` = no override set (auto-derive)
- `null` = explicitly overridden to "none" (non-caster), which takes precedence over auto-derivation

Do **not** flatten both values to `null` in any handler.

NPC `spellcastingAbility` is stored in column **Y** (index 24) and read using:

```ts
SHEET_RANGES.npcs = "NPCs!A2:Y";
```

`NpcCard`'s `onOverrideChange` writes both:

- `spellcastingAbility` (column Y)
- `proficiencies` JSON

for resilience.

Do **not** revert `SHEET_RANGES.npcs` to `A2:X`.

Character `spellcastingAbility` is stored in column **Z** (index 25) and is also embedded in the proficiencies JSON stored in column **Y**.

Both values are written by `CharacterCardExpanded`'s `onOverrideChange` handler.

```ts
SHEET_RANGES.characters = "Characters!A2:Z";
```

reads both values.

Do **not** revert the read range to `A2:Y`.

### Resource pool scaling on level-up

`LevelUpDialog` calls:

```ts
getResourcePoolSuggestions(
  character.class,
  newLevel,
  currentPools
)
```

to generate pre-filled pool suggestions.

The GM sees all suggested pools with editable maximum values and can include or exclude newly gained pools before confirming.

On confirmation, `resourcePools` is included in the `onConfirm` updates object alongside the other level-up fields.

### NPC stat block display

NPC stat blocks are stored as JSON strings in columns **U–X**.

They are displayed in two places:

1. NPC Library expanded view via `NpcStatBlockSection` (`src/components/ui/`)
2. Active Encounter NPC cards via `NpcReferencePanel`

`formatActionMeta(action: NpcAction): string` is exported from `NpcStatBlockSection.tsx` and builds a compact mechanical summary line from structured `NpcAction` fields.

Import it from:

```ts
src/components/ui/NpcStatBlockSection
```

`NpcListEditor` is the generic form component used to edit these lists.

It is generic over:

```ts
T extends { name: string }
```

and uses a `renderFields` prop to render each entry.

The `notes` field on `NpcFormData` was previously missing from the `NpcFormFields` JSX and has now been added to the Combat tab as a `DebouncedTextarea`.

### Ability Score Input Pattern

`AbilityScoreInput` is a local-state wrapper component defined in `StatBlockScores.tsx`.

It keeps the raw typed value locally and commits changes only on blur or Enter. This prevents mid-keystroke snap-to-default behavior.

Do **not** replace it with `DebouncedInput` (different contract) or revert to a direct `<input onChange>`.

`CrInput` in `NpcFormFields.tsx` follows the same editing pattern for the Challenge Rating field.

---

## Architectural Decisions

### `resourcePools` stored as a JSON string (not separate columns)

Class resources vary widely by class, subclass, and level. A JSON column in Google Sheets allows any combination of named resource pools without requiring schema changes. The schema stays clean and works across all character builds, including homebrew.

### NPC stat block data stored as JSON strings

Traits, actions, reactions, and legendary actions vary significantly between NPCs. JSON columns allow arbitrary-length lists without requiring additional sheet columns. This follows the same design philosophy as `resourcePools`.

### Audio engine lives in `GMDashboard`, not in tabs

Audio must continue uninterrupted while the GM navigates between tabs. If the audio engine lived inside a tab component, it would unmount and remount whenever the user switched tabs, interrupting playback.

`useAudioEngine` is therefore called **exactly once** at the application root.

### Express backend for OAuth

Google OAuth client secrets must never reach the browser.

The Express backend performs the OAuth authorization-code → token exchange so credentials remain server-side.

### HashRouter

`HashRouter` ensures routes work regardless of the deployment path.

It was originally adopted for the Tauri desktop wrapper and has been retained because it simplifies deployment.

### Shared components belong in `ui/`

Shared components that are imported by more than one feature belong in `src/components/ui/` rather than inside a feature directory.

Examples include:

- `NpcFormFields`
- `NpcListEditor`
- `NpcStatBlockSection`
- `ResourcePoolsSection`
- `SpellcastingStatsRow`

Rule:

> If a component is imported by more than one feature tab, it belongs in `ui/`.

### Test fixtures live in `src/test-utils/`

`characterFixtures.ts` and `combatantFixtures.ts` are fixture factories, **not** test files.

They live in:

```text
src/test-utils/fixtures/
```

rather than inside `__tests__/` to clearly distinguish test infrastructure from test suites.

---

## Workflows

### Add Player Workflow (`NewPlayerDialog.tsx`)

A four-tab form for creating characters manually.

1. **Identity**
   - Name
   - Character Name
   - Class
   - Level
   - Status

2. **Combat Stats**
   - AC
   - Max HP
   - Hit Dice
   - IRV
   - Notes

3. **Abilities**
   - Ability Scores
   - Automatically calculates Passive Perception
   - Automatically calculates Proficiency Bonus

4. **Resources**
   - Manage Resource Pools
   - Automatically suggests pools based on the class selected on the Identity tab
   - Uses the `poolsCustomized` ref so manually edited pools are not overwritten if the class changes again

The dialog submits a single flat `Character` record matching the Google Sheets schema.

---

## Testing Philosophy & Quality Standards

This project follows the testing principles established by Kent C. Dodds and the Testing Library team.

Every AI agent working on this codebase must read and apply these principles before writing any tests.

### The Prime Directive

> "The more your tests resemble the way your software is used, the more confidence they can give you."
>
> — Kent C. Dodds / Testing Library

Reference URLs (read before writing tests):

- https://testing-library.com/docs/guiding-principles
- https://kentcdodds.com/blog/testing-implementation-details
- https://kentcdodds.com/blog/common-testing-mistakes
- https://kentcdodds.com/blog/write-tests

### What Makes a Good Test

A good test:

- Simulates real user or caller behavior (render a component, fire an event, assert on what the user sees or what data reaches the database).
- Asserts on **outcomes**, not implementation details.
- Would catch a real bug if behavior broke.
- Does not need to change simply because code was refactored.

### The Three Anti-Patterns to Avoid

#### Anti-Pattern 1 — Shallow call assertion

Testing only that a function was called without checking what data it received.

```ts
// BAD
expect(updateCharacterDB).toHaveBeenCalled();
```

```ts
// GOOD
expect(updateCharacterDB).toHaveBeenCalledWith(
  expect.objectContaining({
    resourcePools: expect.stringContaining("Rage"),
  }),
  expect.any(Object)
);
```

#### Anti-Pattern 2 — Circular mock assertion

Returning data from a mock and then asserting that the same mock data was returned.

```ts
// BAD
vi.mocked(useAppState).mockReturnValue({
  state: { encounters: [mockEnc] },
});

expect(result).toEqual(mockEnc);
```

This can never fail because the test itself injected the expected value.

Instead, assert on a transformation or observable side effect produced by the code under test.

#### Anti-Pattern 3 — Testing implementation details

Do not assert on:

- internal component state
- internal helper functions
- implementation structure

```ts
// BAD
expect(component.state.isLoading).toBe(true);
```

Instead, assert on observable behavior.

```ts
// GOOD
expect(
  screen.getByText("Loading...")
).toBeInTheDocument();
```

### What to Assert Instead

#### Hook tests

Assert on the resulting state change.

```ts
// BAD
expect(handleUpdate).toHaveBeenCalled();
```

```ts
// GOOD
expect(result.current.characters[0].maxHp).toBe(55);
```

#### Component tests

Assert on:

- what the user sees
- the exact data passed to the service layer

```ts
// BAD
expect(onConfirmMock).toHaveBeenCalled();
```

```ts
// GOOD
expect(onConfirmMock).toHaveBeenCalledWith(
  expect.objectContaining({
    proficiencies: expect.stringContaining(
      '"proficiencyBonus":3'
    ),
  })
);
```

#### Service/database tests

Assert on the exact row data written at the proper column indexes—not merely that a write function was invoked.

### When Mocking Is Acceptable

Appropriate uses:

- Network calls (`sheetsService`, `dbOperations` in component/hook tests)
- External dependencies (Google authentication)
- Browser APIs unavailable in jsdom

Not appropriate:

- The function currently under test
- Pure utility functions in `lib/`
- Zustand store behavior (prefer the real store or realistic state scenarios, then assert on resulting state changes)

### The Seam Test Standard

The highest-value tests in this project are **seam tests**—tests verifying the connection between the UI layer and the data layer.

For every form submission or inline edit:

1. Render the real component.
2. Simulate real user interaction.
3. Verify that the **complete** data object reaching the service layer contains the correct values in the correct fields.

A test that merely checks "the function was called" at the seam is **not acceptable**. It must verify **what** was passed.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix — `NewPlayerDialog`

#### Resource Pools

All five bugs have been resolved. See session history for details.

### 🟡 Features to Add

None.

### 🔵 Architecture / Technical Debt

#### Remaining Technical Debt

- `src/services/__tests__/dbOperations.test.ts` (24 tests) still mirrors the old pre-decomposition single-file structure and could optionally be split into per-module test files (`shared.test.ts`, `encounterLogs.test.ts`, `npcs.test.ts`, `characters.test.ts`, `encounterCombatants.test.ts`, `encounters.test.ts`) matching the new `src/services/dbOperations/` layout. This is organizational cleanup only — all 24 tests currently pass and there is no functional issue. Low priority, optional.
- `useCombatSync.ts` currently handles initiative, dead-NPC skipping, combat cancellation/end, combat log wiring, condition timers, and sheet persistence. It is a good candidate for future decomposition. See the detailed decomposition plan below.
- `NewPlayerDialog.tsx` (763 lines) is the largest .tsx file in the codebase and contains significant duplication with `NpcFormFields.tsx` and `LevelUpDialog.tsx`. See the decomposition plan below.

#### useCombatSync.ts Decomposition Plan (Finalized)

Confirmed architectural facts:
- `useAppState()` delegates directly to a single global Zustand store (`useDashboardStore`) — safe to call from multiple independent hook files with no desync risk.
- `concentrationPrompt` will stay as local React state (not moved to Zustand) — this reverses an earlier draft recommendation. Reasoning: it's purely transient UI-modal-visibility state, consumed only by `index.tsx` and its immediate children (`CasterAttributionDialog`), matching the existing local-state pattern already used for `isToolsModalOpen`/`isCheatSheetOpen`/`hpMode` in the same file. Confirmed via full grep of every consumer.
- Sub-hooks will use dependency injection, not internal cross-hook calls — `useCombatTurn` and `useCombatConcentration` receive `updateCombatant`/`removeCombatant` as parameters from the `useCombatSync` facade, rather than each independently calling `useCombatantMutations()`. This matches the existing precedent in this codebase: `useHealthChange` already receives `updateCombatant` as a parameter from `index.tsx`.
- `useCombatSync.ts` remains the single public-facing facade — `index.tsx` requires zero changes to its consumption code, since the facade instantiates and composes the four sub-hooks internally and returns the identical flattened API surface it already returns today.

Target file structure (all under `src/components/ActiveEncounterTab/hooks/`):
- `useCombatantMutations.ts` — `updateCombatant`, `removeCombatant`, `syncingIds`
- `useCombatLifecycle.ts` — `resetCombat`, `cancelCombat`, `rollInitForNPCs`, `handleCallInitiative`
- `useCombatTurn.ts` — `nextTurn` (receives `updateCombatant`/`removeCombatant` via injection)
- `useCombatConcentration.ts` — `concentrationPrompt` state, `handleConcentrationPrompt`, `handleSelectCaster` (receives `updateCombatant` via injection)
- `useCombatSync.ts` — thin facade only, instantiates and composes the four sub-hooks, returns unified API

Already completed (keep documented as done):
- `getNextActiveTurnIndex`, `calculateConditionAcModifier`, `calculateExhaustionHpCap` already extracted to `src/lib/combatLogic.ts` and in use.

Sequencing (each step requires `npx tsc --noEmit` + BATCH 5A as a minimum checkpoint, full 12-batch run only at the very end):
1. Extract `useCombatantMutations.ts`
2. Extract `useCombatLifecycle.ts`
3. Extract `useCombatTurn.ts`
4. Extract `useCombatConcentration.ts`
5. Test suite alignment check (fix `useCombatSync.test.ts` internals only if needed, no app logic changes)
6. Full 12-batch global verification

#### NewPlayerDialog.tsx Decomposition Plan (documented, not scheduled)

- **Current state**: 763 lines (confirmed via `wc -l`), the largest .tsx file in the codebase.
- **Confirmed duplication**:
  - The `IrvMultiSelect/StatBlock` wrapper pattern is duplicated between `NewPlayerDialog.tsx` and `NpcFormFields.tsx` (same components, same prop shapes).
  - The `getResourcePoolSuggestions` call-and-map pattern is duplicated between `NewPlayerDialog.tsx` and `LevelUpDialog.tsx`.

- **Proposed decomposition**:
  - `src/components/ui/ResourcePoolManager.tsx` — highest-value extraction. A ~160-line, self-contained, genuinely stateful-but-isolated block (lines 548-714) handling the add/edit/delete UI for resource pools, driven only by `formData.resourcePools` and its own local edit-mode state. Extracting this could benefit both `NewPlayerDialog.tsx` and `LevelUpDialog.tsx` since both implement similar resource pool logic independently. Note: the actual handler functions this UI block depends on (handleUpdateResourceCurrent, handleSaveEditResource, handleAddResource, handleDeleteResource, startEditResource) were referenced in the JSX but not yet located or quoted during discovery. Confirming their exact location and full implementation is a prerequisite before this extraction can begin.
  - `src/hooks/usePlayerFormAutomation.ts` (optional) — could consolidate the 6 `useEffect` hooks handling auto-suggested hit dice, resource pools, Bardic Inspiration pips, proficiency bonus sync, and saving throw proficiencies.
  - `IdentityTab.tsx/CombatTab.tsx` splits — lower priority, more presentational, smaller win.

- **Test coverage note**: current test file has only 5 tests, all behavioral (asserting on final `onConfirm` output), which should survive decomposition without rework — but low density means new tests should be added for any extracted subcomponent (especially `ResourcePoolManager`).

---

## TypeScript Build Check

Always run after making changes:

```bash
npx tsc -p tsconfig.build.json --noEmit
```

The exit code must be **0**.

Any TypeScript errors are blocking and must be resolved before proceeding.