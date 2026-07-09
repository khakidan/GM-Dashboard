import { describe, it, expect } from 'vitest';
import * as barrel from '../conditions';
import * as irv from '../irvOptions';
import * as defs from '../conditionDefinitions';
import * as logic from '../combatLogic';

describe('Conditions Barrel Exports', () => {
  it('exports CONDITION_OPTIONS', () => {
    expect(barrel.CONDITION_OPTIONS).toBeDefined();
    expect(barrel.CONDITION_OPTIONS).toBe(irv.CONDITION_OPTIONS);
  });

  it('exports CONDITION_MECHANICS', () => {
    expect(barrel.CONDITION_MECHANICS).toBeDefined();
    expect(barrel.CONDITION_MECHANICS).toBe(defs.CONDITION_MECHANICS);
  });

  it('exports buildConditionSummary', () => {
    expect(barrel.buildConditionSummary).toBeDefined();
    expect(barrel.buildConditionSummary).toBe(defs.buildConditionSummary);
  });

  it('exports getEffectiveResistances', () => {
    expect(barrel.getEffectiveResistances).toBeDefined();
    expect(barrel.getEffectiveResistances).toBe(logic.getEffectiveResistances);
  });

  it('exports isConcentrating and correctly detects concentration', () => {
    expect(barrel.isConcentrating).toBeDefined();
    expect(barrel.isConcentrating('concentrating')).toBe(true);
    expect(barrel.isConcentrating('Concentrating, Poisoned')).toBe(true);
    expect(barrel.isConcentrating('Poisoned')).toBe(false);
    expect(barrel.isConcentrating(null)).toBe(false);
  });
});
