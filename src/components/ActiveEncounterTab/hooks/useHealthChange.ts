import { useState } from 'react';
import { Combatant, DamageType } from '../../../types';
import { applyHealthChange, computeDamageWithIrv } from '../../../lib/combatLogic';
import { toast } from 'sonner';

export function useHealthChange(
  syncingIds: Set<string>,
  updateCombatant: (id: string, updates: Partial<Combatant>) => void
) {
  const [healthInputs, setHealthInputs] = useState<Record<string, string>>({});

  const handleHealthChange = (
    id: string,
    c: Combatant,
    isDamage: boolean,
    damageType?: DamageType | null,
    amountOverride?: number
  ) => {
    if (syncingIds.has(id)) return;
    const val = amountOverride !== undefined ? amountOverride : parseInt(healthInputs[id]);
    if (!isNaN(val)) {
      let finalDamageAmount = val;
      if (isDamage && damageType) {
        const { finalDamage, modifier } = computeDamageWithIrv(
          val,
          damageType,
          c.resistances,
          c.immunities,
          c.vulnerabilities
        );
        finalDamageAmount = finalDamage;

        if (modifier === 'immune') {
          toast(`${c.name} is immune to ${damageType} — no damage applied`);
        } else if (modifier === 'resistant') {
          toast(`${c.name} is resistant to ${damageType} — damage halved to ${finalDamage}`);
        } else if (modifier === 'vulnerable') {
          toast(`${c.name} is vulnerable to ${damageType} — damage doubled to ${finalDamage}`);
        }
      }

      const { newCurrentHp, newTempHp } = applyHealthChange(
        c.currentHp,
        c.tempHp || 0,
        c.maxHp,
        finalDamageAmount,
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
