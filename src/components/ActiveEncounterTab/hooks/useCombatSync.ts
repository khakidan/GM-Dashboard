import { useState } from 'react';
import { useAppState } from '../../../hooks/useAppState';
import { useCombatantMutations } from './useCombatantMutations';
import { useCombatLifecycle } from './useCombatLifecycle';
import { useCombatTurn } from './useCombatTurn';
import { useCombatConcentration } from './useCombatConcentration';
import { toast } from 'sonner';
import { useDeathEvent, useDamageEvent, useHealEvent, useUnconsciousEvent, useRageEvent } from '../../../hooks/useOverlayEvents';

export function useCombatSync() {
  const { state, updateState } = useAppState();
  
  const { syncingIds, updateCombatant, removeCombatant } = useCombatantMutations();
  const { rollInitForNPCs, resetCombat, cancelCombat, handleCallInitiative } = useCombatLifecycle();
  const { nextTurn } = useCombatTurn(updateCombatant);
  const {
    concentrationPrompt,
    setConcentrationPrompt,
    handleConcentrationPrompt,
    handleSelectCaster
  } = useCombatConcentration(updateCombatant);

  const [globalError, setGlobalError] = useState<string | null>(null);

  const { fire: fireDeathEvent } = useDeathEvent();
  const { fire: fireDamageEvent } = useDamageEvent();
  const { fire: fireHealEvent } = useHealEvent();
  const { fire: fireUnconsciousEvent } = useUnconsciousEvent();
  const { fire: fireRageEvent } = useRageEvent();

  const handleError = (err: any, fallbackMsg: string) => {
    const _e = typeof err !== 'undefined' ? err : null;
    if (_e && ((_e as any).message === 'UNAUTHENTICATED' || (_e as any).error === 'UNAUTHENTICATED')) {
      toast.error('Session expired — please sign in again.', {
        description: 'Your Google session timed out. Use the Connect & Sync button to reconnect.',
        duration: 8000,
      });
    } else {
      setGlobalError(fallbackMsg);
      setTimeout(() => setGlobalError(null), 5000);
    }
  };

  return {
    syncingIds,
    globalError,
    setGlobalError,
    handleError,
    removeCombatant,
    updateCombatant,
    fireDeathEvent,
    fireDamageEvent,
    fireHealEvent,
    fireUnconsciousEvent,
    fireRageEvent,
    rollInitForNPCs,
    resetCombat,
    cancelCombat,
    handleCallInitiative,
    nextTurn,
    handleConcentrationPrompt,
    handleSelectCaster,
    concentrationPrompt,
    setConcentrationPrompt
  };
}
