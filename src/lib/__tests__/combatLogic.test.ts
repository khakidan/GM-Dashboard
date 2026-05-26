// src/lib/__tests__/combatLogic.test.ts

import { describe, it, expect } from 'vitest';
import {
  applyHealthChange,
  nextTurnIndex,
  isNewRound,
  getHealthStatus,
  rollD20,
  rollNpcInitiatives,
  checkIrvMatch,
  computeDamageWithIrv,
  getExpiredConditions,
} from '../combatLogic';
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

  it('returns Healthy at full HP', () => {
    expect(getHealthStatus(30, 30).label).toBe('Healthy');
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

// ─── rollNpcInitiatives ───────────────────────────────────────────────────────

describe('rollNpcInitiatives', () => {
  const pc: Combatant = {
    id: 'pc1', type: 'pc', name: 'Aria', initiative: 15,
    ac: 16, maxHp: 30, currentHp: 30, passivePerception: 14,
  } as Combatant;

  const npc1: Combatant = {
    id: 'npc1', type: 'npc', name: 'Goblin 1', initiative: 0,
    ac: 13, maxHp: 10, currentHp: 10, passivePerception: 9,
  } as Combatant;

  const npc2: Combatant = {
    id: 'npc2', type: 'npc', name: 'Goblin 2', initiative: 0,
    ac: 13, maxHp: 10, currentHp: 10, passivePerception: 9,
  } as Combatant;

  it('assigns initiative only to NPCs, not PCs', () => {
    // rng always returns 0.5 → rollD20 = 11
    const result = rollNpcInitiatives([pc, npc1, npc2], () => 0.5);
    const resultPc = result.find(c => c.id === 'pc1')!;
    expect(resultPc.initiative).toBe(15); // PC unchanged

    const resultNpc = result.find(c => c.id === 'npc1')!;
    expect(resultNpc.initiative).toBe(11);
  });

  it('does not mutate the original array', () => {
    const original = [pc, npc1, npc2];
    rollNpcInitiatives(original, () => 0.5);
    expect(original[1].initiative).toBe(0); // npc1 still 0
  });

  it('returns combatants sorted by initiative descending', () => {
    let call = 0;
    // npc1 rolls 1 (rng → 0), npc2 rolls 20 (rng → 0.999)
    const rng = () => call++ === 0 ? 0 : 0.999;
    const result = rollNpcInitiatives([pc, npc1, npc2], rng);
    const initiatives = result.map(c => c.initiative);
    expect(initiatives).toEqual([...initiatives].sort((a, b) => b - a));
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

  it("Returns true for 'bludgeoning (nonmagical)' against 'bludgeoning, piercing, slashing (nonmagical)'", () => {
    expect(checkIrvMatch('bludgeoning (nonmagical)', 'bludgeoning, piercing, slashing (nonmagical)')).toBe(true);
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