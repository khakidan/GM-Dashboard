import { CONDITION_MECHANICS, buildConditionSummary, applyLongRestToConditions, CONDITION_OPTIONS } from '../../lib/conditions';
// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import { expect, it, describe } from 'vitest';
;
;

describe('conditionDefinitions', () => {
  it('CONDITION_MECHANICS contains entries for all values in CONDITION_OPTIONS from irvOptions.ts', () => {
    for (const opt of CONDITION_OPTIONS) {
      expect(CONDITION_MECHANICS).toHaveProperty(opt.toLowerCase());
    }
  });

  it('CONDITION_MECHANICS["slowed"] has speedHalved: true, tempAcModifier: -2, removedByLongRest: true', () => {
    expect(CONDITION_MECHANICS.slowed.speedHalved).toBe(true);
    expect(CONDITION_MECHANICS.slowed.tempAcModifier).toBe(-2);
    expect(CONDITION_MECHANICS.slowed.removedByLongRest).toBe(true);
  });

  it('CONDITION_MECHANICS["hasted"] has tempAcModifier: 2', () => {
    expect(CONDITION_MECHANICS.hasted.tempAcModifier).toBe(2);
  });

  it('paralyzed has critVulnerableInMelee: true', () => {
    expect(CONDITION_MECHANICS.paralyzed.critVulnerableInMelee).toBe(true);
  });

  it('poisoned has outgoingDisadvantage: true', () => {
    expect(CONDITION_MECHANICS.poisoned.outgoingDisadvantage).toBe(true);
  });

  it('grappled has speedZero: true but incapacitates: false', () => {
    expect(CONDITION_MECHANICS.grappled.speedZero).toBe(true);
    expect(CONDITION_MECHANICS.grappled.incapacitates).toBe(false);
  });

  it('unconscious has autoFailStr: true, autoFailDex: true, and critVulnerableInMelee: true', () => {
    expect(CONDITION_MECHANICS.unconscious.autoFailStr).toBe(true);
    expect(CONDITION_MECHANICS.unconscious.autoFailDex).toBe(true);
    expect(CONDITION_MECHANICS.unconscious.critVulnerableInMelee).toBe(true);
  });

  it('incapacitated has incapacitates: true but speedZero: false', () => {
    expect(CONDITION_MECHANICS.incapacitated.incapacitates).toBe(true);
    expect(CONDITION_MECHANICS.incapacitated.speedZero).toBe(false);
  });

  describe('buildConditionSummary', () => {
    it('buildConditionSummary(["poisoned"]) returns a line containing "DISADVANTAGE" and sources containing "poisoned"', () => {
      const summary = buildConditionSummary(['poisoned']);
      expect(summary.lines.some(l => l.includes('DISADVANTAGE'))).toBe(true);
      expect(summary.sources.outgoingDisadvantage).toContain('poisoned');
    });

    it('buildConditionSummary(["grappled", "restrained"]) returns speedLocked: true with both sources listed', () => {
      const summary = buildConditionSummary(['grappled', "restrained"]);
      expect(summary.speedLocked).toBe(true);
      expect(summary.sources.speedLocked).toEqual(['grappled', 'restrained']);
    });

    it('buildConditionSummary(["paralyzed"]) returns critVulnerable: true, actionsBlocked: true, speedLocked: true, autoFailStr: true, autoFailDex: true', () => {
      const summary = buildConditionSummary(['paralyzed']);
      expect(summary.critVulnerable).toBe(true);
      expect(summary.actionsBlocked).toBe(true);
      expect(summary.speedLocked).toBe(true);
      expect(summary.autoFailStr).toBe(true);
      expect(summary.autoFailDex).toBe(true);
    });

    it('buildConditionSummary([]) returns empty lines array and all flags false', () => {
      const summary = buildConditionSummary([]);
      expect(summary.lines).toEqual([]);
      expect(summary.speedLocked).toBe(false);
      expect(summary.actionsBlocked).toBe(false);
      expect(summary.outgoingDisadvantage).toBe(false);
      expect(summary.incomingAdvantage).toBe(false);
      expect(summary.critVulnerable).toBe(false);
      expect(summary.autoFailStr).toBe(false);
      expect(summary.autoFailDex).toBe(false);
    });

    it('buildConditionSummary(["custom-effect"]) returns empty lines (unknown conditions are ignored gracefully)', () => {
      const summary = buildConditionSummary(['custom-effect']);
      expect(summary.lines).toEqual([]);
      expect(summary.speedLocked).toBe(false);
    });

    it('buildConditionSummary(["invisible"]) returns finalOutgoing "advantage" and finalIncoming "disadvantage"', () => {
      const summary = buildConditionSummary(['invisible']);
      expect(summary.finalOutgoing).toBe('advantage');
      expect(summary.finalIncoming).toBe('disadvantage');
    });

    it('buildConditionSummary(["blinded", "invisible"]) returns finalOutgoing "normal" (cancelled) and finalIncoming "normal" (cancelled)', () => {
      const summary = buildConditionSummary(['blinded', 'invisible']);
      expect(summary.finalOutgoing).toBe('normal');
      expect(summary.finalIncoming).toBe('normal');
    });

    it('buildConditionSummary(["exhaustion 3"]) returns speedHalved: true, outgoingDisadvantage: true, allSaveDisadvantage: true', () => {
      const summary = buildConditionSummary(['exhaustion 3']);
      expect(summary.speedHalved).toBe(true);
      expect(summary.outgoingDisadvantage).toBe(true);
      expect(summary.allSaveDisadvantage).toBe(true);
      expect(summary.autoFailDex).toBe(false);
    });

    it('buildConditionSummary(["exhaustion 5"]) returns speedZero: true, hpMaxHalved: true', () => {
      const summary = buildConditionSummary(['exhaustion 5']);
      expect(summary.speedLocked).toBe(true);
      expect(summary.hpMaxHalved).toBe(true);
    });

    it('CONDITION_OPTIONS inside irvOptions.ts includes all six exhaustion levels', () => {
      expect(CONDITION_OPTIONS).toContain('exhaustion 1');
      expect(CONDITION_OPTIONS).toContain('exhaustion 2');
      expect(CONDITION_OPTIONS).toContain('exhaustion 3');
      expect(CONDITION_OPTIONS).toContain('exhaustion 4');
      expect(CONDITION_OPTIONS).toContain('exhaustion 5');
      expect(CONDITION_OPTIONS).toContain('exhaustion 6');
    });
  });

  describe('applyLongRestToConditions', () => {
    it('applyLongRestToConditions("concentrating, blessed") returns remaining: "" and removed includes both', () => {
      const result = applyLongRestToConditions('concentrating, blessed');
      expect(result.remaining).toBe('');
      expect(result.removed).toContain('concentrating');
      expect(result.removed).toContain('blessed');
    });

    it('applyLongRestToConditions("poisoned, hasted") returns remaining: "poisoned" (poisoned persists, hasted removed)', () => {
      const result = applyLongRestToConditions('poisoned, hasted');
      expect(result.remaining).toBe('poisoned');
      expect(result.removed).toContain('hasted');
      expect(result.removed).not.toContain('poisoned');
    });

    it('applyLongRestToConditions("exhaustion 3, raging") returns exhaustionReduced: true, newExhaustionLevel: 2, remaining: "exhaustion 2", and raging in removed', () => {
      const result = applyLongRestToConditions('exhaustion 3, raging');
      expect(result.exhaustionReduced).toBe(true);
      expect(result.newExhaustionLevel).toBe(2);
      expect(result.remaining).toBe('exhaustion 2');
      expect(result.removed).toContain('raging');
    });

    it('applyLongRestToConditions("exhaustion 1") returns exhaustionReduced: true, newExhaustionLevel: null, remaining: ""', () => {
      const result = applyLongRestToConditions('exhaustion 1');
      expect(result.exhaustionReduced).toBe(true);
      expect(result.newExhaustionLevel).toBeNull();
      expect(result.remaining).toBe('');
    });

    it('applyLongRestToConditions("blinded, stunned") returns remaining: "blinded, stunned" — neither removed by long rest', () => {
      const result = applyLongRestToConditions('blinded, stunned');
      expect(result.remaining).toBe('blinded, stunned');
      expect(result.removed).toEqual([]);
    });

    it('applyLongRestToConditions("") returns remaining: "" with empty removed array', () => {
      const result = applyLongRestToConditions('');
      expect(result.remaining).toBe('');
      expect(result.removed).toEqual([]);
    });
  });
});
