import { getHealthStatus, getEffectiveResistances, effectiveMaxHp, effectiveAc } from '../../lib/conditions';
// src/lib/__tests__/combatLogic.test.ts

// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { applyHealthChange, nextTurnIndex, isNewRound, rollD20, checkIrvMatch, computeDamageWithIrv, getExpiredConditions, computeConcentrationDC, calculateConditionAcModifier, calculateExhaustionHpCap } from '../combatLogic';
import type { Combatant } from '../../types';

// ─── applyHealthChange — damage ───────────────────────────────────────────────

describe('applyHealthChange — damage', () => {
  it('reduces current HP by the damage amount when no temp HP', () => {
    const result = applyHealthChange(20, 0, 30, 5, true);
    expect(result).toEqual({ newCurrentHp: 15, newTempHp: 0 });
  });

  it('absorbs damage into temp HP first', () => {
    const result = applyHealthChange(20, 5, 30, 3, true);
    expect(result).toEqual({ newCurrentHp: 20, newTempHp: 2 });
  });

  it('spills excess damage from temp HP into current HP', () => {
    // 8 damage: 5 absorbed by temp (depleted), 3 bleeds into current
    const result = applyHealthChange(20, 5, 30, 8, true);
    expect(result).toEqual({ newCurrentHp: 17, newTempHp: 0 });
  });

  it('clamps current HP at 0 — no negative HP', () => {
    const result = applyHealthChange(3, 0, 10, 10, true);
    expect(result.newCurrentHp).toBe(0);
  });

  it('handles damage exactly equal to temp HP', () => {
    const result = applyHealthChange(15, 5, 20, 5, true);
    expect(result).toEqual({ newCurrentHp: 15, newTempHp: 0 });
  });

  it('treats a negative amount the same as its absolute value', () => {
    const result = applyHealthChange(20, 0, 30, -5, true);
    expect(result).toEqual({ newCurrentHp: 15, newTempHp: 0 });
  });

  it('does not touch temp HP when target already has 0 temp HP', () => {
    const result = applyHealthChange(20, 0, 30, 5, true);
    expect(result.newTempHp).toBe(0);
  });
});

// ─── applyHealthChange — healing ──────────────────────────────────────────────

describe('applyHealthChange — healing', () => {
  it('increases current HP by the heal amount', () => {
    const result = applyHealthChange(10, 0, 30, 5, false);
    expect(result).toEqual({ newCurrentHp: 15, newTempHp: 0 });
  });

  it('clamps healed HP at maxHp', () => {
    const result = applyHealthChange(28, 0, 30, 10, false);
    expect(result.newCurrentHp).toBe(30);
  });

  it('does not modify temp HP on heal', () => {
    const result = applyHealthChange(10, 5, 30, 8, false);
    expect(result.newTempHp).toBe(5);
  });

  it('healing a full-HP combatant leaves HP unchanged', () => {
    const result = applyHealthChange(30, 0, 30, 10, false);
    expect(result.newCurrentHp).toBe(30);
  });

  it('heals a defeated combatant back above 0', () => {
    const result = applyHealthChange(0, 0, 30, 1, false);
    expect(result.newCurrentHp).toBe(1);
  });
});

// ─── nextTurnIndex ────────────────────────────────────────────────────────────

const makeCombatants = (ids: string[]) => ids.map(id => ({ id } as Combatant));

describe('nextTurnIndex', () => {
  it('returns 0 when there are no combatants', () => {
    expect(nextTurnIndex([], null)).toBe(0);
  });

  it('returns 0 when activeTurnId is null (first turn of combat)', () => {
    expect(nextTurnIndex(makeCombatants(['a', 'b', 'c']), null)).toBe(0);
  });

  it('advances to the next index', () => {
    const combatants = makeCombatants(['a', 'b', 'c']);
    expect(nextTurnIndex(combatants, 'a')).toBe(1);
    expect(nextTurnIndex(combatants, 'b')).toBe(2);
  });

  it('wraps around from the last combatant back to index 0', () => {
    const combatants = makeCombatants(['a', 'b', 'c']);
    expect(nextTurnIndex(combatants, 'c')).toBe(0);
  });

  it('returns 0 when the active ID is not found (stale state)', () => {
    const combatants = makeCombatants(['a', 'b']);
    expect(nextTurnIndex(combatants, 'z')).toBe(0);
  });

  it('works with a single combatant — always wraps to 0', () => {
    const combatants = makeCombatants(['solo']);
    expect(nextTurnIndex(combatants, 'solo')).toBe(0);
  });
});

// ─── isNewRound ───────────────────────────────────────────────────────────────

describe('isNewRound', () => {
  it('returns true when advancing from the last combatant back to the first', () => {
    expect(isNewRound(2, 0)).toBe(true);
  });

  it('returns false when advancing mid-round', () => {
    expect(isNewRound(0, 1)).toBe(false);
    expect(isNewRound(1, 2)).toBe(false);
  });

  it('returns false when currentIndex is -1 (no active turn yet)', () => {
    expect(isNewRound(-1, 0)).toBe(false);
  });
});

// ─── getHealthStatus ──────────────────────────────────────────────────────────

describe('getHealthStatus', () => {
  it('returns Defeated when current HP is 0', () => {
    expect(getHealthStatus(0, 30).label).toBe('Defeated');
  });

  it('returns Defeated when current HP is negative', () => {
    expect(getHealthStatus(-5, 30).label).toBe('Defeated');
  });

  it('returns Full with text-emerald-600 when currentHp equals maxHp exactly', () => {
    const status = getHealthStatus(30, 30);
    expect(status.label).toBe('Full');
    expect(status.color).toBe('text-emerald-600');
  });

  it('returns Healthy (not Full) when currentHp is one below maxHp', () => {
    const status = getHealthStatus(29, 30);
    expect(status.label).toBe('Healthy');
  });

  it('returns Healthy at exactly 90% HP', () => {
    // 27/30 = 0.9 — should still be Healthy
    expect(getHealthStatus(27, 30).label).toBe('Healthy');
  });

  it('returns Injured just below 90%', () => {
    // 26/30 ≈ 0.867
    expect(getHealthStatus(26, 30).label).toBe('Injured');
  });

  it('returns Injured just above 50%', () => {
    // 16/30 ≈ 0.533
    expect(getHealthStatus(16, 30).label).toBe('Injured');
  });

  it('returns Bloodied at exactly 50% — ratio is not > 0.5', () => {
    expect(getHealthStatus(15, 30).label).toBe('Bloodied');
  });

  it('returns Bloodied at 1 HP on a high-HP creature', () => {
    expect(getHealthStatus(1, 100).label).toBe('Bloodied');
  });
});

// ─── rollD20 ──────────────────────────────────────────────────────────────────

describe('rollD20', () => {
  it('returns 1 when rng returns 0', () => {
    expect(rollD20(() => 0)).toBe(1);
  });

  it('returns 20 when rng returns 0.999', () => {
    expect(rollD20(() => 0.999)).toBe(20);
  });

  it('always stays between 1 and 20 with real Math.random', () => {
    for (let i = 0; i < 1000; i++) {
      const roll = rollD20();
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(20);
    }
  });
});

// ─── getEffectiveResistances ──────────────────────────────────────────────────

describe('getEffectiveResistances', () => {
  it('returns base resistances when not raging', () => {
    expect(getEffectiveResistances({ resistances: 'fire', conditions: 'poisoned' })).toBe('fire');
    expect(getEffectiveResistances({ resistances: undefined, conditions: 'prone' })).toBe('');
  });

  it('appends bludgeoning (magical), piercing (magical), slashing (magical) when combatant has raging in conditions', () => {
    expect(getEffectiveResistances({ resistances: undefined, conditions: 'raging, prone' }))
      .toBe('bludgeoning (magical), piercing (magical), slashing (magical)');
  });

  it('merges correctly when combatant already has other resistances', () => {
    expect(getEffectiveResistances({ resistances: 'fire, cold', conditions: 'raging' }))
      .toBe('fire, cold, bludgeoning (magical), piercing (magical), slashing (magical)');
  });

  it('does not duplicate entries when raging and combatant already has physical resistances', () => {
    expect(getEffectiveResistances({ resistances: 'cold, bludgeoning, piercing', conditions: 'raging' }))
      .toBe('cold, bludgeoning (magical), piercing (magical), slashing (magical)');
  });
});

// ─── checkIrvMatch ─────────────────────────────────────────────────────────────

describe('checkIrvMatch', () => {
  it('Returns true when damageType exactly matches an irvString entry', () => {
    expect(checkIrvMatch('fire', 'fire')).toBe(true);
    expect(checkIrvMatch('fire', 'poison, fire, cold')).toBe(true);
  });

  it('Returns true when type is contained in a compound entry', () => {
    expect(checkIrvMatch('fire', 'fire, poison')).toBe(true);
    expect(checkIrvMatch('cold', 'poison, cold resistance')).toBe(true);
  });

  it("Returns false for 'bludgeoning (magical)' against 'bludgeoning, piercing, slashing (nonmagical)'", () => {
    expect(checkIrvMatch('bludgeoning (magical)', 'bludgeoning, piercing, slashing (nonmagical)')).toBe(false);
  });

  it('Returns false when damageType is not present in irvString', () => {
    expect(checkIrvMatch('fire', 'cold, poison')).toBe(false);
  });

  it('Is case insensitive', () => {
    expect(checkIrvMatch('FIRE', 'fire')).toBe(true);
    expect(checkIrvMatch('fire', 'FIRE, POISON')).toBe(true);
  });

  it('Returns false for empty irvString', () => {
    expect(checkIrvMatch('fire', '')).toBe(false);
    expect(checkIrvMatch('fire', null as any)).toBe(false);
  });
});

// ─── computeDamageWithIrv ────────────────────────────────────────────────────────

describe('computeDamageWithIrv', () => {
  it('Returns normal modifier when damageType is null', () => {
    const result = computeDamageWithIrv(10, null, 'fire', 'cold', 'poison');
    expect(result).toEqual({ finalDamage: 10, modifier: 'normal' });
  });

  it('Returns immune with 0 damage when type matches immunities', () => {
    const result = computeDamageWithIrv(10, 'cold', 'fire', 'cold', 'poison');
    expect(result).toEqual({ finalDamage: 0, modifier: 'immune' });
  });

  it('Returns resistant with halved damage when type matches resistances', () => {
    const result = computeDamageWithIrv(10, 'fire', 'fire', 'cold', 'poison');
    expect(result).toEqual({ finalDamage: 5, modifier: 'resistant' });
  });

  it('Returns vulnerable with doubled damage when type matches vulnerabilities', () => {
    const result = computeDamageWithIrv(10, 'poison', 'fire', 'cold', 'poison');
    expect(result).toEqual({ finalDamage: 20, modifier: 'vulnerable' });
  });

  it('Immunities take priority over resistances when both match', () => {
    const result = computeDamageWithIrv(10, 'fire', 'fire', 'fire', 'fire');
    expect(result).toEqual({ finalDamage: 0, modifier: 'immune' });
  });

  it('Halved damage is floored', () => {
    const result = computeDamageWithIrv(15, 'fire', 'fire', '', '');
    expect(result).toEqual({ finalDamage: 7, modifier: 'resistant' });
  });

  it('Doubled damage is correct', () => {
    const result = computeDamageWithIrv(15, 'poison', '', '', 'poison');
    expect(result).toEqual({ finalDamage: 30, modifier: 'vulnerable' });
  });

  describe('computeDamageWithIrv - custom matching matrix', () => {
    it('Magical attack bypasses nonmagical resistance', () => {
      const result = computeDamageWithIrv(20, 'bludgeoning (magical)', 'bludgeoning (nonmagical)', '', '');
      expect(result).toEqual({ finalDamage: 20, modifier: 'normal' });
    });

    it('Generic attack is caught by nonmagical resistance', () => {
      const result = computeDamageWithIrv(20, 'bludgeoning', 'bludgeoning (nonmagical)', '', '');
      expect(result).toEqual({ finalDamage: 10, modifier: 'resistant' });
    });

    it('Magical attack bypasses generic resistance', () => {
      const result = computeDamageWithIrv(20, 'bludgeoning (magical)', 'bludgeoning', '', '');
      expect(result).toEqual({ finalDamage: 20, modifier: 'normal' });
    });

    it('Generic attack is caught by generic resistance', () => {
      const result = computeDamageWithIrv(20, 'bludgeoning', 'bludgeoning', '', '');
      expect(result).toEqual({ finalDamage: 10, modifier: 'resistant' });
    });

    it('Magical attack is caught by magical resistance', () => {
      const result = computeDamageWithIrv(20, 'bludgeoning (magical)', 'bludgeoning (magical)', '', '');
      expect(result).toEqual({ finalDamage: 10, modifier: 'resistant' });
    });

    it('Generic attack is caught by magical resistance', () => {
      const result = computeDamageWithIrv(20, 'bludgeoning', 'bludgeoning (magical)', '', '');
      expect(result).toEqual({ finalDamage: 10, modifier: 'resistant' });
    });

    it('Magical attack bypasses nonmagical immunity', () => {
      const result = computeDamageWithIrv(20, 'piercing (magical)', '', 'piercing (nonmagical)', '');
      expect(result).toEqual({ finalDamage: 20, modifier: 'normal' });
    });

    it('Generic attack is caught by nonmagical immunity', () => {
      const result = computeDamageWithIrv(20, 'piercing', '', 'piercing (nonmagical)', '');
      expect(result).toEqual({ finalDamage: 0, modifier: 'immune' });
    });

    it('Generic attack is caught by magical immunity', () => {
      const result = computeDamageWithIrv(20, 'piercing', '', 'piercing (magical)', '');
      expect(result).toEqual({ finalDamage: 0, modifier: 'immune' });
    });

    it('Magical attack is caught by magical vulnerability', () => {
      const result = computeDamageWithIrv(20, 'slashing (magical)', '', '', 'slashing (magical)');
      expect(result).toEqual({ finalDamage: 40, modifier: 'vulnerable' });
    });

    it('Generic attack is caught by magical vulnerability', () => {
      const result = computeDamageWithIrv(20, 'slashing', '', '', 'slashing (magical)');
      expect(result).toEqual({ finalDamage: 40, modifier: 'vulnerable' });
    });

    it('Unrelated types never match', () => {
      const result = computeDamageWithIrv(20, 'fire', 'bludgeoning (nonmagical)', '', '');
      expect(result).toEqual({ finalDamage: 20, modifier: 'normal' });
    });

    it('Raging barbarian resists magical physical attacks', () => {
      const effRes = getEffectiveResistances({ resistances: '', conditions: 'raging' });
      expect(effRes.toLowerCase()).toContain('bludgeoning (magical)');
      const result = computeDamageWithIrv(20, 'bludgeoning (magical)', effRes, '', '');
      expect(result).toEqual({ finalDamage: 10, modifier: 'resistant' });
    });

    it('Raging barbarian resists nonmagical physical attacks', () => {
      const effRes = getEffectiveResistances({ resistances: '', conditions: 'raging' });
      const result = computeDamageWithIrv(20, 'bludgeoning', effRes, '', '');
      expect(result).toEqual({ finalDamage: 10, modifier: 'resistant' });
    });

    it('No duplicate resistances when raging with existing physical resistance', () => {
      const effRes = getEffectiveResistances({ 
        resistances: 'bludgeoning', 
        conditions: 'raging' 
      });
      const count = (effRes.toLowerCase().match(/bludgeoning/g) || []).length;
      expect(count).toBe(1);
    });
  });
});

// ─── getExpiredConditions ────────────────────────────────────────────────────────

describe('getExpiredConditions', () => {
  it('Returns empty array when no combatants have conditionTimers', () => {
    const combatants: Combatant[] = [
      { id: '1', name: 'Actor 1', type: 'pc', ac: 10, maxHp: 10, currentHp: 10, passivePerception: 10, initiative: 10, conditions: 'Hasted' },
    ];
    const result = getExpiredConditions(combatants, 5);
    expect(result).toEqual([]);
  });

  it('Returns empty array when no timers have expired yet', () => {
    const combatants: Combatant[] = [
      {
        id: '1',
        name: 'Actor 1',
        type: 'pc',
        ac: 10,
        maxHp: 10,
        currentHp: 10,
        passivePerception: 10,
        initiative: 10,
        conditions: 'Hasted',
        conditionTimers: { 'Hasted': 6 },
      },
    ];
    const result = getExpiredConditions(combatants, 5);
    expect(result).toEqual([]);
  });

  it('Returns the correct entry when one condition has expired', () => {
    const combatants: Combatant[] = [
      {
        id: '1',
        name: 'Actor 1',
        type: 'pc',
        ac: 10,
        maxHp: 10,
        currentHp: 10,
        passivePerception: 10,
        initiative: 10,
        conditions: 'Hasted',
        conditionTimers: { 'Hasted': 5 },
      },
    ];
    const result = getExpiredConditions(combatants, 5);
    expect(result).toEqual([
      { combatantId: '1', combatantName: 'Actor 1', conditionName: 'Hasted' },
    ]);
  });

  it('Returns multiple entries when multiple conditions have expired across different combatants', () => {
    const combatants: Combatant[] = [
      {
        id: '1',
        name: 'Actor 1',
        type: 'pc',
        ac: 10,
        maxHp: 10,
        currentHp: 10,
        passivePerception: 10,
        initiative: 10,
        conditions: 'Hasted',
        conditionTimers: { 'Hasted': 5 },
      },
      {
        id: '2',
        name: 'Actor 2',
        type: 'npc',
        ac: 10,
        maxHp: 10,
        currentHp: 10,
        passivePerception: 10,
        initiative: 10,
        conditions: 'Poisoned, Blessed',
        conditionTimers: { 'Poisoned': 4, 'Blessed': 6 },
      },
    ];
    const result = getExpiredConditions(combatants, 5);
    expect(result).toEqual([
      { combatantId: '1', combatantName: 'Actor 1', conditionName: 'Hasted' },
      { combatantId: '2', combatantName: 'Actor 2', conditionName: 'Poisoned' },
    ]);
  });

  it('Does not return a timer entry if the condition name is no longer in the combatant string', () => {
    const combatants: Combatant[] = [
      {
        id: '1',
        name: 'Actor 1',
        type: 'pc',
        ac: 10,
        maxHp: 10,
        currentHp: 10,
        passivePerception: 10,
        initiative: 10,
        conditions: '', // 'Hasted' timer is orphaned
        conditionTimers: { 'Hasted': 5 },
      },
    ];
    const result = getExpiredConditions(combatants, 5);
    expect(result).toEqual([]);
  });

  it('Does not return entries where expiresAtRound is in the future', () => {
    const combatants: Combatant[] = [
      {
        id: '1',
        name: 'Actor 1',
        type: 'pc',
        ac: 10,
        maxHp: 10,
        currentHp: 10,
        passivePerception: 10,
        initiative: 10,
        conditions: 'Hasted',
        conditionTimers: { 'Hasted': 8 },
      },
    ];
    const result = getExpiredConditions(combatants, 5);
    expect(result).toEqual([]);
  });
});

describe('computeConcentrationDC', () => {
  it('is at least 10', () => {
    expect(computeConcentrationDC(5)).toBe(10);
  });
  it('is correct when damage is 20 or more', () => {
    expect(computeConcentrationDC(28)).toBe(14);
  });
  it('is 10 when damage < 20', () => {
    expect(computeConcentrationDC(19)).toBe(10);
  });
  it('is 10 when damage is 20 exactly', () => {
    expect(computeConcentrationDC(20)).toBe(10);
  });
});

describe('calculateConditionAcModifier', () => {
  it('Returns 0 for an empty conditions array', () => {
    expect(calculateConditionAcModifier([])).toBe(0);
  });

  it('Returns the correct sum when a single condition has a tempAcModifier in CONDITION_MECHANICS', () => {
    expect(calculateConditionAcModifier(['hasted'])).toBe(2);
  });

  it('Returns the correct sum when multiple conditions each contribute a modifier', () => {
    // hasted (+2) and slowed (-2)
    expect(calculateConditionAcModifier(['hasted', 'slowed'])).toBe(0);
  });

  it('Returns 0 for conditions not present in CONDITION_MECHANICS (or not having a tempAcModifier field)', () => {
    expect(calculateConditionAcModifier(['poisoned', 'prone', 'made-up-condition'])).toBe(0);
  });
});

describe('calculateExhaustionHpCap', () => {
  it('Returns changed: "gained" with tempHpMax set to half of maxHp (floored) when hasHpMaxHalvedCondition is true and currentTempHpMax is 0', () => {
    const result = calculateExhaustionHpCap(40, true, 0);
    expect(result).toEqual({ tempHpMax: 20, changed: 'gained' });
  });

  it('Returns changed: "lost" with tempHpMax: 0 when hasHpMaxHalvedCondition is false and currentTempHpMax is greater than 0', () => {
    const result = calculateExhaustionHpCap(40, false, 20);
    expect(result).toEqual({ tempHpMax: 0, changed: 'lost' });
  });

  it('Returns changed: "none" with tempHpMax unchanged when the halved state hasn\'t changed (both true-and-already-halved, and both false-and-not-halved cases)', () => {
    // True and already halved
    const result1 = calculateExhaustionHpCap(40, true, 20);
    expect(result1).toEqual({ tempHpMax: 20, changed: 'none' });

    // False and not halved
    const result2 = calculateExhaustionHpCap(40, false, 0);
    expect(result2).toEqual({ tempHpMax: 0, changed: 'none' });
  });

  it('Confirms the floor behavior with an odd maxHp value (e.g. maxHp: 41 should produce tempHpMax: 20)', () => {
    const result = calculateExhaustionHpCap(41, true, 0);
    expect(result).toEqual({ tempHpMax: 20, changed: 'gained' });
  });
});


// ─── effectiveMaxHp ────────────────────────────────────────────────────────────

describe('effectiveMaxHp', () => {
  it('returns maxHp when tempHpMax is undefined', () => {
    expect(effectiveMaxHp(30, undefined)).toBe(30);
  });

  it('returns maxHp when tempHpMax is 0', () => {
    expect(effectiveMaxHp(30, 0)).toBe(30);
  });

  it('returns tempHpMax when tempHpMax is greater than 0', () => {
    expect(effectiveMaxHp(30, 15)).toBe(15);
  });
});

// ─── applyHealthChange with tempHpMax ──────────────────────────────────────────

describe('applyHealthChange with tempHpMax', () => {
  it('caps healing to maxHp when tempHpMax is inactive/0', () => {
    const activeMax = effectiveMaxHp(30, 0);
    const result = applyHealthChange(25, 0, activeMax, 10, false);
    expect(result.newCurrentHp).toBe(30);
  });

  it('caps healing to tempHpMax when tempHpMax is active', () => {
    const activeMax = effectiveMaxHp(30, 15);
    const result = applyHealthChange(12, 0, activeMax, 10, false);
    expect(result.newCurrentHp).toBe(15);
  });
});

// ─── effectiveAc ───────────────────────────────────────────────────────────────

describe('effectiveAc', () => {
  it('effectiveAc(16, -2) returns 14', () => {
    expect(effectiveAc(16, -2)).toBe(14);
  });

  it('effectiveAc(16, 2) returns 18', () => {
    expect(effectiveAc(16, 2)).toBe(18);
  });

  it('effectiveAc(16, 0) returns 16', () => {
    expect(effectiveAc(16, 0)).toBe(16);
  });

  it('effectiveAc(16, undefined) returns 16', () => {
    expect(effectiveAc(16, undefined)).toBe(16);
  });
});
