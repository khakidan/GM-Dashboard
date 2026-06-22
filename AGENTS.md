# GM Dashboard — AI Agent Instructions

This file is the authoritative guide for
AI coding agents working on this project.
Read it completely before making any changes.

---

## Project Overview

A full-stack web application for Dungeons &
Dragons 5e Game Masters. The GM uses it to
run combat encounters, track party health and
resources, manage NPCs, and create an immersive
atmosphere with ambient audio. Built with React,
TypeScript, Vite, Tailwind CSS v4, and an
Express backend. Data is stored in Google
Sheets and accessed via the Google Sheets API
with OAuth2 authentication.

---

## The Golden Rule — Single Source of Truth

**Google Sheets is the database. The app is
the GUI.**

- Every character stat, NPC stat, encounter
  record, and combatant record lives in Google
  Sheets and nowhere else.
- When the GM makes a change in the UI, it
  writes to the sheet via `updateCharacterDB`
  → `queueWrite`.
- The Zustand store holds an in-memory cache
  of the sheet data for rendering speed. It is
  NOT the source of truth.

**What is allowed in localStorage:**
- UI preferences (active tab, theme)
- Audio configuration (volume, soundboard
  layout) — scoped per campaign
- Mood presets — scoped per campaign
- The write retry queue (for offline recovery)
- combatState for cross-tab Player View sync
- `hasInitialSynced` — always stored as false

**What is allowed in IndexedDB:**
- Audio file blobs — scoped per campaign using
  `gm_audio_files_{campaignId}` as the
  database name

**What is NOT allowed outside Sheets:**
- Character HP, conditions, stats
- NPC data
- Encounter data
- Resource pools
- Anything that should persist across sessions
  or devices

---

## Architecture — Layer Dependency Rules
lib/          Pure utilities. No React, no

imports from other layers.

↓

services/     Network calls to Google Sheets

API. Imports from lib only.

↓

hooks/        Zustand store + React hooks.

Imports from lib and services.

↓

components/   UI only. Imports from hooks,

lib, and other components.

Never imports from services

directly.

Violations of this dependency direction are
bugs. A component should never call
`sheetsService` directly — it calls a hook
which calls a service.

---

## Google Sheets Schema

### Characters (A2:Y — 25 columns)

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

### NPCs (A2:P — 16 columns)

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
| I | 8 | resistances | Comma-separated |
| J | 9 | immunities | Comma-separated |
| K | 10 | vulnerabilities | Comma-separated |
| L | 11 | legendaryActions | Number, default 0 |
| M | 12 | legendaryResistances | Number, default 0 |
| N | 13 | rechargeAbilities | JSON string |
| O | 14 | abilityScores | JSON string |
| P | 15 | proficiencies | JSON string |

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

### Status (read-only)
IDs: 1=Active, 2=Inactive, 3=Deceased

### Difficulty_Level (read-only)
IDs: 1=Easy, 2=Medium, 3=Hard, 4=Deadly

---

## Campaign Creation

`POST /api/campaigns/create` in
`src/server/routes/campaigns.ts` creates all
6 sheets with the correct headers. When adding
a column to any sheet, update this endpoint
too or existing campaigns will have the wrong
schema.

---

## Key Files Reference

### src/lib/
- `constants.ts` — OVERLAY_DURATIONS,
  ANIMATION_TIMING, SHEET_RANGES,
  WRITE_QUEUE, STORAGE_KEYS, TIMERS,
  MOODS, AUDIO, `campaignKey()` helper
- `sheetSchemas.ts` — Zod validation for
  each sheet row. Defines defaults for every
  column.
- `sheetAdapters.ts` — Maps raw row arrays
  from the API into typed model objects
- `sheetSyncParser.ts` — Validates full
  campaign workbooks on initial sync
- `combatLogic.ts` — HP/damage/healing math,
  IRV application, health status calculation
- `combatantBuilder.ts` — Pure function that
  builds combatant state from characters +
  npcs + encounterCombatants
- `classResources.ts` — Pre-defined D&D class resource pool templates and `getClassResourceSuggestions()` helper
- `hitDice.ts` — Hit dice parsing, spending,
  recovery. Includes `CLASS_HIT_DIE_MAP`
- `resourcePools.ts` — ResourcePool interface,
  parse/serialize/spend/recover/reset/add/
  remove/update. Includes `EFFECT_RESOURCE_MAP`
  for auto-decrement when effects are applied
- `concentrationCheck.ts` — `concentrationCheckDc()`,
  `isConcentrating()`, `fireConcentrationAlert()`
- `conditionDefinitions.ts` — CONDITION_MECHANICS
  booleans for every condition
- `conditionDescriptions.ts` — Official D&D
  5e rules text for 35+ conditions and effects.
  Powers the ConditionPopover component
- `conditions/index.ts` — Barrel export for
  all condition-related exports
- `irvOptions.ts` — CONDITION_OPTIONS,
  EFFECT_OPTIONS, CONCENTRATION_EFFECTS,
  CONDITION_IMMUNITY_MAP, IRV_OPTIONS
- `audioFileStore.ts` — IndexedDB persistence
  for audio blobs, scoped per campaign
- `diceRoller.ts` — Parses dice notation
  (e.g. 1d20+5) and generates results
- `utils.ts` — tailwind-merge helper

### src/services/
- `dbOperations.ts` — All CRUD for all sheets.
  Accepts `spreadsheetId` as first param with
  `.env` fallback. Note: `arg1: any` in
  overloads is a deliberate decision.
- `sheetsService.ts` — Raw Google Sheets API
  calls
- `writeQueue.ts` — FIFO queue with
  localStorage retry. Typed values only:
  `(string|number|boolean|null)[][]`
- `googleAuth.ts` — OAuth2 flow with Google
  Identity Services

### src/hooks/
- `dashboardStore.ts` — Single Zustand store.
  Holds: characters, npcs, encounters,
  encounterCombatants, statuses, difficulties,
  campaign context, combatState. Has
  localStorage persistence.
- `useAppState.ts` — Thin wrapper re-exporting
  `useDashboardStore`
- `useCampaign.ts` — createCampaign,
  connectCampaign, openCampaign, deleteCampaign,
  closeCampaign, extractSpreadsheetId
- `useSheetSync.ts` — Full campaign workbook
  pull and Zustand population
- `useEncounterLifecycle.ts` — Combat setup,
  initiative, round advancement, battle end
- `useEncounterResume.ts` — Detects and
  restores in-progress encounters on sync
- `useAudioEngine.ts` — Two-deck crossfade,
  IndexedDB audio, ambient + sound effects.
  Called ONCE in GMDashboard only.
- `useMoodPresets.ts` — 5 mood categories,
  one-to-one track assignment, campaign-scoped
- `useDashboardShortcuts.ts` — Global keyboard
  events and mood shortcuts (Alt+1–5)
- `useDeathSaves.ts` — Death saving throw
  state and stabilization logic
- `useNetworkState.ts` — Online/offline
  detection, triggers write retry
- `useTabState.ts` — Active navigation tab
  with localStorage persistence
- `useSettings.ts` — App config, JSON export

### src/server/routes/
- `campaigns.ts` — `POST /api/campaigns/create`
  provisions all 6 sheets with correct headers
- `auth.ts` — Proxies OAuth token exchanges
  (keeps secrets off the client)
- `health.ts` — Health check endpoint

### src/components/
- `GMDashboard.tsx` — Root shell. Calls
  `useAudioEngine(campaign.id)` and
  `useMoodPresets(campaign.id)` exactly once.
- `GMDashboardSidebar.tsx` — Permanent icon
  sidebar with hover tooltips via SidebarIcon
- `GMTabContent.tsx` — Routes sidebar
  selection to: PartyTab, EncountersTab,
  NpcLibraryTab, ActiveEncounterTab,
  SettingsPage
- `CampaignSelector.tsx` — Pre-dashboard
  launcher for campaign create/connect/switch
- `PlayerView.tsx` — Cross-tab broadcast
  view for a second monitor
- `CommandPalette.tsx` — Cmd+K global search
- `AudioPanel.tsx` — M key modal: AMBIENT /
  SOUNDBOARD / LIBRARY tabs
- `AmbientPlayer.tsx` — Mood presets + track
  list + volume
- `Soundboard.tsx` — 3×4 configurable sound
  effect grid, campaign-scoped layout
- `AudioLibrary.tsx` — Tabbed audio file
  manager with drag-drop and mood assignment

### src/components/ui/
- `ConditionChips.tsx` — Condition/effect
  chip input with popover, immunity checking,
  timer prompts, and `onConditionAdded`
  callback for resource auto-decrement
- `ConditionPopover.tsx` — Hover popover
  showing official rules text for any
  condition or effect
- `IrvMultiSelect.tsx` — Compact multi-select
  for resistances/immunities/vulnerabilities

### src/components/PartyTab/
- `ResourcePoolsSection.tsx` — Shared pip
  tracker UI used in both CharacterCardExpanded
  and CombatantCardExpanded
- `CharacterResourceSection.tsx` — Condition
  chips with `onConditionAdded` → auto-
  decrements matching resource pools
- `hooks/useParty.ts` — Character CRUD,
  handleLongRest, handleShortRest (both reset
  resource pools appropriately)

### src/components/ActiveEncounterTab/
- `CombatantCardHeader.tsx` — Compact
  `[-] N/M [+]` counter row for ALL resource
  pools on PC combatant cards (collapsed view)
- `CombatantCardExpanded.tsx` — Full
  ResourcePoolsSection for PC combatants
- `hooks/useHealthChange.ts` — Damage/heal
  with IRV math. Fires `fireConcentrationAlert`
  when a concentrating combatant takes damage.
- `hooks/useBatchActions.ts` — Batch
  damage/heal/condition/delete

### src/components/NpcLibraryTab/
- `NpcFormFields.tsx` — Shared form component
  used in NewNpcDialog AND CombatSidebar
  Create NPC tab. Must stay in sync.

---

## handleUpdate Whitelist (useParty.ts)

The following fields are accepted by
`handleUpdate` and write to the sheet:
`playerName`, `characterName`, `class`, `ac`,
`maxHp`, `tempHp`, `currentHp`, `conditions`,
`passivePerception`, `level`, `statusId`,
`notes`, `resistances`, `immunities`,
`vulnerabilities`, `tempAc`, `deathSavesFails`,
`deathSavesSuccesses`, `hitDiceConfig`,
`hitDiceUsed`, `resourcePools`, `abilityScores`,
`proficiencies`

When adding a new character field, add it to
this whitelist and to `dbOperations.ts`.

---

## Testing Structure — 13-Batch System

**Current baseline: 1087 tests.**
All batches must pass with zero failures.
No batch should exceed 35 seconds.

Run each batch individually. Never chain
with `&&`. Never use glob patterns. Never
run all tests at once with `npx vitest run`.

```bash
# BATCH 1
npx vitest run src/lib/__tests__

# BATCH 2
npx vitest run src/services/__tests__

# BATCH 3
npx vitest run src/hooks/__tests__

# BATCH 4
npx vitest run src/server/__tests__ src/__tests__

# BATCH 5A
npx vitest run src/components/ActiveEncounterTab/__tests__/useBatchActions.test.ts src/components/ActiveEncounterTab/__tests__/useCombatSync.test.ts src/components/ActiveEncounterTab/__tests__/useCombatantCard.test.ts src/components/ActiveEncounterTab/__tests__/useEncounterPresetLoader.test.ts src/components/ActiveEncounterTab/__tests__/useHealthChange.test.ts src/components/ActiveEncounterTab/__tests__/useSelectionMode.test.ts

# BATCH 5B
npx vitest run src/components/ActiveEncounterTab/__tests__/AddNpcCollision.test.tsx src/components/ActiveEncounterTab/__tests__/CasterAttributionDialog.test.tsx src/components/ActiveEncounterTab/__tests__/CombatHeader.test.tsx src/components/ActiveEncounterTab/__tests__/CombatSidebar.test.tsx src/components/ActiveEncounterTab/__tests__/CombatantCard.test.tsx src/components/ActiveEncounterTab/__tests__/KeyboardShortcuts.test.tsx src/components/ActiveEncounterTab/__tests__/MultiTargetActionPanel.test.tsx src/components/ActiveEncounterTab/__tests__/ShortcutCheatSheet.test.tsx src/components/ActiveEncounterTab/__tests__/index.test.tsx

# BATCH 6A
npx vitest run src/components/PartyTab/__tests__ src/components/EncountersTab/__tests__

# BATCH 6B
npx vitest run src/components/NpcLibraryTab/__tests__

# BATCH 7A
npx vitest run src/components/__tests__/DeathOverlay.test.tsx src/components/__tests__/DamageOverlay.test.tsx src/components/__tests__/HealOverlay.test.tsx src/components/__tests__/RageOverlay.test.tsx src/components/__tests__/UnconsciousOverlay.test.tsx src/components/__tests__/InitiativeOverlay.test.tsx

# BATCH 7B-1
npx vitest run src/components/__tests__/AmbientPlayer.test.tsx src/components/__tests__/AudioLibrary.test.tsx src/components/__tests__/AudioPanel.test.tsx src/components/__tests__/CommandPalette.test.tsx src/components/__tests__/ErrorBoundary.test.tsx src/components/__tests__/GMDashboard.test.tsx src/components/__tests__/GMDashboardSidebar.test.tsx

# BATCH 7B-2
npx vitest run src/components/__tests__/CampaignSelector.test.tsx src/components/__tests__/GMLoadingScreen.test.tsx src/components/__tests__/GMTabContent.test.tsx src/components/__tests__/NpcLibraryTab.test.tsx src/components/__tests__/PlayerView.test.tsx src/components/__tests__/SettingsModal.test.tsx src/components/__tests__/SidebarIcon.test.tsx src/components/__tests__/Soundboard.test.tsx src/components/__tests__/SyncStatusIndicators.test.tsx src/components/__tests__/ThemeContext.test.tsx

# BATCH 8
npx vitest run src/components/ui/__tests__
```

### Where new test files go

| New test covers | Add to batch |
|-----------------|-------------|
| src/lib/ | Batch 1 (auto-picked up) |
| src/services/ | Batch 2 (auto-picked up) |
| src/hooks/ | Batch 3 (auto-picked up) |
| AET hook (.test.ts) | Add to Batch 5A explicitly |
| AET component (.test.tsx) | Add to Batch 5B explicitly |
| PartyTab or EncountersTab | Batch 6A (auto-picked up) |
| NpcLibraryTab | Batch 6B (auto-picked up) |
| Overlay component | Add to Batch 7A explicitly |
| Audio or main dashboard | Add to Batch 7B-1 explicitly |
| Other top-level component | Add to Batch 7B-2 explicitly |
| src/components/ui/ | Batch 8 (auto-picked up) |

---

## Patterns and Conventions

### Optimistic update pattern

Every mutation follows this sequence:

1. Snapshot current Zustand state
2. Apply change optimistically to Zustand store
3. Update UI immediately (zero perceived latency)
4. Call `updateCharacterDB` (or equivalent)
   which calls `queueWrite`
5. On success: nothing more needed
6. On failure: revert Zustand to snapshot,
   show Sonner toast, cache to
   `STORAGE_KEYS.writeRetryQueue`

### Write queue

`writeQueue.ts` batches API calls to avoid
rate limits. It polls on an interval defined
by `TIMERS.writeQueuePollingMs`. Pending
writes survive page refresh via localStorage.
When the browser comes back online,
`retryPersistedWrites()` is called
automatically.

### Campaign-scoped storage

Every localStorage key and IndexedDB name
must be scoped to the campaign:
- Use `campaignKey(key, campaignId)` from
  `constants.ts` for localStorage
- Use `gm_audio_files_{campaignId}` for
  IndexedDB audio

Never use a bare localStorage key that is
the same across all campaigns.

### Concentration check

When any combatant or character with the
`concentrating` condition takes damage:
- Call `concentrationCheckDc(damage)` to
  get the DC
- Call `fireConcentrationAlert(name, damage)`
  to show the Sonner toast
- This fires in `useHealthChange.ts` for
  combat and in `useParty.ts` for party tab
  HP changes
- Each source fires independently. No
  double-firing between tabs.

### Resource pool auto-decrement

When certain effects are applied via
`ConditionChips`, the `onConditionAdded`
callback fires. If `getResourceForEffect()`
returns a non-null resource name, the
matching pool is decremented by 1 and saved.

Current mappings (from `EFFECT_RESOURCE_MAP`):
- `raging` → `rage`
- `wild shaped` → `wild shape`
- `action surge (used)` → `action surge`
- `second wind (used)` → `second wind`
- `bardic inspiration (given)` →
  `bardic inspiration`

---

## Architectural Decisions

**resourcePools stored as JSON string (not
separate columns):** Class resources vary
wildly by class, subclass, and level. A JSON
column in the sheet allows any combination of
named pools without schema changes. The schema
stays clean and works across all character
builds including homebrew.

**Audio engine lives in GMDashboard, not in
tabs:** Audio must continue uninterrupted as
the GM navigates between tabs. If the engine
lived in a tab component it would unmount and
remount on every tab switch, cutting off music.
`useAudioEngine` is called exactly once at the
root level.

**Express backend for OAuth:** Google OAuth
client secrets must never reach the browser.
The Express server handles the auth code →
token exchange, keeping credentials server-side.

**HashRouter:** Ensures routes work when the
app is served from any path. Previously used
for Tauri desktop wrapping; now retained
because it simplifies deployment.

## Workflows

### Add Player Workflow (`NewPlayerDialog.tsx`)
A 4-tab complex form for creating new characters manually:
1. **Identity:** Name, Character Name, Class, Level, Status
2. **Combat Stats:** AC, Max HP, Hit Dice, IRV, Notes
3. **Abilities:** Ability Scores (calculates passive perception and proficiency bonus automatically)
4. **Resources:** Manage Resource Pools (auto-suggests pools based on Identity Tab Class input, stores via `poolsCustomized` ref to avoid overwriting manual changes when class changes again)
- Submits as a single flat Character record matching the Google Sheets schema.

---

## Hard Rules — Never Violate These

1. **Google Sheets is the SSOT.** Never store
   character/NPC/encounter data anywhere else.

2. **Dependency direction is one-way:**
   lib ← services ← hooks ← components.
   A component never imports from services.

3. **Test batches are fixed.** Never chain
   batches with `&&`, never use glob patterns,
   never run `npx vitest run` without
   specifying files/directories, never
   reorganize which tests are in which batch
   without updating AGENTS.md.

4. **Never delete tests instead of fixing
   them.** If a test fails after a refactor,
   update it to match the new behavior. Deleting
   it removes coverage.

5. **Do not use `.toBeDefined()` or
   `.toBeTruthy()` on DOM elements.** Use
   `.toBeInTheDocument()` instead.

6. **One `useAudioEngine` call.** It lives in
   GMDashboard.tsx. Do not call it in any
   other component.

7. **NpcFormFields is shared.** Any field
   added to NPC creation in NewNpcDialog must
   also appear in the CombatSidebar Create NPC
   tab because they share NpcFormFields.tsx.

8. **Campaign creation must stay in sync.**
   When adding a column to any sheet, update
   the `POST /api/campaigns/create` endpoint
   to include the new column header. Otherwise
   new campaigns will have the wrong schema.

9. **Report all 13 batch counts individually**
   after any change. Never report a combined
   total without the per-batch breakdown.

10. **Delete root-level scripts immediately.**
    Any `fix*.cjs`, `scan*.ts`, or `replace.js`
    files found in the project root must be
    deleted. They are diagnostic artifacts.

---

## TypeScript Build Check

Always run after making changes:

```bash
npx tsc -p tsconfig.build.json --noEmit
```

Exit code must be 0. Any type errors are
blocking — do not proceed until resolved.
