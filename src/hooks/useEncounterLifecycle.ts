import { useAppState, getSnapshot } from './useAppState';
import { buildCombatantsFromState } from '../lib/combatantBuilder';
import { updateEncounterStateDB, clearEncounterStateDB, addEncounterCombatantDB } from '../services/dbOperations';

export function useEncounterLifecycle(onActiveTabChange?: (tab: 'party' | 'encounters' | 'npc-library' | 'combat') => void) {
  const { updateState } = useAppState();

  const startEncounter = async (id: string) => {
    const currentState = getSnapshot();
    const encounter = currentState.encounters.find(e => e.id === id);
    if (!encounter) return;

    const linkedCombatants = currentState.encounterCombatants.filter(ec => ec.encounterId === id);
    const isFirstEntry = linkedCombatants.length === 0;

    const combatants = buildCombatantsFromState(
      encounter,
      currentState.encounterCombatants,
      currentState.characters,
      currentState.npcs
    );
    
    combatants.sort((a, b) => b.initiative - a.initiative);
    const firstCombatantId = combatants.length > 0 ? combatants[0].id : null;

    updateState(prev => ({
      ...prev,
      combatState: {
        activeEncounterId: encounter.id,
        combatants,
        activeTurnId: firstCombatantId,
        round: 1,
        concentrationLinks: {},
        deathEvent: null,
        damageEvent: null,
        initiativeEvent: false,
        selectedIds: [],
        isSelectionMode: false,
        syncingIds: [],
        expandedIds: [],
        combatStarted: false,
        actionContext: { sourceOverride: null, actionType: 'attack' },
      } as any,
    }));

    if (isFirstEntry) {
      const pcCombatants = combatants.filter(c => c.type === 'pc');
      for (const pc of pcCombatants) {
        if (pc.characterId) {
          addEncounterCombatantDB(encounter.id, pc.characterId, null, 1).catch(err => {
            console.warn(`Failed to persist auto-added PC ${pc.name} to encounter`, err);
          });
        }
      }
    }

    updateEncounterStateDB(encounter.id, 1, firstCombatantId ?? '').catch(err => {
      console.warn("Failed to write initial combat state to sheet", err);
    });

    onActiveTabChange?.('combat');
  };

  const clearEncounter = () => {
    const activeEncounterId = getSnapshot().combatState.activeEncounterId;
    updateState(prev => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        activeEncounterId: null,
        deathEvent: null,
        damageEvent: null,
        initiativeEvent: false,
        combatStarted: false,
        actionContext: { sourceOverride: null, actionType: 'attack' },
      } as any,
    }));

    if (activeEncounterId) {
      clearEncounterStateDB(activeEncounterId).catch(err => {
        console.warn("Failed to clear encounter state in sheet", err);
      });
    }

    onActiveTabChange?.('encounters');
  };

  return {
    startEncounter,
    clearEncounter
  };
}
