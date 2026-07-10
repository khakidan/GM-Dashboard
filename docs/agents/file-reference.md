# Key Files Reference

Referenced from the root [AGENTS.md](../../AGENTS.md). File-by-file inventory of the codebase, organized by architectural layer (see the layer dependency rules in root AGENTS.md).

- `src/index.css` — Global stylesheet. Note that the sleek-modern block is now structural-only (font, radius, shadows, button interactions). All parchment/gold override rules have been removed.

---

## src/lib/

- `constants.ts` — `OVERLAY_DURATIONS`, `ANIMATION_TIMING`, `SHEET_RANGES`, `WRITE_QUEUE`, `STORAGE_KEYS`, `TIMERS`, `MOODS`, `AUDIO`, `campaignKey()` helper
- `sheetSchemas.ts` — Zod validation for each sheet row. Defines defaults for every column. NPC schema covers 22 columns (0–21) — templates only, no mutable combat state (see `CHANGELOG.md`'s "NPC Template vs. Combat-Instance State Isolation" entry).
- `sheetAdapters.ts` — Maps raw row arrays from the API into typed model objects.
- `sheetSyncParser.ts` — Validates full campaign workbooks on initial sync. Includes `parseConditions` and `parseSpells` functions alongside `parseNPCs`.
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

---

## src/services/

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

---

## src/hooks/

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

---

## src/server/routes/

- `campaigns.ts` — `POST /api/campaigns/create` provisions all 6 sheets with correct headers.
- `auth.ts` — Proxies OAuth token exchanges (keeps secrets off the client).
- `health.ts` — Health check endpoint.

---

## src/test-utils/fixtures/

Shared test data factories used across many test files. These are not tests themselves.

- `characterFixtures.ts` — Mock `Character` objects for use in component and hook tests.
- `combatantFixtures.ts` — Mock `Combatant` objects for use in `ActiveEncounterTab` tests.

---

## src/components/

- `GMDashboard.tsx` — Root shell. Calls `useAudioEngine(campaign.id)` and `useMoodPresets(campaign.id)` exactly once.
- `GMDashboardSidebar.tsx` — Permanent icon sidebar with hover tooltips via `SidebarIcon`.
- `GMTabContent.tsx` — Routes sidebar selection to `PartyTab`, `EncountersTab`, `NpcLibraryTab`, `ActiveEncounterTab`, and `SettingsPage`.
- `PartyTab.tsx` — Top-level Party Roster tab. Renders the error banner (`Callout`, `severity="error"`) and the character card list.
- `NpcLibraryTab.tsx` — Top-level NPC Library tab. Renders the search box (`SearchInput`), filter controls, the error banner (`Callout`, `severity="error"`), and the NPC card list (single-column, full-width — see `CHANGELOG.md`).
- `EncountersTab.tsx` — Top-level Encounters tab. Renders the error banner (`Callout`, `severity="error"`) and the encounter card list.
- `DiceRoller.tsx` — Floating dice-roller drawer. Parses dice notation (via `lib/diceRoller.ts`) and displays results. Uses `Accordion` for its expand/collapse drawer trigger. No dedicated test file exists for this component (confirmed directly — see `CHANGELOG.md`).
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
- `Button.tsx` — Shared button component. `intent?: 'primary' | 'secondary' | 'tertiary' | 'destructive'` (default `'primary'`), `size?: 'large' | 'small'` (default `'small'`). Universal press animation (`motion-safe:active:scale-95`) on all intents. `tertiary` opts out of the shared bold/uppercase typography and `size` padding (plain text-link style). Adopted in 10 locations across dialogs and cards — see `CHANGELOG.md`'s "Shared UI Component Consolidation" entry for the full adoption list and the several real bugs caught during migration (mismatched disabled-state colors, a stray parchment-theme tan hover color, a missing `disabled` prop).
- `IconButton.tsx` — Shared icon-only button. `icon: React.ReactNode`, `intent?: 'neutral' | 'destructive'` (default `'neutral'`), `onDark?: boolean` (default `false`, for dark-background contexts like `DialogShell`'s header), required `aria-label` (not optional — no visible text for screen readers to fall back on). Always `rounded-full`, always a hover-fill (never a color-only ghost hover). Adopted in 8 locations — see `CHANGELOG.md`.
- `Badge.tsx` — Shared static pill/badge. `color` (a direct Tailwind color-family name — `slate`/`pink`/`orange`/`yellow`/`green`/`gray`/`red`/`purple`/`emerald`/`amber`/`blue` — not a fixed semantic intent enum, since the real instances represent a dozen genuinely distinct D&D states that don't map cleanly to primary/secondary/destructive), `size?: 'compact' | 'default' | 'large'`. Color shade standardized to `bg-{color}-50 text-{color}-700 border-{color}-200` for every color. `large` (`text-lg px-4 py-1.5`) was added specifically for `PlayerView.tsx`'s TV-viewing-distance context — every other adopter uses `compact`/`default`, unchanged. Adopted in 6 GM-facing locations (8 mechanical condition badges, encounter outcome badge, 2 health-status badges, 2 `<select>`-wrapped badges) plus `PlayerView.tsx`'s health-status pill — see `CHANGELOG.md`.
- `ToggleBadge.tsx` — Shared clickable pill with two visual states. Reuses `Badge.tsx`'s `colorStyles`/`sizeStyles` directly (both exported from `Badge.tsx`). `active: boolean`, `activeColor`/`inactiveColor` (not a fixed two-tone scheme — the 3 real instances don't share a consistent color pair). Renders as a real `<button>` (the key structural difference from `Badge`'s `<span>`). Stays a shell accepting `children` — doesn't own content-swap logic itself. Adopted in 3 locations (Reaction toggle, recharge ability pill, Select/multi-target mode toggle) — see `CHANGELOG.md`.
- `PipTracker.tsx` — Shared row of small identical dots representing "N of M remaining." Two modes: interactive (default) — click-to-set-index (click a filled pip at index `i` → `remaining = i`; click an empty pip at index `i` → `remaining = i+1`) — or `readOnly?: boolean` (renders plain, non-interactive `<div>`s instead of `<button>`s, `onChange` becomes optional, `aria-hidden` rather than interactive `aria-label` wording; added for `PlayerView.tsx`'s death-save pips, the first genuine read-only-pip use case). `max`, `remaining`, `onChange?: (newValue: number) => void`, `color` (reuses `Badge`'s color enum), `size?: 'compact' | 'default' | 'large'` (`large` added alongside `readOnly`, same TV-context motivation as `Badge`'s), `label?: string`. Adopted interactively in 3 locations (Legendary Actions/Resistances dots, `ResourcePoolsSection.tsx`'s Ki-Points-style resource pips, `CharacterCardExpanded.tsx`'s hit dice — the latter two now both use `size="default"`, a confirmed and fixed inconsistency) plus read-only in `PlayerView.tsx`'s death-save tracker — see `CHANGELOG.md`.
- `Accordion.tsx` — Shared full-row collapsible trigger (icon/label left, optional `rightContent` + chevron right, whole row is the click target). `isExpanded: boolean`, `onToggle: () => void`, `children`, `rightContent?`, `size?: 'compact' | 'default'`, `disabled?`, `hideChevron?`. Always a real `<button type="button">` — fixes two real keyboard-accessibility bugs by construction (see `CHANGELOG.md`). Includes `.no-blue-hover` by default (see `patterns.md` for the `sleek-modern` theme hover-text landmine this avoids). Adopted in 4 locations — see `CHANGELOG.md`. Note: two other loosely-related "toggle" patterns found during this component's verification pass (a small inline Stat-Block-style toggle, and an icon-only rotating-chevron card-expand button) were deliberately excluded — see `ROADMAP.md`.
- `Callout.tsx` — Shared info/warning/error message box. `severity: 'info' | 'warning' | 'error'`, `children`, plus full `HTMLAttributes<HTMLDivElement>` passthrough. `error` uses a bigger icon and roomier padding than `warning`/`info` — a real severity-driven distinction confirmed across all 3 error instances, not normalized away. The `AlertCircle` icon's color also genuinely differs by mechanism: `warning` uses a fixed `text-[#2563eb]` independent of its own text color; `error` has no icon color class at all and inherits from its container. `info` has no real instance yet — an explicitly-flagged unvalidated placeholder. Adopted in 5 locations (2 warning, 3 error) — see `CHANGELOG.md`. Directly closes a gap `STYLE_GUIDE.md` had already flagged (its "Nested Panels and Callouts" entry never defined a warning or error variant).
- `SearchInput.tsx` — Shell around `DebouncedInput.tsx` (not a reimplementation) for the leading-icon search-box pattern. Renders a leading `Search` icon plus a `<DebouncedInput size="compact" immediate={true} />` — `immediate` fires on every keystroke, since search-while-browsing needs that rather than `DebouncedInput`'s default blur/Enter-commit behavior. This was the first real adoption of `DebouncedInput`'s `size`/`immediate` props, built in the first consolidation round but never used anywhere until now. Adopted in `NpcLibraryTab.tsx` (near-identical swap) and `AddCombatantDialog.tsx` (a real improvement — that instance previously had no focus styling or icon at all).
- `Tabs.tsx` — Shared tab navigation, one canonical underline style (`text-[#2563eb] border-b-2 border-[#2563eb] font-medium` active, `text-stone-500 hover:text-stone-700` inactive) chosen over 3 other real but divergent visual treatments found in the app (segmented/pill, filled-background, raised-folder). `tabs: { id: string; label: React.ReactNode }[]` (label is `ReactNode`, not `string`, so a caller can compose extra content like a `"(required)"` annotation), `activeTab`, `onTabChange`, `className?`. Always a real `role="tablist"`/`role="tab"`/`aria-selected` `<button>` set with working `ArrowLeft`/`ArrowRight` keyboard navigation — a real accessibility fix, since none of the original instances had any of this. Adopted in 5 locations — see `CHANGELOG.md`.
- `CardShell.tsx` — Shared outer container for the app's 4 expandable entity cards (`EncounterCard`, `CombatantCard`, `NpcCard`, `CharacterCard`). `syncing?: boolean` (shell-owned border/shadow treatment plus an automatic `Loader2`-spin "Syncing" badge — confirmed byte-identical across 2 of the 4 original cards), `highlight?: 'selected' | 'active-turn' | null` and `cornerBadge?: React.ReactNode` (both exist only for `CombatantCard.tsx`'s narrower, combat-specific needs). Deliberately does **not** include `overflow-hidden` on its own container — a load-bearing constraint, since `CombatantCard.tsx`'s turn-order badge is positioned `-top-3`, extending above the card's own top edge, and would be clipped otherwise; each card's own inner expand-wrapper keeps managing its own `overflow-hidden` independently. First of a planned 3-part card componentization effort (`CardShell` → `CardHeader` → `ExpandableContent`, the latter two not started) — see `CHANGELOG.md` for the full 4-step staged build and a since-fixed `relative`-positioning regression.
- `CardHeaderChevron.tsx` — Shared expand/collapse chevron for the three entity cards with a dedicated header file (`CombatantCardHeader.tsx`, `NpcCardHeader.tsx`, `CharacterCardHeader.tsx` — `EncounterCard.tsx` excluded, it has no equivalent structure at all). A full `CardHeader` covering the entire header zone was investigated and rejected as too divergent to unify (different row counts, different name-field editability, differing collapsed-summary content); this chevron was the one piece genuinely shared. `isExpanded`, `onToggleExpand`, `label: string` (auto-generates a consistent `aria-label`), `stopPropagation?` (only `CombatantCardHeader.tsx` needs this, for its competing selection-mode click handler), `bordered?: boolean` (default `true`) — used identically and unconditionally (no per-instance overrides) in all three adoptions. See `CHANGELOG.md`.
- `ExpandableContent.tsx` — Shared expand/collapse mechanics and boundary styling for the same three entity cards (`CombatantCard.tsx`, `CharacterCard.tsx`, `NpcCard.tsx` — `EncounterCard.tsx` excluded). Owns the `AnimatePresence`/`motion.div` height/opacity transition (`duration: 0.2`, now explicit and uniform everywhere — previously only one of the three specified this) and the `border-t border-[#e2e8f0] bg-white` boundary — the entity-specific content passed as `children` stays entirely custom. This is the single, canonical source of that border across all three cards; `CombatantCardExpanded.tsx` previously duplicated it in its own content (a different but equally valid architecture achieving the same visual result) and had it removed as part of this adoption. Completes the three-part card componentization effort (`CardShell` → `CardHeaderChevron` → `ExpandableContent`) — see `CHANGELOG.md`.
- `LabeledField.tsx` — Minimal wrapper for the "small uppercase label above a form field" pattern. `label: string`, `children` (the input, completely untouched — every real instance has genuinely different, deliberate input styling that this component doesn't own or normalize), `className?`. `CharacterCardExpanded.tsx`'s "Hit Dice" label looked identical at a glance but is a different pattern (an inline section header, not a label stacked above a field) and is explicitly excluded. Adopted in 6 locations across `NpcCard.tsx` and `CharacterCardExpanded.tsx` — see `CHANGELOG.md`.
- `ConfirmationDialog.tsx` — Standardized destructive-confirmation flow, extracted from `GMDashboardDialogs.tsx`'s previously inline "Leave Campaign?" modal. Deliberately does not use `DialogShell` (stays a raw `fixed inset-0` overlay, matching the reference exactly) and uses one single look regardless of severity (no `severity`/`intent` prop). `isOpen`, `title`, `description`, `confirmLabel`, `cancelLabel?` (default `"Cancel"`), `onConfirm`, `onClose`. Two of its three adoptions (`NpcCard.tsx`, `EncounterCard.tsx`'s deletes) are genuinely new safety behavior, not a refactor — neither had any confirmation step before this. See `CHANGELOG.md`.
- `EmptyState.tsx` — Shared "No [entity] found" display. `icon: React.ComponentType<{ className?: string }>` (a component reference, not a pre-rendered element — sized/colored consistently by `EmptyState` itself, matching `Callout`'s "shell owns the visual treatment" precedent), `title?`, `description?`, `actionLabel?`, `onAction?`, `actionDisabled?`. Renders a real `Button` internally for the action (fixing a confirmed inconsistency — every original instance used its own raw one-off `<button>` with different sizing). The bordered box is always applied, not optional — one real adoption (`NpcLibraryTab.tsx`) gained this box as a deliberate visual addition, not a preserved difference. `Soundboard.tsx`'s "no effect files" message was deliberately excluded as a genuinely different, smaller-scale pattern, not drift. Adopted in 5 locations across 4 files — see `CHANGELOG.md`.
- `StatTile.tsx` — Pure shell component for the bordered label-over-value tile pattern (`AC`, `Max HP`, `HP`, `CR`, ability scores, etc.). Does not own input behavior — accepts the value content (static text, `CardNumberInput`, `DebouncedInput`, or `AbilityScoreInput`) as `children`, matching the `DialogShell` "shell owns chrome, not content" philosophy. Supports an optional third-row `modifier` (color-coded, reuses `StatBlockScores.tsx`'s `formatBonus`, now exported) and `size?: 'default' | 'compact'`. Adopted in `NpcCard.tsx` (`AC`/`Max HP`/`CR`), `CombatantCardExpanded.tsx` (`Temp HP`/`Max HP`, editable), `CharacterCardExpanded.tsx` (`AC`/`Max HP`/`HP`/`Temp`/`Level` — a leftover gap from the original `StatTile` build, easily confused with `CombatantCardExpanded.tsx`, found and fixed later — see `CHANGELOG.md`), and `StatBlockScores.tsx` (all six ability scores, `size="compact"`, the adoption that validates the `modifier` row in a real rendered instance).
- `ConditionChips.tsx` — Condition/effect chip input with popover, immunity checking, timer prompts, and `onConditionAdded` callback for resource auto-decrement.
- `ConditionPopover.tsx` — Hover popover showing official rules text for any condition or effect.
- `IrvMultiSelect.tsx` — Compact multi-select for resistances, immunities, and vulnerabilities.
- `IrvSection.tsx` — Shared resistances/immunities/vulnerabilities section component. Accepts `resistances`/`immunities`/`vulnerabilities`/`onUpdate` plus explicit `labels`, `placeholders`, optional `gap` (default `gap-4`), and optional `compact?: boolean`. See CHANGELOG.md for the consolidation history.
- `StatBlock.tsx` — Orchestrator (117 lines). Delegates rendering to `StatBlockScores.tsx`, `StatBlockSaves.tsx`, `StatBlockPassive.tsx`, and `StatBlockSkills.tsx`. All five live in `src/components/ui/`.
- `NpcFormFields.tsx` — Shared form fields used by both `NewNpcDialog` and the `AddCombatantDialog` Create NPC tab. Must stay in sync between both usages. Contains internal four-tab navigation (Identity, Combat, Abilities, Stat Block) while keeping the external API (`data`, `onChange`, `errors`, `compact`) unchanged. Includes text fields (name, AC, HP, notes, IRV, CR, speed, senses, languages) and four list editors (traits, actions, reactions, legendary actions) using `NpcListEditor`, now delegating to `NpcSimpleFieldEditor.tsx`/`NpcCombatActionFields.tsx` (the same shared components `NpcCard.tsx` uses) rather than the now-deleted `NpcActionEditors.tsx` — see `CHANGELOG.md`. `rechargeAbilities` has been removed from `NpcFormData`, `DEFAULT_NPC_FORM_DATA`, and associated handlers. Recharge is now represented only by the `recharge` field on `NpcAction`.
- `NpcListEditor.tsx` — Generic list editor used by `NpcFormFields` for traits, actions, reactions, and legendary actions. Generic over `T extends { name: string }`. Entries render through a `renderFields` prop and include Add/Remove controls.
- `NpcSimpleFieldEditor.tsx` — Shared name+description field pair, used for both `NpcTrait` and `NpcReaction` entries (confirmed byte-identical JSX between the two before this consolidation, differing only in TypeScript type annotation). `name`/`onNameChange`/`namePlaceholder`, `description`/`onDescriptionChange`. Bakes in its own input styling internally. Adopted in both `NpcCard.tsx` and `NpcFormFields.tsx` (replacing the now-deleted `NpcActionEditors.tsx`) — see `CHANGELOG.md`.
- `NpcCombatActionFields.tsx` — Shared name+secondary-field+Atk/Dmg/DC/Save-grid+description fields, used for both `NpcAction` and `NpcLegendaryAction` entries. `secondaryField: React.ReactNode` (caller supplies the entire Recharge-or-Cost input directly, since these genuinely differ in type/label/validation — not forced into shared typed props), `attackBonus`/`damage`/`saveDC`/`saveType` with typed `onChange`s plus `damagePlaceholder?`, `range?: React.ReactNode` (only `NpcAction` provides this), `descriptionRows` (3 for Action, 2 for Legendary Action). Adopted in both `NpcCard.tsx` and `NpcFormFields.tsx` (replacing the now-deleted `NpcActionEditors.tsx`) — see `CHANGELOG.md`.
- `NpcStatBlockSection.tsx` — Pure display component for one NPC stat block section (traits, actions, reactions, or legendary actions). Accepts a `title` and `items[]` with optional metadata. Also exports `formatActionMeta(action)` to build a compact mechanical summary string from `NpcAction` fields (`attackBonus`, `damage`, `saveDC`, `saveType`, `range`, `recharge`). Returns `null` when empty.
- `ResourcePoolsSection.tsx` — Shared pip tracker UI used by both `CharacterCardExpanded` (Party tab) and `CombatantCardExpanded` (Active Encounter tab). Its Ki-Points-style resource pips now use `PipTracker.tsx` (see `CHANGELOG.md`); the "Reset: Short/Long Rest" chip remains a deliberately deferred `Badge` candidate — see `ROADMAP.md`.
- `ResourcePoolManager.tsx` — Add/edit/delete management UI for a character's resource pools (distinct from `ResourcePoolsSection.tsx`, which only displays and spends/recovers pips). Its Edit and Delete icon buttons use `IconButton.tsx` — see `CHANGELOG.md`.
- `SpellcastingStatsRow.tsx` — Displays Spell Save DC and Spell Attack Bonus inline on character and NPC cards. When `onOverrideChange` is supplied (Party tab, NPC Library), renders a spellcasting ability override dropdown. When omitted (Active Encounter), renders read-only. Non-casters with no override return `null`.
- `DebouncedInput.tsx` — Standard debounced input. Local-state buffering, commits to the parent's `onChange` on blur or Enter (not time-based debounce). Extended with `size?: 'compact' | 'prominent'` (padding/focus-ring variant; default `'compact'` preserves original behavior) and `immediate?: boolean` (default `false`; when `true`, fires `onChange` on every keystroke instead of on blur/Enter, for filter-as-you-type fields). Neither prop has been adopted anywhere yet — built and available for a genuine future "prominent" or immediate-mode instance; see `CHANGELOG.md` for the investigation that found the originally-suspected adoption sites didn't actually need it.
- `DebouncedTextarea.tsx` — Standard debounced textarea (light parchment theme).
- `DialogShell.tsx` — Shared modal shell component (backdrop + panel, `title`/`icon`/`subtitle`/`subheader`/`footer` slots, `zIndex` and `dismissOnBackdropClick` props). Adopted by all 12 target dialogs — see CHANGELOG.md for the full migration history and patterns established.

### src/components/PartyTab/

- `CharacterResourceSection.tsx` — Condition chips with `onConditionAdded` that automatically decrement matching resource pools.
- `hooks/useParty.ts` — Character CRUD plus `handleLongRest` and `handleShortRest`, both of which reset resource pools appropriately. Module-level pure helpers: `calculateLongRestUpdates`, `calculateShortRestUpdates`, `withDefaultCombatState`, `mirrorCharacterFieldsToCombatants` — see CHANGELOG.md for the extraction history.
- `LevelUpDialog.tsx` — Level-up flow. Writes `level`, `class`, `hitDiceConfig`, `maxHp`, `currentHp`, `ac`, `passivePerception`, `resistances`, `immunities`, `vulnerabilities`, `notes`, `proficiencies`, and `resourcePools`. HP increase is entered as a dice roll rather than a Max HP total. CON modifier is auto-added with helper text. Tough feat checkbox persists `toughFeat: boolean` in the proficiencies JSON. Resource Pools display pre-filled scaling suggestions via `getResourcePoolSuggestions()`, editable before confirmation. Newly gained pools can be individually included or excluded.
- `NewPlayerDialog.tsx` — Four-tab character creation form. All Identity tab inputs now include proper `id` and `htmlFor` attributes for accessibility.

### src/components/ActiveEncounterTab/

- `index.tsx` — Top-level coordinator. Owns `characters`/`npcs` derivation for combatants (resolves `pcCharacter`/`npcModel` once per combatant in its `.map()`, passing resolved data down — see CHANGELOG.md).
- `CombatHeader.tsx` — Encounter controls. Includes **End Encounter** (writes log) and **Cancel Encounter** (discards log, destructive style).
- `CombatantCard.tsx` — Pure prop-driven card; receives `combatStarted`, `pcCharacter`, `npcModel` as props (no direct store access).
- `CombatantCardHeader.tsx` — Compact `[-] N/M [+]` resource counter row for every PC resource pool in collapsed view. Passes through a resolved `pcCharacter` prop to `CombatantCompactResourceRow`.
- `CombatantCardExpanded.tsx` — Full `ResourcePoolsSection` for player combatants. Pure prop-driven (no store access).
- `CombatantCompactResourceRow.tsx` — Pure prop-driven (receives `character` prop, no store access).
- `GlobalActionContextPanel.tsx` — Global Source/Type context panel displayed when combat is active (`combatStarted: true`). Pure prop-driven (no store access).
- `AddCombatantDialog.tsx` — Modal for adding a combatant to the active encounter (renamed from `CombatSidebar.tsx`, which was a misnomer — it renders as a centered modal, not a sidebar). Three tabs: `library` (pick an existing NPC from the NPC library, set quantity), `party` (pick existing active party members not already in the encounter), `create` (build a brand-new NPC via the shared `NpcFormFields` component and add it directly). The dialog's own header reads "Add Combatant," which the new filename now matches.
- `NpcReferencePanel.tsx` — Collapsible NPC stat block reference displayed on NPC combatants during encounters. Manages its own expanded state. Hidden when the combatant has no stat block data. Toggle text is `"▶ Stat Block"` / `"▼ Stat Block"`. Displays CR, speed, senses, languages, and all four `NpcStatBlockSection` lists. Imports both `NpcStatBlockSection` and `formatActionMeta`.
- `CombatMechanicsSummary.tsx` — Pure presentational component showing combat mechanics (speed restrictions, advantage/disadvantage, auto-fail warnings) from a `mechanicalSummary` object. No store access.
- `CombatantIrvDisplay.tsx` — Read-only display for combatant resistances, immunities, and vulnerabilities.
- `CombatantLegendaryTracker.tsx` — Full-width legendary action/resistance tracker for the expanded combatant card view. Distinct from the compact dot-pip version in `CombatantCompactIndicators.tsx` used in the collapsed row.
- `CombatantRechargeTracker.tsx` — Full-width recharge ability tracker for the expanded combatant card view. Distinct from the compact pill version in `CombatantCompactIndicators.tsx` used in the collapsed row.
- `hooks/useDeathSaves.ts` — Death saving throw state and stabilization logic.
- `hooks/useCombatantExpanded.ts` — Encapsulates resource pool updates and condition-triggered resource depletion via `onConditionAdded`. Used by `CombatantCardExpanded`.
- `hooks/useHealthChange.ts` — Damage/healing with IRV math. Fires `fireConcentrationAlert()` whenever a concentrating combatant takes damage.
- `hooks/useCombatSync.ts` (66 lines) — Turn, round, and combatant synchronization facade. Calls `initCombatLog`, `addCombatEvent`, `advanceCombatLogRound`, and `clearCombatLog`. Implements initiative sorting on first turn, dead-NPC skipping, and NPC initiative as `1d20 + DEX modifier`. Delegates core behaviors to `useCombatantMutations`, `useCombatLifecycle`, `useCombatTurn`, and `useCombatConcentration` internally and re-exposes their APIs.
- `hooks/useCombatantMutations.ts` — Extracted from `useCombatSync`. Contains `updateCombatant`, `removeCombatant`, and `syncingIds`. Handles PC/NPC HP, conditions, and AC-modifier updates with DB writes (using `updateCharacterDB`, `updateNpcInstanceHpDB`, etc.), includes rollback on failure, and emits combat log events for condition changes.
- `hooks/useCombatLifecycle.ts` — Extracted from `useCombatSync`. Contains `resetCombat`, `cancelCombat`, `rollInitForNPCs`, and `handleCallInitiative`. Handles initiative rolling for NPCs, resetting and canceling active combat encounters with database persistence and rollback, and combat log start/end emissions.
- `hooks/useCombatTurn.ts` — Extracted from `useCombatSync`. Contains `nextTurn` (turn/round advancement, dead-NPC skipping via `getNextActiveTurnIndex`, first-turn initiative finalization, legendary action resets, death save prompts, expired condition removal), receiving `updateCombatant` via dependency injection rather than calling `useCombatantMutations()` internally.
- `hooks/useCombatConcentration.ts` — Extracted from `useCombatSync`. Contains local React state `concentrationPrompt` and handlers `handleConcentrationPrompt`/`handleSelectCaster`, receiving `updateCombatant` via dependency injection rather than calling `useCombatantMutations()` internally.
- `hooks/useEncounterPresetLoader.ts` — Handles adding PC and NPC presets to active encounters. Implements rollback fix: state snapshots are now captured BEFORE optimistic updates (not after), so a failed DB write correctly rolls back to pre-update state and shows a toast.error to the GM.
- `hooks/useEncounterKeyboard.ts` — Global combat keyboard shortcuts. Escape exits selection mode, clears `expandedIds`, and closes modals.

### src/components/EncountersTab/

- `EncounterCard.tsx` — Pure prop-driven card; receives `encounterCombatants` and `difficulties` as props (no direct store access).
- `hooks/useEncounterLogs.ts` — On-demand hook for `EncounterLogs` sheet data. Not part of global Zustand sync. Exposes `fetchLogsForEncounter()` (returns logs filtered by encounter, newest first) and `deleteLog()`.

### src/components/NpcLibraryTab/

- `NpcCard.tsx` — NPC library card. Expanded view displays `StatBlock`, `SpellcastingStatsRow`, editable combat stats (AC, HP, IRV, etc.), and read-only stat block sections (CR, speed, senses, languages, traits, actions, reactions, legendary actions) via `NpcStatBlockSection`. Its trait/action/reaction/legendary-action editors were decomposed into `NpcSimpleFieldEditor.tsx`/`NpcCombatActionFields.tsx` (513 → 388 lines) — see `CHANGELOG.md`.
- `NewNpcDialog.tsx` — NPC creation dialog using the shared `NpcFormFields` component.