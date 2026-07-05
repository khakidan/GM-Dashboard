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

## handleUpdate Whitelist (`useParty.ts`)

The following fields are accepted by `handleUpdate` and write to the sheet:

`playerName`, `characterName`, `class`, `ac`, `maxHp`, `tempHp`, `currentHp`, `conditions`, `passivePerception`, `level`, `statusId`, `notes`, `resistances`, `immunities`, `vulnerabilities`, `tempAc`, `deathSavesFails`, `deathSavesSuccesses`, `hitDiceConfig`, `hitDiceUsed`, `resourcePools`, `abilityScores`, `proficiencies`

When adding a new character field, add it to this whitelist and to `dbOperations.ts`.
