import { describe, it, expect } from 'vitest';
import {
  parseHitDiceConfig,
  parseHitDiceUsed,
  serializeHitDiceUsed,
  getHitDiceStatus,
  getTotalHitDiceCount,
  applyLongRestHitDiceRecovery,
  spendHitDice,
  getHitDieForClass,
  addHitDieToConfig,
  parseClassString,
  suggestHitDiceConfig,
} from '../hitDice';

describe('hitDice utility functions', () => {
  describe('parseHitDiceConfig', () => {
    it('returns a single pool for config "7d8"', () => {
      expect(parseHitDiceConfig('7d8')).toEqual([
        { die: 8, count: 7 },
      ]);
    });

    it('returns two pools in order for config "4d12+3d10"', () => {
      expect(parseHitDiceConfig('4d12+3d10')).toEqual([
        { die: 12, count: 4 },
        { die: 10, count: 3 },
      ]);
    });

    it('returns empty list for empty or space string config', () => {
      expect(parseHitDiceConfig('')).toEqual([]);
      expect(parseHitDiceConfig('   ')).toEqual([]);
    });

    it('returns empty list for invalid config strings', () => {
      expect(parseHitDiceConfig('invalid')).toEqual([]);
      expect(parseHitDiceConfig('someText123')).toEqual([]);
      expect(parseHitDiceConfig('7d')).toEqual([]);
      expect(parseHitDiceConfig('d8')).toEqual([]);
      expect(parseHitDiceConfig('4d12+invalid')).toEqual([]);
    });

    it('returns three pools for "1d6+2d8+3d10"', () => {
      expect(parseHitDiceConfig('1d6+2d8+3d10')).toEqual([
        { die: 6, count: 1 },
        { die: 8, count: 2 },
        { die: 10, count: 3 },
      ]);
    });
  });

  describe('parseHitDiceUsed', () => {
    it('parses valid JSON string with dice spent counts', () => {
      expect(parseHitDiceUsed('{"d8":2}')).toEqual({ d8: 2 });
    });

    it('returns empty map for empty or blank JSON string', () => {
      expect(parseHitDiceUsed('')).toEqual({});
      expect(parseHitDiceUsed('   ')).toEqual({});
    });

    it('returns empty map for standard empty JSON object', () => {
      expect(parseHitDiceUsed('{}')).toEqual({});
    });

    it('returns empty map for invalid JSON formats or non-objects', () => {
      expect(parseHitDiceUsed('not json')).toEqual({});
      expect(parseHitDiceUsed('[]')).toEqual({});
      expect(parseHitDiceUsed('null')).toEqual({});
      expect(parseHitDiceUsed('123')).toEqual({});
    });
  });

  describe('serializeHitDiceUsed', () => {
    it('serializes Record to JSON string representation', () => {
      const obj = { d12: 1, d10: 0 };
      const serialized = serializeHitDiceUsed(obj);
      // parse it back to make sure it is syntactically equivalent
      expect(JSON.parse(serialized)).toEqual(obj);
    });
  });

  describe('getHitDiceStatus', () => {
    it('calculates status for config "7d8" and used {"d8":3}', () => {
      const statuses = getHitDiceStatus('7d8', '{"d8":3}');
      expect(statuses).toEqual([
        { die: 8, count: 7, used: 3, remaining: 4 },
      ]);
    });

    it('clamps remaining to 0 if used exceeds count', () => {
      const statuses = getHitDiceStatus('7d8', '{"d8":10}');
      expect(statuses).toEqual([
        { die: 8, count: 7, used: 10, remaining: 0 },
      ]);
    });

    it('calculates correct status for multiclass config and partial spend', () => {
      const statuses = getHitDiceStatus('4d12+3d10', '{"d12":1}');
      expect(statuses).toEqual([
        { die: 12, count: 4, used: 1, remaining: 3 },
        { die: 10, count: 3, used: 0, remaining: 3 },
      ]);
    });
  });

  describe('getTotalHitDiceCount', () => {
    it('adds together count values for multiple pools', () => {
      expect(getTotalHitDiceCount('4d12+3d10')).toBe(7);
      expect(getTotalHitDiceCount('8d8')).toBe(8);
      expect(getTotalHitDiceCount('')).toBe(0);
    });
  });

  describe('applyLongRestHitDiceRecovery', () => {
    it('recovers ceil(7/2)=4 spent dice from 6 spent, leaving 2', () => {
      // 7 total dice, recoveries = 4.
      // smallest die is d10. It has 4 spent. So we recover 4 d10, leaving 0 d10 and 2 d12 spent.
      const config = '3d12+4d10';
      const usedJson = '{"d12":2,"d10":4}';
      const result = applyLongRestHitDiceRecovery(config, usedJson);
      expect(JSON.parse(result)).toEqual({ d12: 2, d10: 0 });
    });

    it('returns unchanged if spent count is 0', () => {
      const config = '7d8';
      const usedJson = '{"d8":0}';
      expect(JSON.parse(applyLongRestHitDiceRecovery(config, usedJson))).toEqual({ d8: 0 });
    });

    it('recovers all spent dice if recoveries >= spent count', () => {
      const config = '7d8';
      const usedJson = '{"d8":2}'; // total limit ceil(7/2) = 4, we only spent 2
      expect(JSON.parse(applyLongRestHitDiceRecovery(config, usedJson))).toEqual({ d8: 0 });
    });

    it('handles edge cases gracefully where used exceeds configured limits', () => {
      const config = '4d12+3d10'; // 7 total, recoveries = 4
      const usedJson = '{"d12":5,"d10":5}'; // invalid state originally, but we can still recover 4 from smallest first (recovers 4 from d10, leaving 1 d10, 5 d12)
      expect(JSON.parse(applyLongRestHitDiceRecovery(config, usedJson))).toEqual({ d12: 5, d10: 1 });
    });
  });

  describe('spendHitDice', () => {
    it('adds to the spent count of a valid die size', () => {
      const res = spendHitDice('7d8', '{"d8":2}', 8, 2);
      expect(JSON.parse(res)).toEqual({ d8: 4 });
    });

    it('initializes and spends when there is no original entry in JSON', () => {
      const res = spendHitDice('7d8', '{}', 8, 1);
      expect(JSON.parse(res)).toEqual({ d8: 1 });
    });

    it('throws an error if trying to spend more than available', () => {
      expect(() => spendHitDice('7d8', '{"d8":6}', 8, 2)).toThrow();
    });

    it('throws if trying to spend die size that is not configured', () => {
      expect(() => spendHitDice('7d8', '{}', 10, 1)).toThrow();
    });

    it('works fine on zero spend', () => {
      expect(JSON.parse(spendHitDice('7d8', '{"d8":2}', 8, 0))).toEqual({ d8: 2 });
    });

    it('throws on negative spend count', () => {
      expect(() => spendHitDice('7d8', '{"d8":2}', 8, -1)).toThrow();
    });
  });

  describe('getHitDieForClass', () => {
    it('getHitDieForClass("Barbarian") returns 12', () => {
      expect(getHitDieForClass('Barbarian')).toBe(12);
    });

    it('getHitDieForClass("wizard") returns 6 (case insensitive)', () => {
      expect(getHitDieForClass('wizard')).toBe(6);
    });

    it('getHitDieForClass("Homebrew") returns null', () => {
      expect(getHitDieForClass('Homebrew')).toBeNull();
    });
  });

  describe('addHitDieToConfig', () => {
    it('addHitDieToConfig("7d8", 8) returns "8d8"', () => {
      expect(addHitDieToConfig('7d8', 8)).toBe('8d8');
    });

    it('addHitDieToConfig("7d8", 6) returns "7d8+1d6"', () => {
      expect(addHitDieToConfig('7d8', 6)).toBe('7d8+1d6');
    });

    it('addHitDieToConfig("", 10) returns "1d10"', () => {
      expect(addHitDieToConfig('', 10)).toBe('1d10');
    });

    it('addHitDieToConfig("4d12+3d10", 10) returns "4d12+4d10"', () => {
      expect(addHitDieToConfig('4d12+3d10', 10)).toBe('4d12+4d10');
    });

    it('addHitDieToConfig("4d12+3d10", 8) returns "4d12+3d10+1d8"', () => {
      expect(addHitDieToConfig('4d12+3d10', 8)).toBe('4d12+3d10+1d8');
    });
  });

  describe('parseClassString', () => {
    it('parseClassString("Barbarian/Fighter") returns ["Barbarian", "Fighter"]', () => {
      expect(parseClassString('Barbarian/Fighter')).toEqual(['Barbarian', 'Fighter']);
    });

    it('parseClassString("Monk") returns ["Monk"]', () => {
      expect(parseClassString('Monk')).toEqual(['Monk']);
    });

    it('parseClassString("") returns []', () => {
      expect(parseClassString('')).toEqual([]);
    });
  });

  describe('suggestHitDiceConfig', () => {
    it('suggestHitDiceConfig("Fighter", 5) returns "5d10"', () => {
      expect(suggestHitDiceConfig('Fighter', 5)).toBe('5d10');
    });

    it('suggestHitDiceConfig("Barbarian/Fighter", 7) returns a config with the correct total of 7 dice', () => {
      // Suggesting "Barbarian/Fighter" for lvl 7 should be:
      // Evenly distributed: 7 / 2 = 3. Remainder = 1.
      // Index 0 (Barbarian) gets 3 + 1 = 4.
      // Index 1 (Fighter) gets 3.
      // Total 4d12 + 3d10. Sorted by largest die size first, d12 then d10.
      expect(suggestHitDiceConfig('Barbarian/Fighter', 7)).toBe('4d12+3d10');
    });
  });
});
