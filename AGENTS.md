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

## Style Guide

For all user interface styling, components, colors, and layout guidelines, refer to [STYLE_GUIDE.md](STYLE_GUIDE.md). This guide was revised in this session to add the Command Palette section, the Slate Dark color token, and the ReferenceDetailDialog badges/panels. All new UI developments must strictly adhere to the defined "Minimalist Sleek" aesthetic and contrast guidelines.

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

```
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
```

Violations of this dependency direction are
bugs. A component should never call
`sheetsService` directly — it calls a hook
which calls a service.

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

  NpcTrait: { name, description }

  NpcAction: { name, description,
    attackBonus?, damage?, saveDC?,
    saveType?, range?, recharge? }

  NpcReaction: { name, description }

  NpcLegendaryAction: { name, description,
    cost?, attackBonus?, damage?,
    saveDC?, saveType? }

Note: `immunities` (col J) stores BOTH damage
immunities and condition immunities as a
comma-separated string. There is no separate
conditionImmunities column.

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

- `src/index.css` — Global stylesheet. Note that the sleek-modern block is now structural-only (font, radius, shadows, button interactions). All parchment/gold override rules have been removed.

### src/lib/
- `constants.ts` — OVERLAY_DURATIONS,
  ANIMATION_TIMING, SHEET_RANGES,
  WRITE_QUEUE, STORAGE_KEYS, TIMERS,
  MOODS, AUDIO, `campaignKey()` helper
- `sheetSchemas.ts` — Zod validation for
  each sheet row. Defines defaults for every
  column. NPC schema covers 25 columns (0–24).
- `sheetAdapters.ts` — Maps raw row arrays
  from the API into typed model objects
- `sheetSyncParser.ts` — Validates full
  campaign workbooks on initial sync. Note
  the addition of parseConditions and
  parseSpells functions alongside the
  existing parseNPCs.
- `combatLogic.ts` — HP/damage/healing math,
  IRV application, health status calculation
- `combatantBuilder.ts` — Pure function that
  builds combatant state from characters +
  npcs + encounterCombatants. Combatant type
  includes class, level, abilityScores,
  proficiencies, and all 8 NPC stat block
  fields (speed, senses, languages,
  challengeRating, traits, actions, reactions,
  legendaryActionsList) passed through from
  the NPC source. Includes `buildSingleNpcCombatant()`
  helper for adding NPC instances to combat.
- `classResources.ts` — CLASS_RESOURCE_SUGGESTIONS
  mapping for 13 standard 5e classes and
  `getClassResourceSuggestions()` helper. Now
  includes Rogue (Sneak Attack d6), updated
  Paladin (Lay on Hands), and updated Warlock
  (Warlock Spell Slots, short rest). Pools that
  unlock after level 1 (Ki Points, Sorcery
  Points, Action Surge, Channel Divinity) are
  absent from level 1 suggestions and appear
  automatically via `getResourcePoolSuggestions`
  on level up. Returns deep-copied
  ResourcePool[] suggestions. Returns [] for
  unknown/custom classes (e.g. Vitalist).
- `hitDice.ts` — Hit dice parsing, spending,
  recovery. Includes `CLASS_HIT_DIE_MAP`
- `resourcePools.ts` — ResourcePool interface
  (`{ name, current, max, reset }`),
  parse/serialize/spend/recover/reset/add/
  remove/update. Includes `EFFECT_RESOURCE_MAP`
  for auto-decrement when effects are applied.
  Note: the rest field is named `reset`
  (not `restoreOn`).
- `resourcePoolScaling.ts` — Level-based
  resource pool scaling. Exports
  `ResourcePoolSuggestion` interface,
  `POOL_LEVEL_TABLES` (covering 8 pools: Rage,
  Ki Points, Sorcery Points, Action Surge,
  Channel Divinity, Lay on Hands, Warlock
  Spell Slots, and Sneak Attack (d6)),
  `getAutoScaledMax()`, and
  `getResourcePoolSuggestions()`. All values
  follow D&D 5e 2014 rules. Used by
  LevelUpDialog to pre-fill pool max suggestions
  when a character levels up. Returns both
  scaled existing pools and new pools the
  character should gain at the new level.
- `spellcasting.ts` — Spellcasting stat
  utilities. Exports `SpellcastingAbility`
  type (`'STR'|'DEX'|'CON'|'INT'|'WIS'|'CHA'|null`),
  `SPELLCASTING_ABILITY_MAP` (12 classes),
  `CLASS_SAVING_THROW_MAP` (a Record mapping
  each class name to its two 2014 PHB saving
  throw proficiencies as AbilityName[]),
  `getAutoSpellcastingAbility()`,
  `getEffectiveSpellcastingAbility()`,
  `calculateSpellSaveDC()`, and
  `calculateSpellAttackBonus()`. Note: ability
  score keys are uppercase (STR, DEX, etc.)
  to match the AbilityScores type.
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
- `abilityScores.ts` — AbilityScores and
  Proficiencies types, `calculateModifier()`,
  `proficiencyBonusFromLevel()`, `proficiencyBonusFromCR()`,
  skill/save helpers, parse/serialize helpers.
  Proficiencies includes optional
  `spellcastingAbility?: SpellcastingAbility`
  for GM override of auto-derived caster stat,
  and an optional `toughFeat?: boolean` field
  (defaulting to false in DEFAULT_PROFICIENCIES).
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
  pull and Zustand population. Note that sync
  now also fetches Conditions!A2:C and
  Spells!A2:N, wrapped in try/catch since
  older campaigns may not have these tabs.
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

### src/test-utils/fixtures/
Shared test data factories used across many
test files. Not tests themselves.
- `characterFixtures.ts` — Mock Character
  objects for use in component and hook tests
- `combatantFixtures.ts` — Mock Combatant
  objects for use in ActiveEncounterTab tests

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
- `ReferenceDataSeeder.tsx` — Settings page
  button that one-time seeds the Conditions and
  Spells sheet tabs from the open5e public API
  (SRD content). Manual trigger only, idempotent
  (checks for existing data before writing).
- `ReferenceDetailDialog.tsx` — Modal shown
  when a condition or spell is selected from
  CommandPalette search. Displays full rules
  text and spell metadata (level, school,
  components, concentration/ritual badges).
- `CommandPalette.tsx` — Cmd+K global search.
  Now also searches Conditions and Spells
  reference data (only shown after 2+ characters
  typed), in addition to its existing
  navigation/action commands.
- `AudioPanel.tsx` — M key modal: AMBIENT /
  SOUNDBOARD / LIBRARY tabs
- `AmbientPlayer.tsx` — Mood presets + track
  list + volume
- `Soundboard.tsx` — 3×4 configurable sound
  effect grid, campaign-scoped layout
- `AudioLibrary.tsx` — Tabbed audio file
  manager with drag-drop and mood assignment
- `SettingsPage.tsx` — Settings page layout with SheetConnectionSettings full width, Auth + Backup in a 2-column grid, and GMTestingTools full width.

### src/components/auth/
- `AuthPortalSettings.tsx` — Auth portal
  configuration UI
- `AuthRelay.tsx` — OAuth relay handler

### src/components/ui/ (shared components)
- `CardNumberInput.tsx` — Local-state wrapper for
  numeric inline edit fields on character and NPC cards.
  Commits on blur or Enter, reverts to
  last valid value if cleared without
  entering a number. Used by
  CharacterCardExpanded and NpcCard.
  Same pattern as AbilityScoreInput but
  without the 1-30 clamp and with a
  configurable fallback value.
- `ConditionChips.tsx` — Condition/effect
  chip input with popover, immunity checking,
  timer prompts, and `onConditionAdded`
  callback for resource auto-decrement
- `ConditionPopover.tsx` — Hover popover
  showing official rules text for any
  condition or effect
- `IrvMultiSelect.tsx` — Compact multi-select
  for resistances/immunities/vulnerabilities
- `StatBlock.tsx` — Orchestrator (117 lines).
  Delegates rendering to four subcomponents:
  StatBlockScores.tsx, StatBlockSaves.tsx,
  StatBlockPassive.tsx, StatBlockSkills.tsx.
  All five live in src/components/ui/.
- `NpcFormFields.tsx` — Shared form fields
  used in both NewNpcDialog AND CombatSidebar
  Create NPC tab. Must stay in sync with both
  usage sites. Now contains internal 4-tab
  navigation (Identity, Combat, Abilities,
  Stat Block) with tab state living inside
  the component. External API (data, onChange,
  errors, compact props) is unchanged.
  Contains: plain text fields
  (name, AC, HP, notes, IRV, CR, speed,
  senses, languages) and four list editors
  (traits, actions, reactions, legendary
  actions) using NpcListEditor. Note that
  rechargeAbilities has been removed from
  NpcFormData, DEFAULT_NPC_FORM_DATA, and
  all associated handlers. Recharge is now
  defined solely via the recharge field on
  NpcAction entries in the actions JSON.
- `NpcListEditor.tsx` — Generic list editor
  component used by NpcFormFields for traits,
  actions, reactions, and legendary actions.
  Generic over `T extends { name: string }`.
  Each entry renders via a `renderFields` prop
  and has an Add/Remove affordance.
- `NpcStatBlockSection.tsx` — Pure display
  component for one section of an NPC stat
  block (traits, actions, reactions, or
  legendary actions). Accepts `title` and
  `items[]` with optional `meta` per item.
  Also exports `formatActionMeta(action)` which
  builds a compact mechanical summary string
  from NpcAction fields (attackBonus, damage,
  saveDC, saveType, range, recharge). Returns
  null when items is empty.
- `ResourcePoolsSection.tsx` — Shared pip
  tracker UI used in both CharacterCardExpanded
  (PartyTab) and CombatantCardExpanded
  (ActiveEncounterTab). Lives in ui/ because
  it crosses feature boundaries.
- `SpellcastingStatsRow.tsx` — Displays Spell
  Save DC and Spell Attack Bonus inline on
  character and NPC cards. Accepts an optional
  `onOverrideChange` prop: when provided
  (Party tab, NPC Library expanded sections),
  renders a spellcasting ability override
  dropdown; when absent (Active Encounter),
  renders read-only. Non-casters with no
  override render nothing (returns null).
- `DebouncedInput.tsx` — Standard debounced
  input (light parchment theme)
- `DebouncedTextarea.tsx` — Standard debounced
  textarea (light parchment theme)

### src/components/PartyTab/
- `CharacterResourceSection.tsx` — Condition
  chips with `onConditionAdded` → auto-
  decrements matching resource pools
- `hooks/useParty.ts` — Character CRUD,
  handleLongRest, handleShortRest (both reset
  resource pools appropriately)
- `LevelUpDialog.tsx` — Level-up flow.
  Writes: level, class, hitDiceConfig, maxHp,
  currentHp, ac, passivePerception,
  resistances, immunities, vulnerabilities,
  notes, proficiencies, resourcePools.
  HP increase is now entered as a dice roll
  input (not a Max HP total). CON modifier is
  auto-added with helper text. Tough feat
  checkbox persists hasToughFeat in the
  proficiencies JSON (col Y) as toughFeat:
  boolean. The Resource Pools section shows
  pre-filled scaling suggestions (via
  `getResourcePoolSuggestions`) that the GM
  can edit before confirming. New pools the
  character should gain at the new level are
  suggested with an include toggle.
- `NewPlayerDialog.tsx` — 4-tab complex form
  for creating new characters manually. All
  Identity tab form inputs now have proper id
  and htmlFor attributes for accessibility.

### src/components/ActiveEncounterTab/
- `CombatantCardHeader.tsx` — Compact
  `[-] N/M [+]` counter row for ALL resource
  pools on PC combatant cards (collapsed view)
- `CombatantCardExpanded.tsx` — Full
  ResourcePoolsSection for PC combatants
- `NpcReferencePanel.tsx` — Collapsible stat
  block reference panel shown on NPC combatant
  cards during active encounters. Manages its
  own open/closed state. Renders nothing if
  the combatant has no stat block content.
  Toggle button reads "▶ Stat Block" /
  "▼ Stat Block". Displays CR, speed, senses,
  languages, and all four NpcStatBlockSection
  lists when expanded. Import
  NpcStatBlockSection and formatActionMeta
  from src/components/ui/NpcStatBlockSection.
- `CombatMechanicsSummary.tsx` — Pure
  presentational component rendering the
  combat mechanics status grid (speed locks,
  advantage/disadvantage indicators, auto-fail
  warnings) from a mechanicalSummary object.
  No store access.
- `CombatantIrvDisplay.tsx` — Read-only
  display for a combatant's Resistances,
  Immunities, and Vulnerabilities.
- `hooks/useDeathSaves.ts` — Death saving
  throw state and stabilization logic.
- `hooks/useCombatantExpanded.ts` — Encapsulates
  the resource pool update handler and the
  condition-triggered resource depletion
  handler (onConditionAdded). Used by
  CombatantCardExpanded.
- `hooks/useHealthChange.ts` — Damage/heal
  with IRV math. Fires `fireConcentrationAlert`
  when a concentrating combatant takes damage.
- `hooks/useBatchActions.ts` — Batch
  damage/heal/condition/delete
- `hooks/useCombatSync.ts` — Turn/round/
  combatant sync. NPC initiative uses DEX
  modifier (1d20 + DEX mod).
- `hooks/useEncounterKeyboard.ts` — Global
  keyboard shortcuts for combat. Pressing
  Escape now correctly calls exitSelectionMode
  in addition to clearing expandedIds and
  closing modals.

### src/components/NpcLibraryTab/
- `NpcCard.tsx` — NPC library card. Expanded
  view shows: StatBlock, SpellcastingStatsRow,
  editable stat fields (AC, HP, IRV, etc.),
  and read-only display of all stat block
  sections (CR, speed, senses, languages,
  traits, actions, reactions, legendary
  actions) via NpcStatBlockSection.
- `NewNpcDialog.tsx` — NPC creation dialog.
  Uses NpcFormFields from ui/.

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

## Testing Structure — 12-Batch System

**Current baseline: 623 tests.**
All batches must pass with zero failures.
No batch should exceed 35 seconds.

Run each batch individually. Never chain
with `&&`. Never use glob patterns. Never
run all tests at once with `npx vitest run`.

| Batch | Description | Test Count |
|-------|-------------|------------|
| 1     | Lib         | 420        |
| 2     | Services    | 29         |
| 3     | Hooks       | 32         |
| 4     | Server      | 7          |
| 5A    | AET Hooks   | 36         |
| 5B    | AET Comp    | 23         |
| 6A    | PartyTab    | 38         |
| 6B    | Encounters  | 8          |
| 6C    | NpcLibrary  | 13         |
| 7B-1  | Top-Level 1 | 11         |
| 7B-2  | Top-Level 2 | 4          |
| 8     | UI          | 2          |
| **Total** | | **623** |

```bash
# BATCH 1 — 420 tests
npx vitest run src/lib/__tests__

# BATCH 2 — 29 tests
npx vitest run src/services/__tests__

# BATCH 3 — 32 tests
npx vitest run src/hooks/__tests__

# BATCH 4 — 7 tests
npx vitest run src/server/__tests__ src/__tests__

# BATCH 5A — 36 tests
npx vitest run src/components/ActiveEncounterTab/__tests__/useBatchActions.test.ts src/components/ActiveEncounterTab/__tests__/useCombatSync.test.ts src/components/ActiveEncounterTab/__tests__/useCombatantCard.test.ts src/components/ActiveEncounterTab/__tests__/useEncounterPresetLoader.test.ts src/components/ActiveEncounterTab/__tests__/useHealthChange.test.ts src/components/ActiveEncounterTab/__tests__/useSelectionMode.test.ts

# BATCH 5B — 23 tests
npx vitest run src/components/ActiveEncounterTab/__tests__/AddNpcCollision.test.tsx src/components/ActiveEncounterTab/__tests__/CasterAttributionDialog.test.tsx src/components/ActiveEncounterTab/__tests__/CombatHeader.test.tsx src/components/ActiveEncounterTab/__tests__/CombatSidebar.test.tsx src/components/ActiveEncounterTab/__tests__/CombatantCard.test.tsx src/components/ActiveEncounterTab/__tests__/KeyboardShortcuts.test.tsx src/components/ActiveEncounterTab/__tests__/MultiTargetActionPanel.test.tsx src/components/ActiveEncounterTab/__tests__/NpcReferencePanel.test.tsx src/components/ActiveEncounterTab/__tests__/ShortcutCheatSheet.test.tsx src/components/ActiveEncounterTab/__tests__/index.test.tsx

# BATCH 6A — 38 tests
npx vitest run src/components/PartyTab/__tests__

# BATCH 6B — 8 tests
npx vitest run src/components/EncountersTab/__tests__

# BATCH 6C — 13 tests
npx vitest run src/components/NpcLibraryTab/__tests__

# BATCH 7B-1 — 11 tests
npx vitest run src/components/__tests__/CommandPalette.test.tsx src/components/__tests__/ErrorBoundary.test.tsx src/components/__tests__/GMDashboard.test.tsx src/components/__tests__/GMDashboardSidebar.test.tsx

# BATCH 7B-2 — 4 tests
npx vitest run src/components/__tests__/CampaignSelector.test.tsx src/components/__tests__/GMTabContent.test.tsx src/components/__tests__/PlayerView.test.tsx src/components/__tests__/ThemeContext.test.tsx

# BATCH 8 — 2 tests
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
| PartyTab | Batch 6A (auto-picked up) |
| EncountersTab | Batch 6B (auto-picked up) |
| NpcLibraryTab | Batch 6C (auto-picked up) |
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

### Recharge pattern

When defining a recharge ability in an NPC,
parseRechargeOn accepts both full format
('Recharge 5-6') and bare format ('5-6',
'5-', '6', '4-6'). The GM should enter
bare format in the recharge field. Do not
revert to requiring the 'Recharge' prefix.

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

### Spellcasting stats display

`SpellcastingStatsRow` derives Spell Save DC
and Spell Attack Bonus from abilityScores +
proficiencyBonus. The spellcasting ability is
resolved in this priority order:
1. `proficiencies.spellcastingAbility` override
   (if the key exists, even if null — null means
   the GM has explicitly marked as non-caster)
2. Auto-derived from class via
   `SPELLCASTING_ABILITY_MAP` in spellcasting.ts
3. If neither resolves, the row renders nothing

The undefined vs null distinction is critical:
- `undefined` = no override set (auto-derive)
- `null` = override explicitly set to none
  (non-caster override, beats auto-derive)

Do not flatten both to null in any handler.

NPC spellcastingAbility is stored at col Y (index 24) and read back via SHEET_RANGES.npcs = 'NPCs!A2:Y'. NpcCard's onOverrideChange dual-writes to both spellcastingAbility (col Y) and proficiencies JSON for resilience. Do not revert SHEET_RANGES.npcs to A2:X.

Character spellcastingAbility is stored at col Z (index 25) and also embedded in the proficiencies JSON at col Y. Both paths are written by CharacterCardExpanded's onOverrideChange handler. SHEET_RANGES.characters = 'Characters!A2:Z' reads both. Do not revert the read range to A2:Y.

### Resource pool scaling on level-up

`LevelUpDialog` calls `getResourcePoolSuggestions(
  character.class, newLevel, currentPools
)` to produce pre-filled pool suggestions.
The GM sees all pools with editable max values
and can include/exclude new pools before
confirming. On confirm, `resourcePools` is
included in the `onConfirm` updates object
alongside the other level-up fields.

### NPC stat block display

NPC stat blocks are stored as JSON strings in
columns U–X. They are displayed in two places:
1. NPC Library card expanded view — via
   `NpcStatBlockSection` (src/components/ui/)
2. Active Encounter combatant cards — via
   `NpcReferencePanel` (collapsible panel,
   NPC combatants only)

`formatActionMeta(action: NpcAction): string`
is exported from NpcStatBlockSection.tsx and
builds a compact mechanical summary line from
structured action fields. Import it from
`src/components/ui/NpcStatBlockSection`.

NpcListEditor is the generic form component
for editing these lists. It is generic over
`T extends { name: string }` and uses a
`renderFields` prop to render per-entry inputs.

Note: the notes field on NpcFormData was
previously missing from the NpcFormFields
JSX and has been added to the Combat tab as
a DebouncedTextarea.

### Ability Score Input Pattern

AbilityScoreInput is a local-state wrapper
component defined in StatBlockScores.tsx.
It holds the raw typed value locally and
only commits to the parent onChange on
blur or Enter. This prevents mid-keystroke
snap-to-default behavior. Do not replace
it with DebouncedInput (different contract)
or revert to a direct <input onChange>.
CrInput in NpcFormFields.tsx follows the
same pattern for the CR text field.

---

## Architectural Decisions

**resourcePools stored as JSON string (not
separate columns):** Class resources vary
wildly by class, subclass, and level. A JSON
column in the sheet allows any combination of
named pools without schema changes. The schema
stays clean and works across all character
builds including homebrew.

**NPC stat block data stored as JSON strings:**
Traits, actions, reactions, and legendary
actions each vary widely by NPC type. JSON
columns allow arbitrary lists without schema
changes. Same reasoning as resourcePools.

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

**Shared components live in ui/ when they
cross feature boundaries:** NpcFormFields,
NpcListEditor, NpcStatBlockSection,
ResourcePoolsSection, and SpellcastingStatsRow
are all in `src/components/ui/` rather than
the feature directory where they were first
created. The rule: if a component is imported
by more than one feature tab, it belongs in
ui/.

**Test fixtures live in src/test-utils/:**
`characterFixtures.ts` and `combatantFixtures.ts`
are factory functions, not test files. They
live in `src/test-utils/fixtures/` (not in
`__tests__/`) to make clear they are test
infrastructure rather than test suites.

---

## Workflows

### Add Player Workflow (`NewPlayerDialog.tsx`)
A 4-tab complex form for creating new characters manually:
1. **Identity:** Name, Character Name, Class, Level, Status
2. **Combat Stats:** AC, Max HP, Hit Dice, IRV, Notes
3. **Abilities:** Ability Scores (calculates passive perception and proficiency bonus automatically)
4. **Resources:** Manage Resource Pools (auto-suggests pools based on Identity Tab Class input, stores via `poolsCustomized` ref to avoid overwriting manual changes when class changes again)
- Submits as a single flat Character record matching the Google Sheets schema.

---

## Testing Philosophy & Quality Standards

This project follows the testing principles
established by Kent C. Dodds and the
Testing Library team. Every AI agent
working on this codebase must read and
apply these principles before writing
any test.

### The Prime Directive

> "The more your tests resemble the way
> your software is used, the more
> confidence they can give you."
> — Kent C. Dodds / Testing Library

Reference URLs (read before writing tests):
- https://testing-library.com/docs/guiding-principles
- https://kentcdodds.com/blog/testing-implementation-details
- https://kentcdodds.com/blog/common-testing-mistakes
- https://kentcdodds.com/blog/write-tests

### What Makes a Good Test

A good test:
- Simulates real user or caller behavior
  (render a component, fire an event,
  assert on what the user sees or what
  data reaches the database)
- Asserts on OUTCOMES not on internals
  (what value was written, what the UI
  shows, what the store contains)
- Would catch a real bug if the
  implementation broke
- Does not need to change when you
  refactor code without changing behavior

### The Three Anti-Patterns to Avoid

ANTI-PATTERN 1 — Shallow call assertion:
Testing that a function was called without
checking what it was called with.

  // BAD — passes even if wrong data sent
  expect(updateCharacterDB)
    .toHaveBeenCalled();

  // GOOD — verifies the actual data
  expect(updateCharacterDB)
    .toHaveBeenCalledWith(
      expect.objectContaining({
        resourcePools: expect.stringContaining(
          'Rage'
        )
      }),
      expect.any(Object)
    );

ANTI-PATTERN 2 — Circular mock assertion:
Setting up a mock to return a value then
asserting the value equals what the mock
returned. The test can never fail.

  // BAD — always passes, tests nothing
  vi.mocked(useAppState).mockReturnValue({
    state: { encounters: [mockEnc] }
  });
  // ... later:
  expect(result).toEqual(mockEnc);
  // This will always be true because
  // we put it there ourselves.

  // GOOD — assert on a transformation
  // or side effect that the code under
  // test actually produces, not on the
  // mock data you injected.

ANTI-PATTERN 3 — Implementation detail
testing:
Asserting on internal state, internal
function names, or internal component
structure rather than on observable
behavior.

  // BAD — tests internal state
  expect(component.state.isLoading)
    .toBe(true);

  // GOOD — tests what the user sees
  expect(screen.getByText('Loading...'))
    .toBeInTheDocument();

### What to Assert Instead

For hook tests: assert on the STATE
CHANGE that results from calling the
function, not just that the function ran.

  // BAD
  expect(handleUpdate).toHaveBeenCalled();

  // GOOD
  expect(
    result.current.characters[0].maxHp
  ).toBe(55);

For component tests: assert on what the
USER SEES or what DATA REACHES THE SERVICE
LAYER with the correct values.

  // BAD
  expect(onConfirmMock)
    .toHaveBeenCalled();

  // GOOD
  expect(onConfirmMock)
    .toHaveBeenCalledWith(
      expect.objectContaining({
        proficiencies: expect.stringContaining(
          '"proficiencyBonus":3'
        )
      })
    );

For service/DB tests: assert on the EXACT
ROW DATA written at the correct column
index, not just that appendSheetData ran.

### When Mocking IS Acceptable

Mocking is appropriate for:
- Network calls (sheetsService, dbOperations
  in component/hook tests)
- External dependencies (Google auth)
- Browser APIs not available in jsdom

Mocking is NOT appropriate for:
- The function you are actually testing
- Pure utility functions from lib/
  (test those directly)
- Zustand store state (use the real store
  or configure mock return values that
  represent real scenarios, then assert
  on state changes)

### The Seam Test Standard

The highest-value tests in this codebase
are seam tests — tests that verify the
connection between the UI layer and the
data layer. For every form submission or
card inline edit, there should be a test
that:
1. Renders the real component
2. Simulates real user input
3. Asserts the FULL data object that
   reaches the service layer contains
   the correct values at the correct
   fields

If a test only checks "was the function
called" at a seam, it is not acceptable.
The test must check WHAT was passed.

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

9. **Report all 12 batch counts individually**
   after any change. Never report a combined
   total without the per-batch breakdown.

10. **Delete root-level scripts immediately.**
    Any `fix*.cjs`, `scan*.ts`, or `replace.js`
    files found in the project root must be
    deleted. They are diagnostic artifacts.

11. **Keep AGENTS.md current.** After any
    session that adds files, moves files,
    changes the test baseline, or implements
    features that affect the architecture,
    update this file. Specifically:
    - New lib files → add to src/lib/ section
    - New shared UI components → add to
      src/components/ui/ section
    - File moves → update the section the file
      moved from AND the section it moved to
    - Test count changes → update the baseline
      number AND the per-batch comment in the
      batch commands
    - New batch 5A/5B/7B-1/7B-2 explicit
      files → update those batch commands
    - New NPC schema columns → update the NPC
      schema table AND the NpcTrait/NpcAction/
      NpcReaction/NpcLegendaryAction interfaces
    - New architectural patterns → add to the
      Patterns and Conventions section

12. **Contrast on Solid Blue backgrounds:** All `bg-[#2563eb]` solid blue elements must use `text-white` text. Never use `text-[#0f172a]` on a solid blue background.

13. **Avoid inline styles:** Do not use inline `style={{}}` props for anything Tailwind can handle. Dynamic animation math in overlay components is the only exception.

---

## Pending Features

Features and bugs that have been discussed
and approved but not yet implemented.
Each entry includes enough context to
implement without re-discussion.

---

### 🔴 Bugs to Fix — NewPlayerDialog
Resource Pools
All five bugs resolved. See session
history for details.

---

### 🟡 Features to Add
Auto-assign saving throw proficiencies
at character creation — resolved.
CLASS_SAVING_THROW_MAP added to
src/lib/spellcasting.ts. useEffect in
NewPlayerDialog watches formData.class
and sets savingThrows in proficiencies
automatically. See session history.

---

### 🔵 Architecture / Technical Debt

#### Fix components importing directly
from services

Three components violate the layer
dependency rule (lib → services → hooks →
components) by importing database
functions directly instead of going
through hooks:

  CombatantCardHeader.tsx →
    imports updateCharacterDB
  CommandPalette.tsx →
    imports updateCharacterDB
  EncounterCard.tsx →
    imports updateEncounterDB

Fix: Move the database call logic for
each component into its respective hook
(useEncounterLifecycle, useParty, or a
new hook as appropriate), and have the
component call the hook function instead.

This is a dedicated refactor session —
tackle separately from feature work since
it touches multiple files and requires
careful testing of all affected batches
after completion.

---

## TypeScript Build Check

Always run after making changes:

```bash
npx tsc -p tsconfig.build.json --noEmit
```

Exit code must be 0. Any type errors are
blocking — do not proceed until resolved.

