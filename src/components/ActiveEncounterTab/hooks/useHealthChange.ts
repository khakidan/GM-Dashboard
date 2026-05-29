import { useState } from 'react';
import { Combatant, DamageType } from '../../../types';
import { applyHealthChange, computeDamageWithIrv, effectiveMaxHp, getEffectiveResistances } from '../../../lib/combatLogic';
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
    amountOverride?: number,
    isCritical: boolean = false
  ) => {
    if (syncingIds.has(id)) return;
    
    const inputState = isDamage ? damageInputs : healInputs;
    const val = amountOverride !== undefined ? amountOverride : parseInt(inputState[id]);
    
    if (!isNaN(val) && val > 0) {
      const isUnconscious = c.type === 'pc' && (c.conditions || '').toLowerCase().includes('unconscious');

      if (isDamage && isUnconscious) {
        // Damage on unconscious PC = failed death save
        const failsGain = isCritical ? 2 : 1;
        const newFails = (c.isStable ? 0 : (c.deathSavesFails || 0)) + failsGain;
        toast(`${c.name} is unconscious and took damage — death save failed automatically`);

        if (newFails >= 3) {
          // PC has died!
          const conditionsList = (c.conditions || '').split(',').map(s => s.trim()).filter(Boolean);
          const updatedConditions = conditionsList.filter(cond => cond.toLowerCase() !== 'unconscious').join(', ');
          
          updateCombatant(id, {
            deathSavesFails: newFails,
            deathSavesSuccesses: 0,
            conditions: updatedConditions,
            statusId: 3, // Deceased
            isStable: false
          });
          toast(`${c.name} has died. Update their status on the Party Roster.`);
        } else {
          updateCombatant(id, {
            deathSavesFails: newFails,
            isStable: false
          });
        }

        if (isDamage) {
          setDamageInputs(prev => ({ ...prev, [id]: '' }));
        } else {
          setHealInputs(prev => ({ ...prev, [id]: '' }));
        }
        return;
      }

      let finalDamageAmount = val;
      if (isDamage && damageType) {
        const { finalDamage, modifier } = computeDamageWithIrv(
          val,
          damageType,
          getEffectiveResistances(c),
          c.immunities,
          c.vulnerabilities
        );
        finalDamageAmount = finalDamage;

        if (modifier === 'immune') {
          toast(`${c.name} is immune to ${damageType} — no damage applied`);
        } else if (modifier === 'resistant') {
          const raging = (c.conditions || '').toLowerCase().includes('raging');
          const isPhys = ['bludgeoning', 'piercing', 'slashing'].includes((damageType || '').toLowerCase());
          
          if (raging && isPhys) {
            toast(`${c.name} is raging — ${damageType} damage resisted, halved to ${finalDamage}`);
          } else {
            toast(`${c.name} is resistant to ${damageType} — damage halved to ${finalDamage}`);
          }
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

      if (!isDamage && isUnconscious) {
        // Healing clears death saves
        const conditionsList = (c.conditions || '').split(',').map(s => s.trim()).filter(Boolean);
        const updatedConditions = conditionsList.filter(cond => cond.toLowerCase() !== 'unconscious').join(', ');
        
        updateCombatant(id, {
          currentHp: newCurrentHp,
          tempHp: newTempHp,
          conditions: updatedConditions,
          deathSavesFails: 0,
          deathSavesSuccesses: 0,
          isStable: false,
        });
        toast(`${c.name} is stabilized and regains consciousness!`);
      } else {
        // Normal HP change, check for 0 HP PC auto-unconscious transition
        let updatedConditions = c.conditions || '';
        const wasActiveAndReducedTo0 = isDamage && newCurrentHp === 0 && c.type === 'pc';
        const doesNotHaveUnconscious = !(c.conditions || '').toLowerCase().includes('unconscious');

        if (wasActiveAndReducedTo0 && doesNotHaveUnconscious) {
          const conditionsList = (c.conditions || '').split(',').map(s => s.trim()).filter(Boolean);
          if (!conditionsList.some(cond => cond.toLowerCase() === 'unconscious')) {
            conditionsList.push('Unconscious');
          }
          updatedConditions = conditionsList.join(', ');
          updateCombatant(id, {
            currentHp: newCurrentHp,
            tempHp: newTempHp,
            conditions: updatedConditions,
            deathSavesFails: 0,
            deathSavesSuccesses: 0,
            isStable: false,
          });
        } else {
          updateCombatant(id, {
            currentHp: newCurrentHp,
            tempHp: newTempHp,
          });
        }
      }
      
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
