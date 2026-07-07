# Data Schema & Storage Rules

Referenced from the root [AGENTS.md](../../AGENTS.md). Read this when touching anything related to Google Sheets columns, localStorage/IndexedDB, campaign creation, or the `handleUpdate` field whitelist.

---

## Storage Rules

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

### NPCs (A2:V — 22 columns)

**Templates only — no "current" combat state.** NPC templates in this sheet represent a reusable stat block (used when adding an NPC to any encounter); they have no HP/temp-HP/conditions of their own. All per-instance combat state (current HP, temp HP, conditions, legendary actions remaining, recharge state) lives in `Encounter_Combatants`, scoped to that specific combatant instance in that specific encounter. See the "NPC Template vs. Combat-Instance State Isolation" entry in `CHANGELOG.md` for the full history of this design.

| Col | Index | Field | Notes |
|-----|-------|-------|-------|
| A | 0 | id | Primary key |
| B | 1 | name | |
| C | 2 | ac | Number, default 10 |
| D | 3 | maxHp | Number, default 10 |
| E | 4 | notes | |
| F | 5 | resistances | Comma-separated damage types |
| G | 6 | immunities | Comma-separated damage types AND condition immunities |
| H | 7 | vulnerabilities | Comma-separated |
| I | 8 | legendaryActions | Number, default 0 — **max value only**, not remaining/current |
| J | 9 | legendaryResistances | Number, default 0 — **max value only**, not remaining/current |
| K | 10 | rechargeAbilities | JSON string — ability *definitions* only (name + rechargeOn threshold), not charge state |
| L | 11 | abilityScores | JSON string |
| M | 12 | proficiencies | JSON string |
| N | 13 | speed | Text, e.g. "30 ft., fly 60 ft." |
| O | 14 | senses | Text, e.g. "darkvision 60 ft." |
| P | 15 | languages | Text |
| Q | 16 | challengeRating | Text, e.g. "1/4", "16" |
| R | 17 | traits | JSON: NpcTrait[] |
| S | 18 | actions | JSON: NpcAction[] |
| T | 19 | reactions | JSON: NpcReaction[] |
| U | 20 | legendaryActionsList | JSON: NpcLegendaryAction[] |
| V | 21 | spellcastingAbility | String |

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

Note: `immunities` (col G) stores BOTH damage immunities and condition immunities as a comma-separated string. There is no separate `conditionImmunities` column.

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

### Encounter_Combatants (A2:N — 14 columns)

Holds per-instance combat state for every combatant in every encounter — this is the single source of truth for "what state is this specific PC or NPC instance in, in this specific encounter," separate from the reusable `Characters`/`NPCs` templates. One row per combatant instance; for NPCs, `quantity` is always `1` per row (adding "3 Goblins" creates 3 separate rows, not one row with `quantity: 3`) — `quantity` is retained as a column for now but is not meaningfully read or written.

| Col | Index | Field | Notes |
|-----|-------|-------|-------|
| A | 0 | id | Primary key |
| B | 1 | encounterId | FK → Encounters |
| C | 2 | playerId | FK → Characters (null if NPC) |
| D | 3 | npcId | FK → NPCs (null if PC) |
| E | 4 | quantity | Number, always 1 per row |
| F | 5 | initiative | Number, default 0 |
| G | 6 | conditionTimers | JSON string |
| H | 7 | npcCurrentHp | Number, default -1 (sentinel: "not yet set for this instance," falls back to `npcTemplate.maxHp` when building a fresh combatant) |
| I | 8 | npcTempHp | Number, default 0 |
| J | 9 | npcCurrentConditions | Comma-separated |
| K | 10 | npcTempAcMod | Number, default 0 |
| L | 11 | npcLegendaryActionsRemaining | Number, default matches the NPC template's `legendaryActions` max at creation time |
| M | 12 | npcLegendaryResistancesRemaining | Number, default matches the NPC template's `legendaryResistances` max at creation time |
| N | 13 | npcRechargeState | JSON string: `{ [abilityName]: isCharged }` |

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

## handleUpdate Whitelist (`useParty.ts`)

The following fields are accepted by `handleUpdate` and write to the sheet:

`playerName`, `characterName`, `class`, `ac`, `maxHp`, `tempHp`, `currentHp`, `conditions`, `passivePerception`, `level`, `statusId`, `notes`, `resistances`, `immunities`, `vulnerabilities`, `tempAc`, `deathSavesFails`, `deathSavesSuccesses`, `hitDiceConfig`, `hitDiceUsed`, `resourcePools`, `abilityScores`, `proficiencies`

When adding a new character field, add it to this whitelist and to `dbOperations.ts`.