# Patterns, Conventions & Architectural Decisions

Referenced from the root [AGENTS.md](../../AGENTS.md). Read this when implementing new features or trying to understand why something is built the way it is.

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
- `IrvSection`

Rule:

> If a component is imported by more than one feature tab, it belongs in `ui/`.

### Test fixtures live in `src/test-utils/`

`characterFixtures.ts` and `combatantFixtures.ts` are fixture factories, **not** test files.

They live in:

```text
src/test-utils/fixtures/
```

rather than inside `__tests__/` to clearly distinguish test infrastructure from test suites.

### Store-access architecture: container/presentational separation

Leaf and mid-tree components should not call `useAppState()`/`useDashboardStore()`/`getSnapshot()` directly. Data should be resolved once at the nearest top-level coordinator (e.g. `ActiveEncounterTab/index.tsx`, `EncountersTab.tsx`) and threaded down as props. When multiple sibling leaf components need the same derived value, resolve it once at the shared ancestor and pass it to each, rather than each leaf deriving it independently or each leaf reading the store itself.

Top-level tab coordinators (`GMDashboard.tsx`, `PartyTab.tsx`, `EncountersTab.tsx`, `NpcLibraryTab.tsx`, `ActiveEncounterTab/index.tsx`, `PlayerView.tsx`, `CommandPalette.tsx`) are the legitimate exception — they need broad state access by nature of their role.

### Cross-component dialog triggering (`openDialog` app-state field)

`CommandPalette.tsx` (and any other component outside a given tab) can't directly call a tab component's local `useState` setter to open a dialog that lives there — e.g. `PartyTab.tsx`'s `isLongRestOpen` is local state, invisible outside that file. The established pattern: a shared `AppState.openDialog?: 'newPlayer' | 'newNpc' | 'newEncounter' | 'shortRest' | 'longRest' | null` field. The triggering component does `updateState(prev => ({ ...prev, openDialog: 'someDialogName' }))` (plus, if the target dialog lives on a different tab, `window.dispatchEvent(new CustomEvent('gm-change-tab', { detail: 'tabName' }))` first, so the tab is actually mounted to see the change). The owning tab component has a `useEffect` watching `appState.openDialog`, with one `else if` branch per dialog name — each branch sets the local `isXOpen` state to `true` and immediately resets `openDialog` back to `null`. When adding a new Command-Palette-triggerable dialog: add the new string to the `openDialog` union in `types.ts`, add a branch to the owning tab's `useEffect`, and add the `updateState`/`gm-change-tab` dispatch to the triggering command — all three are required, and it's easy to add the dialog's own state/component while forgetting to wire the `openDialog` branch (this happened with `'longRest'`, which existed as local state for a long time with no listener before it was fixed).

### General lesson: match on explicit ID fields, not by parsing/prefix-matching generated composite IDs

`Combatant` objects carry explicit `characterId`/`npcId` fields precisely so consumers can resolve "which template does this combatant instance belong to" reliably. Resolving this by string-parsing the combatant's own generated `id` (e.g. `c.id.startsWith(...)`) is fragile — it silently breaks the moment anything about the ID-construction scheme changes (this happened for `npcModel` resolution in `ActiveEncounterTab/index.tsx`, which parsed `combat-npc-${n.id}-...` and never matched the reload-path's actual `combat-npc-${ec.id}` format). Always prefer `otherArray.find(x => x.id === combatant.someIdField)` over parsing `combatant.id` itself, mirroring how `pcCharacter` resolution already does this correctly (`state.characters.find(char => char.id === c.characterId)`).

### CSS landmine: the `sleek-modern` theme's global `role="button"` hover override

`index.css` has a broad, `!important`-based rule set applying to `[data-theme='sleek-modern'] button`/`[role='button']` on `:hover` — forcing a blue background and forcing **all child text to white** (`... *, ... svg { color: #ffffff !important; }`), scoped globally, not to a specific component. Any element with `role="button"` (used for keyboard-accessible custom clickable divs, e.g. accordion headers) that contains light-background children (badges, pills) will have those children's text forced unreadable-white on hover, regardless of the child's own styling — this bit the Encounter Log's outcome badges (`bg-red-50`/`bg-green-50` etc. all affected, not just one outcome color). The escape hatch already exists: add the `.no-blue-hover` class to the `role="button"` element itself — the stylesheet's selectors already exclude `:not(.no-blue-hover)` (alongside pre-existing exclusions like `:not(#sidebar-menu button)`). Any future component with a custom `role="button"` element containing light-background children should proactively add this class rather than discover the bug the same way.

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