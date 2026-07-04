import { useState, useCallback } from 'react';
import { getSnapshot } from '../../../hooks/useAppState';
import { CONCENTRATION_EFFECTS } from '../../../lib/conditions';
import { toast } from 'sonner';
import { Combatant } from '../../../types';

export function useCombatConcentration(updateCombatant: (id: string, updates: Partial<Combatant>) => void) {
  const [concentrationPrompt, setConcentrationPrompt] = useState<{
    effectName: string;
    targetName: string;
  } | null>(null);

  const handleConcentrationPrompt = useCallback((effectName: string, targetName: string) => {
    toast('Concentration required', {
      description: `${effectName} requires concentration. Select the caster to apply the Concentrating condition.`,
      duration: 10000,
      action: {
        label: 'Select caster',
        onClick: () => setConcentrationPrompt({ effectName, targetName })
      }
    });
  }, []);

  const handleSelectCaster = useCallback((casterId: string) => {
    if (!concentrationPrompt) return;
    const { effectName } = concentrationPrompt;

    const currentState = getSnapshot();
    const caster = currentState.combatState.combatants.find(c => c.id === casterId);
    if (!caster) return;

    const lowerConditions = (caster.conditions || '').toLowerCase();
    const isCasterConcentrating = lowerConditions.split(',').map(s => s.trim().toLowerCase()).includes('concentrating');

    const executeCasterUpdate = () => {
      const conEffectsArray = Array.from(CONCENTRATION_EFFECTS);
      const currentCasterConds = (caster.conditions || '').split(',').map(s => s.trim()).filter(Boolean);
      
      const nextCasterConds = currentCasterConds.filter(cName => {
        const lowerC = cName.toLowerCase();
        return lowerC !== 'concentrating' && !conEffectsArray.includes(lowerC);
      });
      
      nextCasterConds.push('concentrating');
      
      const nextTimers = { ...(caster.conditionTimers || {}) };
      Object.keys(nextTimers).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'concentrating' || conEffectsArray.includes(lowerKey)) {
          delete nextTimers[key];
        }
      });

      updateCombatant(casterId, {
        conditions: nextCasterConds.join(', '),
        conditionTimers: nextTimers,
      });

      setConcentrationPrompt(null);
    };

    if (isCasterConcentrating) {
      if (window.confirm(`${caster.name} is already concentrating. End previous and start new?`)) {
        executeCasterUpdate();
      }
    } else {
      executeCasterUpdate();
    }
  }, [concentrationPrompt, updateCombatant]);

  return {
    concentrationPrompt,
    setConcentrationPrompt,
    handleConcentrationPrompt,
    handleSelectCaster
  };
}
