import { effectiveMaxHp, getEffectiveResistances, CONCENTRATION_EFFECTS } from '../../../lib/conditions';
import { useState } from 'react';
import { Combatant, DamageType } from '../../../types';
import { applyHealthChange, computeDamageWithIrv } from '../../../lib/combatLogic';
import { toast } from 'sonner';
import { useAppState } from '../../../hooks/useAppState';
import { useDashboardStore } from '../../../hooks/dashboardStore';
import { useDamageEvent, useHealEvent, useUnconsciousEvent } from '../../../hooks/useCombatOverlayEvents';
import { useDeathSaves } from '../../../hooks/useDeathSaves';
import { isConcentrating, fireConcentrationAlert } from '../../../lib/concentrationCheck';

export function useHealthChange(
  syncingIds: Set<string>,
  updateCombatant: (id: string, updates: Partial<Combatant>) => Promise<void>
) {
  const { state, updateState } = useAppState();
  const { characters = [], npcs = [] } = state;
  const [damageInputs, setDamageInputs] = useState<Record<string, string>>({});
  const [healInputs, setHealInputs] = useState<Record<string, string>>({});

  const { fire: fireDamageEvent } = useDamageEvent();
  const { fire: fireHealEvent } = useHealEvent();
  const { fire: fireUnconsciousEvent } = useUnconsciousEvent();

  const { applyDamageToUnconscious } = useDeathSaves();

  const removeConcentration = async (id: string, currentConditions: string, currentTimers: Record<string, number> = {}) => {
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

    await updateCombatant(id, {
      conditions: updatedConditions,
      conditionTimers: updatedTimers
    });
  };

  const handleHealthChange = async (
    id: string,
    c: Combatant,
    isDamage: boolean,
    damageType?: DamageType | null,
    amountOverride?: number,
    isCritical: boolean = false,
    skipOverlay: boolean = false
  ) => {
    if (syncingIds.has(id)) return;
    
    const inputState = isDamage ? damageInputs : healInputs;
    const val = amountOverride !== undefined ? amountOverride : parseInt(inputState[id]);
    
    if (!isNaN(val) && val > 0) {
      const isUnconscious = c.type === 'pc' && (c.conditions || '').toLowerCase().includes('unconscious');

      if (isDamage && isUnconscious) {
        // Damage on unconscious PC = failed death save
        await applyDamageToUnconscious(id, isCritical);

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
        
        await updateCombatant(id, {
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
          await updateCombatant(id, {
            currentHp: newCurrentHp,
            tempHp: newTempHp,
            conditions: updatedConditions,
            deathSavesFails: 0,
            deathSavesSuccesses: 0,
            isStable: false,
          });
        } else {
          await updateCombatant(id, {
            currentHp: newCurrentHp,
            tempHp: newTempHp,
          });
        }
      }

      const { addCombatEvent, activeCombatLog, combatState } = useDashboardStore.getState();

      if (activeCombatLog && !skipOverlay) {
        const { actionContext } = combatState;
        const sourceId = actionContext.sourceOverride ?? combatState.activeTurnId;
        const sourceName = actionContext.sourceOverride
          ? (combatState.combatants.find(c => c.id === actionContext.sourceOverride)?.name ?? actionContext.sourceOverride)
          : (combatState.combatants.find(x => x.id === combatState.activeTurnId)?.name ?? null);

        const hpDelta = newCurrentHp - c.currentHp;
        const isManual = combatState.activeTurnId === null && actionContext.sourceOverride === null;

        addCombatEvent({
          round: activeCombatLog.currentRound,
          type: isDamage ? 'damage' : 'healing',
          actorId: isManual ? null : sourceId,
          actorName: isManual ? null : sourceName,
          actionType: actionContext.actionType,
          targetId: id,
          targetName: c.name,
          value: Math.abs(hpDelta),
          damageType: isDamage ? (damageType ?? undefined) : undefined,
          hpBefore: c.currentHp,
          hpAfter: newCurrentHp,
          isManualAdjustment: isManual,
        });

        // If HP reached 0 or below, also log a combatant-defeated event
        if (newCurrentHp <= 0) {
          addCombatEvent({
            round: activeCombatLog.currentRound,
            type: 'combatant-defeated',
            actorId: isManual ? null : sourceId,
            actorName: isManual ? null : sourceName,
            actionType: actionContext.actionType,
            targetId: id,
            targetName: c.name,
            isManualAdjustment: false,
          });
        }
      }

      const isFirstUnconscious = isDamage && c.type === 'pc' && newCurrentHp === 0 && c.currentHp > 0;

      if (isDamage && finalDamageAmount > 0 && !skipOverlay) {
        if (isFirstUnconscious) {
          fireUnconsciousEvent({ characterName: c.name });
        } else {
          fireDamageEvent({ 
            combatantNames: [c.name], 
            damageAmount: finalDamageAmount,
            damageType: damageType || undefined
          });
        }
      }
      
      if (!isDamage && !skipOverlay) {
        const actualHeal = newCurrentHp - c.currentHp;
        if (actualHeal > 0) {
          fireHealEvent({ combatantNames: [c.name], healAmount: actualHeal });
        }
      }
      
      if (isDamage && finalDamageAmount > 0) {
        let isConc = false;
        let name = c.name;

        if (c.type === 'pc') {
          const playerId = (c as any).playerId || c.characterId;
          const character = characters?.find(char => char.id === playerId);
          if (character) {
            isConc = isConcentrating(character.conditions ?? '');
            name = character.characterName;
          } else {
            isConc = isConcentrating(c.conditions ?? '');
          }
        } else {
          const npcId = (c as any).npcId;
          const npcConditions = (c as any).npcTempConditions ?? c.conditions ?? '';
          isConc = isConcentrating(npcConditions);
          if (npcId) {
            const npc = npcs?.find(n => n.id === npcId);
            if (npc) {
              name = npc.name;
            }
          }
        }

        if (isConc) {
          fireConcentrationAlert(name, finalDamageAmount);
          
          toast('Concentration check required', {
            description: `${name} took ${finalDamageAmount} damage. CON save DC: ${Math.max(10, Math.floor(finalDamageAmount / 2))}`,
            duration: 10000,
            action: {
              label: 'Failed — End Concentration',
              onClick: () => removeConcentration(id, c.conditions || '', c.conditionTimers || {}),
            },
          });
        }
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
    handleHealthChange,
    fireDamageEvent,
    fireHealEvent,
    fireUnconsciousEvent
  };
}
