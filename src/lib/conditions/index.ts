export {
  DAMAGE_TYPE_OPTIONS,
  CONDITION_OPTIONS,
  EFFECT_OPTIONS,
  CONCENTRATION_EFFECTS,
  CONDITION_IMMUNITY_MAP,
  IRV_OPTIONS,
} from '../irvOptions';

export function isConcentrating(conditions: string | undefined | null): boolean {
  const lowerConditions = (conditions || '').toLowerCase();
  return lowerConditions.split(',').map(s => s.trim()).includes('concentrating');
}

export {
  CONDITION_MECHANICS,
  buildConditionSummary,
  applyLongRestToConditions,
} from '../conditionDefinitions';
export type { ConditionMechanics } from '../conditionDefinitions';

export {
  getEffectiveResistances,
  isDamageTypeMatch,
  effectiveAc,
  effectiveMaxHp,
  getHealthStatus,
} from '../combatLogic';

export {
  CONDITION_DESCRIPTIONS,
  getConditionDescription,
} from '../conditionDescriptions';
export type { ConditionDescription } from '../conditionDescriptions';
