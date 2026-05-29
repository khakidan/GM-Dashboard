import { useState } from 'react';
import { Combatant, DamageType } from '../../../types';
import { applyHealthChange, computeDamageWithIrv, effectiveMaxHp } from '../../../lib/combatLogic';
import { toast } from 'sonner';
import { CONCENTRATION_EFFECTS } from '../../../lib/irvOptions';

export function useHealthChange(
  syncingIds: Set<string>,
  updateCombatant: (id: string, updates: Partial<Combatant>) => void
) {
  const [damageInputs, setDamageInputs] = useState<Record<string, string>>({});
  const [healInputs, setHealInputs] = useState<Record<string, string>>({});

  const removeConcentration = (id: string, currentConditions: string, currentTimers: Record<string, number> = {}) => {
    const conEffectsArray = Array.from(CONCENTRATION_EFFECTS);
    const updatedConditions = currentConditions.split(',')
      .map(s => s.trim())
      .filter(s => s.toLowerCase() !== 'concentrating' && !conEffectsArray.includes(s.toLowerCase()))
      .join(', ');

    const updatedTimers = { ...currentTimers };
    Object.keys(updatedTimers).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'concentrating' || conEffectsArray.includes(lowerKey)) {
        delete updatedTimers[key];
      }
    });

    updateCombatant(id, {
      conditions: updatedConditions,
      conditionTimers: updatedTimers
    });
  };

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
        effectiveMaxHp(c.maxHp, c.tempHpMax),
        finalDamageAmount,
        isDamage
      );
      updateCombatant(id, { currentHp: newCurrentHp, tempHp: newTempHp });
      
      if (isDamage && finalDamageAmount > 0 && c.conditions?.toLowerCase().includes('concentrating')) {
        toast('Concentration check required', {
          description: `${c.name} took ${finalDamageAmount} damage. CON save DC: ${Math.max(10, Math.floor(finalDamageAmount / 2))}`,
          duration: 10000,
          action: {
            label: 'Failed — End Concentration',
            onClick: () => removeConcentration(id, c.conditions || '', c.conditionTimers || {}),
          },
        });
      }
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
