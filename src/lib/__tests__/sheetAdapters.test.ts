// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import { expect, describe, it } from 'vitest';
import {
  mapCharacterRowToCharacter,
  mapNpcRowToNpc,
  mapEncounterRowToEncounter,
  mapEncounterCombatantRowToEC,
  CharacterRowData,
  NpcRowData,
  EncounterRowData,
  ECRowData,
} from '../sheetAdapters';

describe('sheetAdapters', () => {
  const mockStatuses = {
    '1': 'Active',
    '2': 'Inactive',
    '3': 'Deceased',
  };

  const mockDifficulties = {
    '1': 'Easy',
    '2': 'Medium',
    '3': 'Hard',
    '4': 'Deadly',
  };

  describe('mapCharacterRowToCharacter', () => {
    it('returns correct Character object from a valid parsed row', () => {
      const data: CharacterRowData = [
        'char-1',                 // [0] id
        'Alice',                  // [1] playerName
        'Thor',                   // [2] characterName
        15,                       // [3] ac
        20,                       // [4] maxHp
        5,                        // [5] tempHp
        25,                       // [6] currentHp
        'Blinded',                // [7] conditions
        14,                       // [8] passivePerception
        3,                        // [9] level
        1,                        // [10] statusId
        'Mighty hero',            // [11] notes
        'fire',                   // [12] resistances
        'cold',                   // [13] immunities
        'poison',                 // [14] vulnerabilities
        0,                        // [15] tempHpMax
        0,                        // [16] tempAc
        0,                        // [17] deathSavesFails
        0,                        // [18] deathSavesSuccesses
        '',                       // [19] unused
        '4d12+3d10',              // [20] hitDiceConfig
        '{"d12":1}',             // [21] hitDiceUsed
      ];

      const character = mapCharacterRowToCharacter(data, 2, mockStatuses);

      expect(character).toEqual({
        id: 'char-1',
        playerName: 'Alice',
        characterName: 'Thor',
        class: '',
        ac: 15,
        maxHp: 20,
        tempHp: 5,
        currentHp: 25,
        conditions: 'Blinded',
        passivePerception: 14,
        level: 3,
        statusId: 1,
        statusName: 'Active',
        notes: 'Mighty hero',
        isActive: true,
        sheetRowIndex: 2,
        resistances: 'fire',
        immunities: 'cold',
        vulnerabilities: 'poison',
        tempHpMax: 0,
        tempAc: 0,
        deathSavesFails: 0,
        deathSavesSuccesses: 0,
        hitDiceConfig: '4d12+3d10',
        hitDiceUsed: '{"d12":1}',
        resourcePools: '[]',
        abilityScores: '{"STR":10,"DEX":10,"CON":10,"INT":10,"WIS":10,"CHA":10}',
        proficiencies: '{"proficiencyBonus":2,"jackOfAllTrades":false,"savingThrows":[],"skills":{},"passiveBonuses":{"perception":0,"insight":0,"investigation":0}}',
      });
    });

    it('correctly resolves statusName from the statuses lookup map', () => {
      const data: CharacterRowData = [
        'char-2',
        'Bob',
        'Loki',
        10,
        15,
        0,
        15,
        '',
        10,
        1,
        3, // statusId 3 -> Deceased
        '',
        '',
        '',
        '',
        0,
        0,
        0,
        0,
        '',
        '',
        '',
      ];

      const character = mapCharacterRowToCharacter(data, 3, mockStatuses);

      expect(character.statusName).toBe('Deceased');
      expect(character.isActive).toBe(false);

      const dataUnknown: CharacterRowData = [
        'char-3',
        'Charlie',
        'Odin',
        10,
        15,
        0,
        11,
        '',
        10,
        1,
        99, // statusId 99 -> Unknown
        '',
        '',
        '',
        '',
        0,
        0,
        0,
        0,
        '',
        '',
        '',
      ];

      const characterUnknown = mapCharacterRowToCharacter(dataUnknown, 4, mockStatuses);
      expect(characterUnknown.statusName).toBe('Unknown');
      expect(characterUnknown.isActive).toBe(false);
    });

    it('mapCharacterRowToCharacter defaults hitDiceConfig, hitDiceUsed, and resourcePools when row is shorter than 23 columns', () => {
      const shortRow = [
        'char-short', 'Alice', 'Shorty', 10, 10, 0, 10, '', 10, 1, 1, 'notes'
      ] as any;
      const character = mapCharacterRowToCharacter(shortRow, 5, mockStatuses);
      expect(character.hitDiceConfig).toBe('');
      expect(character.hitDiceUsed).toBe('{}');
      expect(character.resourcePools).toBe('[]');
    });

    it('mapCharacterRowToCharacter maps index 19 to the class field', () => {
      const data: CharacterRowData = [
        'char-class', 'Alice', 'Thor', 15, 20, 5, 25, '', 14, 3, 1, '', '', '', '', 0, 0, 0, 0, 'Barbarian', '4d12', '{}', '[]'
      ];
      const character = mapCharacterRowToCharacter(data, 6, mockStatuses);
      expect(character.class).toBe('Barbarian');
    });

    it('class defaults to empty string when row is shorter than 20 columns', () => {
      const shortRow = [
        'char-short', 'Alice', 'Shorty', 10, 10, 0, 10, '', 10, 1, 1, 'notes'
      ] as any;
      const character = mapCharacterRowToCharacter(shortRow, 5, mockStatuses);
      expect(character.class).toBe('');
    });

    it('mapCharacterRowToCharacter with a full 23-element row maps class, hitDiceConfig, hitDiceUsed, and resourcePools to their correct values', () => {
      const data: CharacterRowData = [
        'char-1', 'Alice', 'Thor', 15, 20, 0, 20, '', 14, 1, 1, 'Notes', '', '', '', 0, 0, 0, 0, 'Wizard', '6d6', '{"d6":1}', '[{"id":"res-1","name":"Ki Points","max":5,"current":5,"resetOn":"short"}]'
      ];
      const character = mapCharacterRowToCharacter(data, 7, mockStatuses);
      expect(character.class).toBe('Wizard');
      expect(character.hitDiceConfig).toBe('6d6');
      expect(character.hitDiceUsed).toBe('{"d6":1}');
      expect(character.resourcePools).toBe('[{"id":"res-1","name":"Ki Points","max":5,"current":5,"resetOn":"short"}]');
    });

    it('mapCharacterRowToCharacter with a 20-element row (missing last columns) returns defaults', () => {
      const data = [
        'char-1', 'Alice', 'Thor', 15, 20, 0, 20, '', 14, 1, 1, 'Notes', '', '', '', 0, 0, 0, 0, 'Wizard'
      ] as any;
      const character = mapCharacterRowToCharacter(data, 8, mockStatuses);
      expect(character.class).toBe('Wizard');
      expect(character.hitDiceConfig).toBe('');
      expect(character.hitDiceUsed).toBe('{}');
      expect(character.resourcePools).toBe('[]');
    });
  });

  describe('mapNpcRowToNpc', () => {
    it('returns correct NPC with all IRV fields', () => {
      const data: NpcRowData = [
        'npc-1',                  // [0] id
        'Goblin',                 // [1] name
        12,                       // [2] ac
        7,                        // [3] maxHp
        0,                        // [4] tempHp
        7,                        // [5] currentHp
        'None',                   // [6] conditions
        'Likes dark tunnels',     // [7] notes
        'slashing',               // [8] resistances
        'acid',                   // [9] immunities
        'fire',                   // [10] vulnerabilities
      ];

      const npc = mapNpcRowToNpc(data, 5);

      expect(npc).toEqual({
        id: 'npc-1',
        name: 'Goblin',
        ac: 12,
        maxHp: 7,
        tempHp: 0,
        currentHp: 7,
        conditions: 'None',
        notes: 'Likes dark tunnels',
        resistances: 'slashing',
        immunities: 'acid',
        vulnerabilities: 'fire',
        legendaryActions: 0,
        legendaryResistances: 0,
        rechargeAbilities: [],
        abilityScores: '{"STR":10,"DEX":10,"CON":10,"INT":10,"WIS":10,"CHA":10}',
        proficiencies: '{"proficiencyBonus":2,"jackOfAllTrades":false,"savingThrows":[],"skills":{},"passiveBonuses":{"perception":0,"insight":0,"investigation":0}}',
      });
    });
  });

  describe('mapEncounterRowToEncounter', () => {
    it('correctly resolves difficultyName from the difficulties map', () => {
      const data: EncounterRowData = [
        'enc-1',                      // [0] id
        'Ambush',                     // [1] name
        'Forest road',                // [2] location
        2,                            // [3] difficultyId -> Medium
        '3 Goblins',                  // [4] NPC_Definitions
        5,                            // [5] currentRound
        'ec-42',                      // [6] activeTurnId
      ];

      const encounter = mapEncounterRowToEncounter(data, 1, mockDifficulties);

      expect(encounter).toEqual({
        id: 'enc-1',
        name: 'Ambush',
        location: 'Forest road',
        difficultyId: 2,
        difficultyName: 'Medium',
        npcDefinitions: '3 Goblins',
        status: 'planned',
        sheetRowIndex: 1,
        currentRound: 5,
        activeTurnId: 'ec-42',
      });

      const dataUnknown: EncounterRowData = [
        'enc-2',
        'Cave Run',
        'Dark cave',
        99, // Unknown diff
        'Dragon',
        0,
        '',
      ];
      const encounterUnknown = mapEncounterRowToEncounter(dataUnknown, 2, mockDifficulties);
      expect(encounterUnknown.difficultyName).toBe('Unknown');
    });

    it('mapEncounterRowToEncounter correctly maps index 5 to currentRound', () => {
      const data: EncounterRowData = ['enc-1', 'Name', 'Loc', 1, '', 4, 'ec-1'];
      const encounter = mapEncounterRowToEncounter(data, 1, mockDifficulties);
      expect(encounter.currentRound).toBe(4);
    });

    it('mapEncounterRowToEncounter correctly maps index 6 to activeTurnId', () => {
      const data: EncounterRowData = ['enc-1', 'Name', 'Loc', 1, '', 4, 'ec-99'];
      const encounter = mapEncounterRowToEncounter(data, 1, mockDifficulties);
      expect(encounter.activeTurnId).toBe('ec-99');
    });

    it('mapEncounterRowToEncounter defaults currentRound to 0 when the row is shorter than 7 columns', () => {
      const data = ['enc-1', 'Name', 'Loc', 1, ''] as any as EncounterRowData;
      const encounter = mapEncounterRowToEncounter(data, 1, mockDifficulties);
      expect(encounter.currentRound).toBe(0);
      expect(encounter.activeTurnId).toBe('');
    });
  });

  describe('mapEncounterCombatantRowToEC', () => {
    it('parses conditionTimers JSON string into a Record correctly', () => {
      const data: ECRowData = [
        'ec-1',                                   // [0] id
        'enc-1',                                  // [1] encounterId
        'char-1',                                 // [2] playerId
        null,                                     // [3] npcId
        1,                                        // [4] quantity
        14,                                       // [5] initiative
        '{"Blessed":2,"Hasted":5}',               // [6] conditionTimers
      ];

      const ec = mapEncounterCombatantRowToEC(data, 1);

      expect(ec.conditionTimers).toEqual({
        Blessed: 2,
        Hasted: 5,
      });
      expect(ec.initiative).toBe(14);
    });

    it('defaults conditionTimers to empty object when JSON is invalid', () => {
      const data: ECRowData = [
        'ec-2',
        'enc-1',
        null,
        'npc-1',
        5,
        10,
        '{invalid-json',
      ];

      const ec = mapEncounterCombatantRowToEC(data, 2);

      expect(ec.conditionTimers).toEqual({});
      expect(ec.quantity).toBe(5);
    });

    it('defaults conditionTimers to empty object when conditionTimers is empty string or absent', () => {
      const data: ECRowData = [
        'ec-3',
        'enc-1',
        null,
        'npc-1',
        1,
        0,
        '',
      ];

      const ec = mapEncounterCombatantRowToEC(data, 3);
      expect(ec.conditionTimers).toEqual({});
    });

    it('maps npcCurrentHp and npcTempHp correctly if present in ECRowData', () => {
      const data: ECRowData = [
        'ec-4',
        'enc-1',
        null,
        'npc-1',
        1,
        15,
        '{"Blessed":2}',
        35,
        10
      ];

      const ec = mapEncounterCombatantRowToEC(data, 4);
      expect(ec.npcCurrentHp).toBe(35);
      expect(ec.npcTempHp).toBe(10);
    });

    it('defaults npcCurrentHp to -1 and npcTempHp to 0 if absent dynamically', () => {
      const data: ECRowData = [
        'ec-5',
        'enc-1',
        null,
        'npc-1',
        1,
        15,
        '{"Blessed":2}'
      ];

      const ec = mapEncounterCombatantRowToEC(data, 5);
      expect(ec.npcCurrentHp).toBe(-1);
      expect(ec.npcTempHp).toBe(0);
    });
  });
});
