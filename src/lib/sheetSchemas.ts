import { z } from 'zod';

const idSchema = z
  .any()
  .transform((val) => (val == null ? '' : String(val).trim()))
  .refine((val) => val !== '', { message: 'ID cannot be empty' });

const stringDefault = (fallback: string) =>
  z.any().transform((val) => {
    if (val === '' || val == null) return fallback;
    return String(val);
  });

const nonEmptyString = z
  .any()
  .transform((val) => (val == null ? '' : String(val).trim()))
  .refine((val) => val !== '', { message: 'String cannot be empty' });

const nullDefault = () =>
  z.any().transform((val) => {
    if (val === '' || val == null) return null;
    return String(val);
  });

const coerceNumber = (fallback: number) =>
  z.any().transform((val) => {
    if (val === '' || val == null) return fallback;
    const n = Number(val);
    return Number.isNaN(n) ? fallback : n;
  });

const padRow = (length: number) => (val: unknown) => {
  if (!Array.isArray(val)) return val;
  const arr = [...val];
  while (arr.length < length) arr.push(undefined);
  return arr;
};

export const CharacterRowSchema = z.preprocess(padRow(22), z.tuple([
  idSchema,                            // [0] id
  stringDefault(''),                   // [1] playerName
  nonEmptyString,                      // [2] characterName
  coerceNumber(10),                    // [3] ac
  coerceNumber(10),                    // [4] maxHp
  coerceNumber(0),                     // [5] tempHp
  coerceNumber(10),                    // [6] currentHp
  stringDefault(''),                   // [7] conditions
  coerceNumber(10),                    // [8] passivePerception
  coerceNumber(1),                     // [9] level
  coerceNumber(1),                     // [10] statusId
  stringDefault(''),                   // [11] notes
  stringDefault(''),                   // [12] resistances
  stringDefault(''),                   // [13] immunities
  stringDefault(''),                   // [14] vulnerabilities
  coerceNumber(0),                     // [15] tempHpMax
  coerceNumber(0),                     // [16] tempAc
  coerceNumber(0),                     // [17] deathSavesFails
  coerceNumber(0),                     // [18] deathSavesSuccesses
  stringDefault(''),                   // [19] class
  stringDefault(''),                   // [20] hitDiceConfig
  stringDefault('{}'),                 // [21] hitDiceUsed
]));

export const NpcRowSchema = z.preprocess(padRow(14), z.tuple([
  idSchema,                            // [0] id
  stringDefault('Unknown NPC'),        // [1] name
  coerceNumber(10),                    // [2] ac
  coerceNumber(10),                    // [3] maxHp
  coerceNumber(0),                     // [4] tempHp
  coerceNumber(10),                    // [5] currentHp
  stringDefault(''),                   // [6] conditions
  stringDefault(''),                   // [7] notes
  stringDefault(''),                   // [8] resistances
  stringDefault(''),                   // [9] immunities
  stringDefault(''),                   // [10] vulnerabilities
  coerceNumber(0),                     // [11] legendaryActions
  coerceNumber(0),                     // [12] legendaryResistances
  stringDefault(''),                   // [13] rechargeAbilities
]));

export const EncounterRowSchema = z.preprocess(padRow(7), z.tuple([
  idSchema,                            // [0] id
  stringDefault('Unknown Encounter'),  // [1] name
  stringDefault(''),                   // [2] location
  coerceNumber(1),                     // [3] difficultyId
  stringDefault(''),                   // [4] NPC_Definitions
  coerceNumber(0),                     // [5] currentRound
  stringDefault(''),                   // [6] activeTurnId
]));

export const EncounterCombatantRowSchema = z.preprocess(padRow(11), z.tuple([
  idSchema,                            // [0] id
  idSchema,                            // [1] encounterId
  nullDefault(),                       // [2] playerId
  nullDefault(),                       // [3] npcId
  coerceNumber(1),                     // [4] quantity
  coerceNumber(0),                     // [5] initiative
  stringDefault(''),                   // [6] conditionTimers
  coerceNumber(-1),                    // [7] npcCurrentHp
  coerceNumber(0),                     // [8] npcTempHp
  stringDefault(''),                   // [9] npcCurrentConditions
  coerceNumber(0),                     // [10] npcTempAcMod
]));

export const StatusRowSchema = z.preprocess(padRow(2), z.tuple([
  idSchema,                            // [0] statusId
  stringDefault(''),                   // [1] statusName
]));

export const DifficultyRowSchema = z.preprocess(padRow(2), z.tuple([
  idSchema,                            // [0] difficultyId
  stringDefault(''),                   // [1] difficultyName
]));
