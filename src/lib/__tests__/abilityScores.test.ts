import { describe, it, expect } from 'vitest';
import {
  calculateModifier,
  proficiencyBonusFromLevel,
  proficiencyBonusFromCR,
  getSavingThrowBonus,
  getSkillBonus,
  getPassiveScore,
  parseAbilityScores,
  parseProficiencies,
  serializeAbilityScores,
  serializeProficiencies,
  DEFAULT_ABILITY_SCORES,
  DEFAULT_PROFICIENCIES
} from '../abilityScores';

describe('Ability Scores & Proficiencies Utilities', () => {
  describe('calculateModifier', () => {
    it('calculates modifiers correctly according to 5e rules', () => {
      expect(calculateModifier(1)).toBe(-5);
      expect(calculateModifier(3)).toBe(-4);
      expect(calculateModifier(5)).toBe(-3);
      expect(calculateModifier(8)).toBe(-1);
      expect(calculateModifier(10)).toBe(0);
      expect(calculateModifier(11)).toBe(0);
      expect(calculateModifier(12)).toBe(1);
      expect(calculateModifier(14)).toBe(2);
      expect(calculateModifier(16)).toBe(3);
      expect(calculateModifier(18)).toBe(4);
      expect(calculateModifier(20)).toBe(5);
      expect(calculateModifier(30)).toBe(10);
    });
  });

  describe('proficiencyBonusFromLevel', () => {
    it('determines the correct proficiency bonus by level', () => {
      expect(proficiencyBonusFromLevel(0)).toBe(2); // below 1 clamp
      expect(proficiencyBonusFromLevel(1)).toBe(2);
      expect(proficiencyBonusFromLevel(4)).toBe(2);
      expect(proficiencyBonusFromLevel(5)).toBe(3);
      expect(proficiencyBonusFromLevel(8)).toBe(3);
      expect(proficiencyBonusFromLevel(9)).toBe(4);
      expect(proficiencyBonusFromLevel(12)).toBe(4);
      expect(proficiencyBonusFromLevel(13)).toBe(5);
      expect(proficiencyBonusFromLevel(16)).toBe(5);
      expect(proficiencyBonusFromLevel(17)).toBe(6);
      expect(proficiencyBonusFromLevel(20)).toBe(6);
      expect(proficiencyBonusFromLevel(25)).toBe(6); // above 20 clamp
    });
  });

  describe('proficiencyBonusFromCR', () => {
    it('returns 2 for CR 0', () =>
      expect(proficiencyBonusFromCR('0')).toBe(2));
    it('returns 2 for CR 1/8', () =>
      expect(proficiencyBonusFromCR('1/8')).toBe(2));
    it('returns 2 for CR 1/4', () =>
      expect(proficiencyBonusFromCR('1/4')).toBe(2));
    it('returns 2 for CR 1/2', () =>
      expect(proficiencyBonusFromCR('1/2')).toBe(2));
    it('returns 2 for CR 1', () =>
      expect(proficiencyBonusFromCR('1')).toBe(2));
    it('returns 2 for CR 4', () =>
      expect(proficiencyBonusFromCR('4')).toBe(2));
    it('returns 3 for CR 5', () =>
      expect(proficiencyBonusFromCR('5')).toBe(3));
    it('returns 3 for CR 8', () =>
      expect(proficiencyBonusFromCR('8')).toBe(3));
    it('returns 4 for CR 9', () =>
      expect(proficiencyBonusFromCR('9')).toBe(4));
    it('returns 4 for CR 12', () =>
      expect(proficiencyBonusFromCR('12')).toBe(4));
    it('returns 5 for CR 13', () =>
      expect(proficiencyBonusFromCR('13')).toBe(5));
    it('returns 5 for CR 16', () =>
      expect(proficiencyBonusFromCR('16')).toBe(5));
    it('returns 6 for CR 17', () =>
      expect(proficiencyBonusFromCR('17')).toBe(6));
    it('returns 9 for CR 30', () =>
      expect(proficiencyBonusFromCR('30')).toBe(9));
  });

  describe('getSavingThrowBonus', () => {
    it('recovers mod if not proficient, mod + proficiencyBonus if proficient', () => {
      // 14 score -> modifier 2
      expect(getSavingThrowBonus(14, false, 2)).toBe(2);
      expect(getSavingThrowBonus(14, true, 2)).toBe(4);
      
      // 8 score -> modifier -1
      expect(getSavingThrowBonus(8, false, 3)).toBe(-1);
      expect(getSavingThrowBonus(8, true, 3)).toBe(2);
    });
  });

  describe('getSkillBonus', () => {
    it('handles skill bonuses for none, proficient, expertise, and jack of all trades', () => {
      const score = 14; // mod = 2
      const profBonus = 3;

      expect(getSkillBonus(score, 'none', profBonus, false)).toBe(2);
      expect(getSkillBonus(score, 'none', profBonus, true)).toBe(3); // + Math.floor(3/2) = +1
      expect(getSkillBonus(score, 'proficient', profBonus, false)).toBe(5); // 2 + 3
      expect(getSkillBonus(score, 'proficient', profBonus, true)).toBe(5);  // Joat should not apply
      expect(getSkillBonus(score, 'expertise', profBonus, false)).toBe(8); // 2 + 6
    });
  });

  describe('getPassiveScore', () => {
    it('calculates passive perception, insight, and investigation correctly', () => {
      const customScores = {
        STR: 10, DEX: 12, CON: 10, INT: 14, WIS: 16, CHA: 10
      };
      
      const customProficiencies = {
        proficiencyBonus: 3,
        jackOfAllTrades: false,
        savingThrows: [],
        skills: {
          'Perception': 'proficient' as const,
          'Investigation': 'expertise' as const,
        },
        passiveBonuses: {
          perception: 2,
          insight: 0,
          investigation: -1,
        }
      };

      // Passive Perception: 10 + WIS mod(3) + Perception proficient(3) + bonus(2) = 18
      expect(getPassiveScore(customScores, customProficiencies, 'perception')).toBe(18);

      // Passive Insight: 10 + WIS mod(3) + Insight none(0) + bonus(0) = 13
      expect(getPassiveScore(customScores, customProficiencies, 'insight')).toBe(13);

      // Passive Investigation: 10 + INT mod(2) + Investigation expertise(6) + bonus(-1) = 17
      expect(getPassiveScore(customScores, customProficiencies, 'investigation')).toBe(17);
    });
  });

  describe('parseAbilityScores', () => {
    it('returns defaults on empty or invalid inputs', () => {
      expect(parseAbilityScores('')).toEqual(DEFAULT_ABILITY_SCORES);
      expect(parseAbilityScores('invalid json')).toEqual(DEFAULT_ABILITY_SCORES);
    });

    it('parses valid JSON string with fallback properties for missing ones', () => {
      const input = JSON.stringify({ STR: 15, DEX: 14 });
      const parsed = parseAbilityScores(input);
      expect(parsed.STR).toBe(15);
      expect(parsed.DEX).toBe(14);
      expect(parsed.CON).toBe(10); // default
    });
  });

  describe('parseProficiencies', () => {
    it('returns defaults on empty or invalid inputs', () => {
      expect(parseProficiencies('')).toEqual(DEFAULT_PROFICIENCIES);
      expect(parseProficiencies('invalid json')).toEqual(DEFAULT_PROFICIENCIES);
    });

    it('parses valid JSON string with fallback properties for missing ones', () => {
      const input = JSON.stringify({
        proficiencyBonus: 4,
        skills: { Perception: 'expertise' }
      });
      const parsed = parseProficiencies(input);
      expect(parsed.proficiencyBonus).toBe(4);
      expect(parsed.skills.Perception).toBe('expertise');
      expect(parsed.jackOfAllTrades).toBe(false); // default
    });

    it('defaults toughFeat to false when not present in JSON', () => {
      const result = parseProficiencies(
        JSON.stringify({
          proficiencyBonus: 3,
          jackOfAllTrades: false,
          savingThrows: [],
          skills: {},
          passiveBonuses: {
            perception: 0,
            insight: 0,
            investigation: 0
          }
        })
      );
      expect(result.toughFeat).toBe(false);
    });

    it('reads toughFeat: true from JSON', () => {
      const result = parseProficiencies(
        JSON.stringify({
          proficiencyBonus: 2,
          jackOfAllTrades: false,
          savingThrows: [],
          skills: {},
          passiveBonuses: {
            perception: 0,
            insight: 0,
            investigation: 0
          },
          toughFeat: true
        })
      );
      expect(result.toughFeat).toBe(true);
    });

    it('DEFAULT_PROFICIENCIES has toughFeat false', () => {
      expect(DEFAULT_PROFICIENCIES.toughFeat).toBe(false);
    });
  });

  describe('serializeAbilityScores', () => {
    it('serializes ability scores to string successfully', () => {
      const res = serializeAbilityScores(DEFAULT_ABILITY_SCORES);
      expect(typeof res).toBe('string');
      expect(JSON.parse(res)).toEqual(DEFAULT_ABILITY_SCORES);
    });
  });

  describe('serializeProficiencies', () => {
    it('serializes proficiencies to string successfully', () => {
      const res = serializeProficiencies(DEFAULT_PROFICIENCIES);
      expect(typeof res).toBe('string');
      expect(JSON.parse(res)).toEqual(DEFAULT_PROFICIENCIES);
    });
  });
});
