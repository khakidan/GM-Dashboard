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
      ];

      const character = mapCharacterRowToCharacter(data, 2, mockStatuses);

      expect(character).toEqual({
        id: 'char-1',
        playerName: 'Alice',
        characterName: 'Thor',
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
      ];

      const characterUnknown = mapCharacterRowToCharacter(dataUnknown, 4, mockStatuses);
      expect(characterUnknown.statusName).toBe('Unknown');
      expect(characterUnknown.isActive).toBe(false);
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
      });

      const dataUnknown: EncounterRowData = [
        'enc-2',
        'Cave Run',
        'Dark cave',
        99, // Unknown diff
        'Dragon',
      ];
      const encounterUnknown = mapEncounterRowToEncounter(dataUnknown, 2, mockDifficulties);
      expect(encounterUnknown.difficultyName).toBe('Unknown');
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
