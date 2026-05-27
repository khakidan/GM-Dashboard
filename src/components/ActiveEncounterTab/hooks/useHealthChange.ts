import { useState } from 'react';
import { Combatant, DamageType } from '../../../types';
import { applyHealthChange, computeDamageWithIrv } from '../../../lib/combatLogic';
import { toast } from 'sonner';

export function useHealthChange(
  syncingIds: Set<string>,
  updateCombatant: (id: string, updates: Partial<Combatant>) => void
) {
  const [damageInputs, setDamageInputs] = useState<Record<string, string>>({});
  const [healInputs, setHealInputs] = useState<Record<string, string>>({});

  const handleHealthChange = (
    id: string,
    c: Combatant,
    isDamage: boolean,
    damageType?: DamageType | null,
    amountOverride?: number
  ) => {
    if (syncingIds.has(id)) return;
    
    const inputState = isDamage ? damageInputs : healInputs;
    const val = amountOverride !== undefined ? amountOverride : parseInt(inputState[id]);
    
    if (!isNaN(val) && val > 0) {
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
    
    if (isDamage) {
      setDamageInputs(prev => ({ ...prev, [id]: '' }));
    } else {
      setHealInputs(prev => ({ ...prev, [id]: '' }));
    }
  };

  return {
    damageInputs,
    setDamageInputs,
    healInputs,
    setHealInputs,
    handleHealthChange
  };
}
