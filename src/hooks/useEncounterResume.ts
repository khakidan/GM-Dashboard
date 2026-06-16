import { useEffect, useRef } from 'react';
import { useAppState } from './useAppState';
import { buildCombatantsFromState } from '../lib/combatantBuilder';

export function useEncounterResume(onActiveTabChange?: (tab: 'party' | 'encounters' | 'npc-library' | 'combat') => void) {
  const { state, updateState } = useAppState();
  const hasAttemptedResume = useRef(false);

  // Runs once after the initial Google 
  // Sheets sync completes. If an encounter 
  // was in progress when the app was last 
  // closed (currentRound > 0), restore it 
  // automatically so the GM does not need 
  // to manually re-select the encounter.
  useEffect(() => {
    // Only attempt resume once when hasInitialSynced transitions to true
    if (!state.hasInitialSynced || hasAttemptedResume.current) return;
    
    hasAttemptedResume.current = true;

    const inProgressEncounter = state.encounters.find(e => (e.currentRound ?? 0) > 0);

    if (inProgressEncounter) {
      const linkedCombatants = state.encounterCombatants.filter(ec => ec.encounterId === inProgressEncounter.id);
      
      if (linkedCombatants.length === 0) {
        console.warn("In-progress encounter found, but no combatants exist. Skipping auto-resume.");
        return;
      }

      const rebuiltCombatants = buildCombatantsFromState(
        inProgressEncounter,
        state.encounterCombatants,
        state.characters,
        state.npcs
      );
      
      rebuiltCombatants.sort((a, b) => b.initiative - a.initiative);
      
      let activeTurnId = inProgressEncounter.activeTurnId || null;
      if (activeTurnId && !rebuiltCombatants.some(c => c.id === activeTurnId)) {
         console.warn("Active turn ID from sheet not found in combatants. Defaulting to first.");
         activeTurnId = rebuiltCombatants.length > 0 ? rebuiltCombatants[0].id : null;
      }

      updateState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          activeEncounterId: inProgressEncounter.id,
          round: inProgressEncounter.currentRound ?? 1,
          activeTurnId,
          combatants: rebuiltCombatants,
        }
      }));

      // Switch to combat tab
      onActiveTabChange?.('combat');
    }
  }, [state.hasInitialSynced, state.encounters, state.encounterCombatants, state.characters, state.npcs, updateState, onActiveTabChange]);
}
