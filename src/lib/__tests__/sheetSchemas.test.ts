// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import { expect, describe, it, assertType } from 'vitest';
import {
  CharacterRowSchema,
  NpcRowSchema,
  EncounterRowSchema,
  EncounterCombatantRowSchema,
  StatusRowSchema,
  DifficultyRowSchema,
} from '../sheetSchemas';
import { SheetRow, BatchRequest } from '../../services/sheetsService';

describe('sheetSchemas', () => {
  describe('CharacterRowSchema', () => {
    it('parses a fully valid row correctly', () => {
      const row = ['char-1', 'Alice', 'Thor', 15, 20, 5, 25, 'Blinded', 14, 3, 1, 'Notes'];
      const result = CharacterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['char-1', 'Alice', 'Thor', 15, 20, 5, 25, 'Blinded', 14, 3, 1, 'Notes', '', '', '', 0, 0, 0, 0, '', '', '{}', '[]']);
      }
    });

    it('falls back to defaults for missing optional fields', () => {
      const row = ['char-2', undefined, 'Loki'];
      const result = CharacterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([
         'char-2', // id
         '', // playerName (default)
         'Loki', // characterName
         10, // ac
         10, // maxHp
         0, // tempHp
         10, // currentHp
         '', // conditions
         10, // passivePerception
         1, // level
         1, // statusId
         '', // notes
         '', // resistances
         '', // immunities
         '', // vulnerabilities
         0, // tempHpMax
         0, // tempAc
         0, // deathSavesFails
         0, // deathSavesSuccesses
         '', // class
         '', // hitDiceConfig
         '{}', // hitDiceUsed
         '[]', // resourcePools
        ]);
      }
    });

    it('fails validation on empty string characterName', () => {
      const row = ['char-3', 'Alice', '', 15];
      const result = CharacterRowSchema.safeParse(row);
      expect(result.success).toBe(false);
    });

    it('parses class at index 19 and defaults to empty string when absent', () => {
      const rowWithClass = ['char-1', 'Alice', 'Thor', 15, 20, 5, 25, 'Blinded', 14, 3, 1, 'Notes', '', '', '', 0, 0, 0, 0, 'Wizard', '4d6', '{}'];
      const parsedWithClass = CharacterRowSchema.safeParse(rowWithClass);
      expect(parsedWithClass.success).toBe(true);
      if (parsedWithClass.success) {
        expect(parsedWithClass.data[19]).toBe('Wizard');
      }

      const rowWithoutClass = ['char-1', 'Alice', 'Thor', 15, 20, 5, 25, 'Blinded', 14, 3, 1, 'Notes', '', '', '', 0, 0, 0, 0];
      const parsedWithoutClass = CharacterRowSchema.safeParse(rowWithoutClass);
      expect(parsedWithoutClass.success).toBe(true);
      if (parsedWithoutClass.success) {
        expect(parsedWithoutClass.data[19]).toBe('');
      }
    });

    it('fails validation on empty string id', () => {
      const row = ['', 'Alice', 'Thor', 15];
      const result = CharacterRowSchema.safeParse(row);
      expect(result.success).toBe(false);
    });

    it('coerces strings to numbers correctly', () => {
      const row = ['char-4', 'Bob', 'Hulk', '16', '30', '0', '30', '', '10', '5', '1', ''];
      const result = CharacterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[3]).toBe(16); // ac
        expect(result.data[4]).toBe(30); // maxHp
      }
    });

    it('A SheetRow containing a mix of string, number, boolean, and null values is accepted by the CharacterRowSchema without errors', () => {
      const row: SheetRow = ['char-mix', 'Alice', 'Mixed', 15, null, true, 20, false, 14, 3, 1, null];
      const result = CharacterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
    });

    it('A BatchRequest with a deleteDimension shape satisfies the BatchRequest type', () => {
      const req = {
        deleteDimension: {
          range: {
            sheetId: 101,
            dimension: 'ROWS' as const,
            startIndex: 1,
            endIndex: 2,
          },
        },
      };
      // Compile-time check: assignable to BatchRequest
      assertType<BatchRequest>(req);
      expect(req).toBeDefined();
    });

    it('parses resistances at index 12, immunities at index 13, and vulnerabilities at index 14 and defaults to empty string when absent', () => {
      const rowWithIrv = ['char-1', 'Alice', 'Thor', 15, 20, 5, 25, 'Blinded', 14, 3, 1, 'Notes', 'Fire', 'Poison', 'Acid'];
      const resultWithIrv = CharacterRowSchema.safeParse(rowWithIrv);
      expect(resultWithIrv.success).toBe(true);
      if (resultWithIrv.success) {
        expect(resultWithIrv.data[12]).toBe('Fire');         // resistances
        expect(resultWithIrv.data[13]).toBe('Poison');       // immunities
        expect(resultWithIrv.data[14]).toBe('Acid');         // vulnerabilities
      }

      const rowWithoutIrv = ['char-2', 'Bob', 'Loki', 15, 20, 5, 25, 'Blinded', 14, 3, 1, 'Notes'];
      const resultWithoutIrv = CharacterRowSchema.safeParse(rowWithoutIrv);
      expect(resultWithoutIrv.success).toBe(true);
      if (resultWithoutIrv.success) {
        expect(resultWithoutIrv.data[12]).toBe(''); // resistances
        expect(resultWithoutIrv.data[13]).toBe(''); // immunities
        expect(resultWithoutIrv.data[14]).toBe(''); // vulnerabilities
      }
    });

    it('Passing a string where a number is expected in a SheetRow still parses correctly via Zod coercion', () => {
      const row: SheetRow = ['char-str-num', 'Bob', 'Stringy', '18', '40'];
      const result = CharacterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[3]).toBe(18); // AC is coerced to number
        expect(result.data[4]).toBe(40); // maxHp is coerced to number
      }
    });

    it('CharacterRowSchema parses hitDiceConfig at index 20, defaults to empty string when absent', () => {
      const row: SheetRow = ['char-1', 'Alice', 'Thor', 15, 20, 5, 25, 'Blinded', 14, 3, 1, 'Notes', '', '', '', 0, 0, 0, 0, '', '4d12+3d10'];
      const result = CharacterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[20]).toBe('4d12+3d10');
      }

      const rowAbsent: SheetRow = ['char-1', 'Alice', 'Thor'];
      const resultAbsent = CharacterRowSchema.safeParse(rowAbsent);
      expect(resultAbsent.success).toBe(true);
      if (resultAbsent.success) {
        expect(resultAbsent.data[20]).toBe('');
      }
    });

    it('CharacterRowSchema parses hitDiceUsed at index 21, defaults to {} when absent', () => {
      const row: SheetRow = ['char-1', 'Alice', 'Thor', 15, 20, 5, 25, 'Blinded', 14, 3, 1, 'Notes', '', '', '', 0, 0, 0, 0, '', '', '{"d12":1}'];
      const result = CharacterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[21]).toBe('{"d12":1}');
      }

      const rowAbsent: SheetRow = ['char-1', 'Alice', 'Thor'];
      const resultAbsent = CharacterRowSchema.safeParse(rowAbsent);
      expect(resultAbsent.success).toBe(true);
      if (resultAbsent.success) {
        expect(resultAbsent.data[21]).toBe('{}');
      }
    });

    it('A 22-element row for Characters parses index 19 as class, index 20 as hitDiceConfig, index 21 as hitDiceUsed', () => {
      const row: SheetRow = ['char-1', 'Alice', 'Thor', 15, 20, 0, 20, '', 14, 1, 1, 'Notes', '', '', '', 0, 0, 0, 0, 'Barbarian', '7d8', '{"d8":2}'];
      const result = CharacterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[19]).toBe('Barbarian');
        expect(result.data[20]).toBe('7d8');
        expect(result.data[21]).toBe('{"d8":2}');
      }
    });

    it('A row shorter than 22 elements returns empty string defaults for class, hitDiceConfig, hitDiceUsed (not undefined or errors)', () => {
      const row: SheetRow = ['char-1', 'Alice', 'Thor', 15, 20, 0, 20, '', 14, 1, 1, 'Notes', '', '', '', 0, 0, 0, 0];
      const result = CharacterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[19]).toBe('');
        expect(result.data[20]).toBe('');
        expect(result.data[21]).toBe('{}'); // default from schema is '{}' for hitDiceUsed, others empty string
      }
    });
  });

  describe('NpcRowSchema', () => {
    it('parses a fully valid row correctly', () => {
      const row = ['npc-1', 'Goblin', 15, 7, 0, 7, '', 'Watch out', 'Fire', 'Poison', 'Cold'];
      const result = NpcRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['npc-1', 'Goblin', 15, 7, 0, 7, '', 'Watch out', 'Fire', 'Poison', 'Cold', 0, 0, '']);
      }
    });

    it('correctly parses resistances, immunities, and vulnerabilities and defaults them to empty strings when absent', () => {
      const row = ['npc-1', 'Goblin', 15, 7, 0, 7, '', 'Watch out'];
      const result = NpcRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[8]).toBe(''); // resistances
        expect(result.data[9]).toBe(''); // immunities
        expect(result.data[10]).toBe(''); // vulnerabilities
      }
    });
  });

  describe('EncounterRowSchema', () => {
    it('parses a fully valid row correctly', () => {
      const row = ['enc-1', 'Ambush', 'Forest', 2, 'npc-1:3', 5, 'ec-42'];
      const result = EncounterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['enc-1', 'Ambush', 'Forest', 2, 'npc-1:3', 5, 'ec-42']);
      }
    });

    it('EncounterRowSchema parses currentRound at index 5', () => {
      const row = ['enc-1', 'Ambush', 'Forest', 2, 'npc-1:3', 3];
      const result = EncounterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[5]).toBe(3);
      }
    });

    it('EncounterRowSchema defaults currentRound to 0 when absent', () => {
      const row = ['enc-2', 'Ambush', 'Forest', 2, 'npc-1:3'];
      const result = EncounterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[5]).toBe(0);
      }
    });

    it('EncounterRowSchema parses activeTurnId at index 6', () => {
      const row = ['enc-3', 'Ambush', 'Forest', 2, 'npc-1:3', 0, 'ec-99'];
      const result = EncounterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[6]).toBe('ec-99');
      }
    });

    it('EncounterRowSchema defaults activeTurnId to empty string when absent', () => {
      const row = ['enc-4', 'Ambush', 'Forest', 2, 'npc-1:3'];
      const result = EncounterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[6]).toBe('');
      }
    });
  });

  describe('EncounterCombatantRowSchema', () => {
    it('parses a fully valid row correctly', () => {
      const row = ['ec-1', 'enc-1', 'char-1', null, 1, 15];
      const result = EncounterCombatantRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['ec-1', 'enc-1', 'char-1', null, 1, 15, '', -1, 0, '', 0]);
      }
    });

    it('handles empty string and null playerId/npcId by converting to null and defaults initiative', () => {
      const row = ['ec-2', 'enc-1', '', null, 1];
      const result = EncounterCombatantRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[2]).toBe(null);
        expect(result.data[3]).toBe(null);
        expect(result.data[5]).toBe(0);
      }
    });

    it('defaults initiative to 0 when absent', () => {
      const row = ['ec-1', 'enc-1', 'char-1', null, 1];
      const result = EncounterCombatantRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[5]).toBe(0);
      }
    });

    it('parses conditionTimers at index 6 as a raw string and defaults to empty string when absent', () => {
      const rowWithTimers = ['ec-1', 'enc-1', 'char-1', null, 1, 15, '{"Hasted":7}'];
      const resultWithTimers = EncounterCombatantRowSchema.safeParse(rowWithTimers);
      expect(resultWithTimers.success).toBe(true);
      if (resultWithTimers.success) {
        expect(resultWithTimers.data[6]).toBe('{"Hasted":7}');
      }

      const rowWithoutTimers = ['ec-2', 'enc-1', 'char-1', null, 1, 15];
      const resultWithoutTimers = EncounterCombatantRowSchema.safeParse(rowWithoutTimers);
      expect(resultWithoutTimers.success).toBe(true);
      if (resultWithoutTimers.success) {
        expect(resultWithoutTimers.data[6]).toBe('');
      }
    });

    it('parses npcCurrentHp at index 7 and npcTempHp at index 8 when they are present', () => {
      const row = ['ec-1', 'enc-1', null, 'npc-1', 1, 15, '{"Hasted":7}', 45, 10];
      const result = EncounterCombatantRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[7]).toBe(45);
        expect(result.data[8]).toBe(10);
      }
    });

    it('defaults npcCurrentHp to -1 and npcTempHp to 0 when they are absent', () => {
      const row = ['ec-1', 'enc-1', null, 'npc-1', 1, 15, '{"Hasted":7}'];
      const result = EncounterCombatantRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[7]).toBe(-1);
        expect(result.data[8]).toBe(0);
      }
    });

    it('coerces numeric strings to numbers for columns H & I', () => {
      const row = ['ec-1', 'enc-1', null, 'npc-1', 1, 15, '{"Hasted":7}', '50', '5'];
      const result = EncounterCombatantRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[7]).toBe(50);
        expect(result.data[8]).toBe(5);
      }
    });

    it('EncounterCombatantRowSchema parses npcCurrentConditions at index 9 as a string', () => {
      const row = ['ec-1', 'enc-1', null, 'npc-1', 1, 15, '', 50, 5, 'blinded, poisoned'];
      const result = EncounterCombatantRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[9]).toBe('blinded, poisoned');
      }
    });

    it('EncounterCombatantRowSchema defaults npcCurrentConditions to empty string when absent', () => {
      const row = ['ec-1', 'enc-1', null, 'npc-1', 1, 15, '', 50, 5];
      const result = EncounterCombatantRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[9]).toBe('');
      }
    });
  });

  describe('StatusRowSchema', () => {
    it('parses a fully valid row correctly', () => {
      const row = [1, 'Active'];
      const result = StatusRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        // ID should be coerced to string
        expect(result.data).toEqual(['1', 'Active']);
      }
    });
  });

  describe('DifficultyRowSchema', () => {
    it('parses a fully valid row correctly', () => {
      const row = [1, 'Easy'];
      const result = DifficultyRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['1', 'Easy']);
      }
    });
  });
});
