import { useState } from 'react';
import { Combatant } from '../../../types';
import { applyHealthChange } from '../../../lib/combatLogic';

export function useHealthChange(
  syncingIds: Set<string>,
  updateCombatant: (id: string, updates: Partial<Combatant>) => void
) {
  const [healthInputs, setHealthInputs] = useState<Record<string, string>>({});

  const handleHealthChange = (id: string, c: Combatant, isDamage: boolean) => {
    if (syncingIds.has(id)) return;
    const val = parseInt(healthInputs[id]);
    if (!isNaN(val)) {
      const { newCurrentHp, newTempHp } = applyHealthChange(
        c.currentHp,
        c.tempHp || 0,
        c.maxHp,
        val,
        isDamage
      );
      updateCombatant(id, { currentHp: newCurrentHp, tempHp: newTempHp });
    }
    setHealthInputs(prev => ({ ...prev, [id]: '' }));
  };

  return {
    healthInputs,
    setHealthInputs,
    handleHealthChange
  };
}
