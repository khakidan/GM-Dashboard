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
        expect(result.data).toEqual(['char-1', 'Alice', 'Thor', 15, 20, 5, 25, 'Blinded', 14, 3, 1, 'Notes']);
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
        ]);
      }
    });

    it('fails validation on empty string characterName', () => {
      const row = ['char-3', 'Alice', '', 15];
      const result = CharacterRowSchema.safeParse(row);
      expect(result.success).toBe(false);
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

    it('Passing a string where a number is expected in a SheetRow still parses correctly via Zod coercion', () => {
      const row: SheetRow = ['char-str-num', 'Bob', 'Stringy', '18', '40'];
      const result = CharacterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[3]).toBe(18); // AC is coerced to number
        expect(result.data[4]).toBe(40); // maxHp is coerced to number
      }
    });
  });

  describe('NpcRowSchema', () => {
    it('parses a fully valid row correctly', () => {
      const row = ['npc-1', 'Goblin', 15, 7, 0, 7, '', 'Watch out'];
      const result = NpcRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['npc-1', 'Goblin', 15, 7, 0, 7, '', 'Watch out']);
      }
    });
  });

  describe('EncounterRowSchema', () => {
    it('parses a fully valid row correctly', () => {
      const row = ['enc-1', 'Ambush', 'Forest', 2, 'npc-1:3'];
      const result = EncounterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['enc-1', 'Ambush', 'Forest', 2, 'npc-1:3']);
      }
    });
  });

  describe('EncounterCombatantRowSchema', () => {
    it('parses a fully valid row correctly', () => {
      const row = ['ec-1', 'enc-1', 'char-1', null, 1];
      const result = EncounterCombatantRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['ec-1', 'enc-1', 'char-1', null, 1]);
      }
    });

    it('handles empty string and null playerId/npcId by converting to null', () => {
      const row = ['ec-2', 'enc-1', '', null, 1];
      const result = EncounterCombatantRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[2]).toBe(null);
        expect(result.data[3]).toBe(null);
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
