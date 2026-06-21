import { describe, it, expect } from 'vitest';
import { getConditionDescription, CONDITION_DESCRIPTIONS } from '../conditionDescriptions';

describe('conditionDescriptions tests', () => {
  it('getConditionDescription is case-insensitive and trims whitespace', () => {
    const blind1 = getConditionDescription('blinded');
    const blind2 = getConditionDescription('  BLINDED  ');
    expect(blind1).not.toBeNull();
    expect(blind1?.summary).toContain("Can't see");
    expect(blind1?.rules).toBeInstanceOf(Array);
    expect(blind2).toEqual(blind1);
  });

  it('getConditionDescription returns null for unknown condition keys', () => {
    expect(getConditionDescription('unknownThing')).toBeNull();
    expect(getConditionDescription('')).toBeNull();
  });

  it('standard conditions return non-null descriptions', () => {
    const standards = [
      'blinded',
      'charmed',
      'deafened',
      'frightened',
      'grappled',
      'incapacitated',
      'invisible',
      'paralyzed',
      'petrified',
      'poisoned',
      'prone',
      'restrained',
      'stunned',
      'unconscious'
    ];

    standards.forEach(cond => {
      const desc = getConditionDescription(cond);
      expect(desc).not.toBeNull();
      expect(desc?.summary).toBeDefined();
      expect(desc?.rules.length).toBeGreaterThan(0);
    });
  });

  it('all 6 exhaustion levels return non-null descriptions', () => {
    for (let i = 1; i <= 6; i++) {
      const desc = getConditionDescription(`exhaustion ${i}`);
      expect(desc).not.toBeNull();
      expect(desc?.summary).toBeDefined();
      expect(desc?.rules.length).toBeGreaterThan(0);
    }
  });

  it('CONDITION_DESCRIPTIONS contains at least 30 entries', () => {
    const keysCount = Object.keys(CONDITION_DESCRIPTIONS).length;
    expect(keysCount).toBeGreaterThanOrEqual(30);
  });
});
