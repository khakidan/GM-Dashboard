import { Combatant, Character } from '../../../types';
import { useAppState } from '../../../hooks/useAppState';
import { updateCharacterDB } from '../../../services/dbOperations';
import { getResourceForEffect, parseResourcePools, spendResourcePip, serializeResourcePools } from '../../../lib/resourcePools';
import { toast } from 'sonner';
import { useDashboardStore } from '../../../hooks/dashboardStore';

/**
 * useCombatantExpanded hook
 * 
 * Encapsulates resource pool updates and condition-triggered resource depletion
 * logic for the expanded combatant card.
 */
export function useCombatantExpanded(c: Combatant) {
  const { updateState, getSnapshot } = useAppState();

  /**
   * handleResourcePoolUpdate
   * Directly updates character resource pools from the ResourcePoolsSection.
   */
  const handleResourcePoolUpdate = async (updates: Partial<Character>) => {
    if (c.type !== 'pc' || !c.characterId) return;
    const charId = c.characterId;
    const { characters } = getSnapshot();
    const char = characters.find(charItem => charItem.id === charId);
    if (!char) return;

    // Log any resource pool value changes specifically when combat is active
    if (updates.resourcePools !== undefined) {
      const prevPools = parseResourcePools(char.resourcePools || '');
      const nextPools = parseResourcePools(updates.resourcePools);

      for (const nextPool of nextPools) {
        const prevPool = prevPools.find(p => p.name.toLowerCase() === nextPool.name.toLowerCase());
        if (prevPool) {
          if (prevPool.current !== nextPool.current) {
            const { activeCombatLog, addCombatEvent } = useDashboardStore.getState();
            if (activeCombatLog) {
              addCombatEvent({
                round: activeCombatLog.currentRound,
                type: 'resource-changed',
                actorId: null,
                actorName: null,
                targetId: c.id,
                targetName: c.name,
                resourceName: nextPool.name,
                resourceBefore: prevPool.current,
                resourceAfter: nextPool.current,
                resourceMax: nextPool.max,
                isManualAdjustment: true,
              });
            }
          }
        }
      }
    }

    const snapshot = getSnapshot();
    // 1. Optimistic local state update in Zustand
    updateState((prev) => ({
      ...prev,
      characters: prev.characters.map((charItem) =>
        charItem.id === charId ? { ...charItem, ...updates } : charItem
      ),
    }));

    // 2. Call updateCharacterDB with the changed fields
    try {
      await updateCharacterDB(updates, char);
    } catch (err) {
      updateState(prev => ({
        ...prev,
        characters: snapshot.characters,
      }));
      console.error("Failed to update character resource pools: ", err);
      toast.error(`Failed to sync resource update for ${char.characterName}`);
    }
  };

  /**
   * handleConditionAdded
   * Callback for ConditionChips that auto-depletes resources when specific conditions
   * (like 'raging' -> 'rage') are added.
   */
  const handleConditionAdded = async (label: string) => {
    if (c.type !== 'pc' || !c.characterId) return;
    const charId = c.characterId;

    const resourceName = getResourceForEffect(label);
    if (!resourceName) return;

    const latestState = getSnapshot();
    const char = latestState.characters.find(charItem => charItem.id === charId);
    if (!char) return;

    const pools = parseResourcePools(char.resourcePools || '');
    const matchedPool = pools.find(
      (p) => p.name.toLowerCase() === resourceName.toLowerCase()
    );

    if (!matchedPool) return;

    if (matchedPool.current > 0) {
      const updatedPools = spendResourcePip(pools, resourceName, 1);
      const serialized = serializeResourcePools(updatedPools);
      await handleResourcePoolUpdate({ resourcePools: serialized });
    } else {
      toast.warning(`${matchedPool.name} is already depleted.`);
    }
  };

  /**
   * handleConditionWithTimer
   * Orchestrates adding a condition with an expiration round and handles
   * specific logic like exhaustion replacement and timer deduplication.
   */
  const handleConditionWithTimer = async (
    condName: string,
    rounds: number,
    currentRound: number,
    onUpdateCombatant: (updates: Partial<Combatant>) => void
  ) => {
    const expiresAtRound = currentRound + rounds;
    const currentConditions = c.conditions || '';
    let currentCondList = currentConditions.split(',').map(s => s.trim()).filter(Boolean);

    const isExhaustion = /^exhaustion \d$/i.test(condName);
    if (isExhaustion) {
      currentCondList = currentCondList.filter(x => !/^exhaustion \d$/i.test(x.trim()));
    }

    const currentCondListLower = currentCondList.map(s => s.toLowerCase());
    let newConditions = currentConditions;
    if (!currentCondListLower.includes(condName.toLowerCase())) {
      newConditions = [...currentCondList, condName].join(', ');
    } else {
      newConditions = currentCondList.join(', ');
    }

    const newTimers = { ...(c.conditionTimers || {}) };
    if (isExhaustion) {
      Object.keys(newTimers).forEach(key => {
        if (/^exhaustion \d$/i.test(key)) {
          delete newTimers[key];
        }
      });
    }
    newTimers[condName] = expiresAtRound;

    onUpdateCombatant({
      conditions: newConditions,
      conditionTimers: newTimers,
    });
  };

  /**
   * handleExhaustionDeath
   * Marks a PC as deceased when they reach exhaustion level 6.
   */
  const handleExhaustionDeath = async () => {
    if (c.type !== 'pc' || !c.characterId) return;
    const charId = c.characterId;
    const { characters } = getSnapshot();
    const char = characters.find(charItem => charItem.id === charId);
    if (!char) return;

    const snapshot = getSnapshot();
    // 1. Optimistic update
    updateState((prev) => ({
      ...prev,
      characters: prev.characters.map((charItem) =>
        charItem.id === charId ? { ...charItem, statusId: 3 } : charItem
      ),
      combatState: {
        ...prev.combatState,
        combatants: prev.combatState.combatants.map((combatant) =>
          combatant.id === c.id
            ? {
                ...combatant,
                statusId: 3,
                isStable: false,
                conditions: (combatant.conditions || '')
                  .split(',')
                  .map((s) => s.trim())
                  .filter((cond) => cond && cond.toLowerCase() !== 'unconscious')
                  .join(', '),
              }
            : combatant
        ),
      },
    }));

    // 2. Persist
    try {
      await updateCharacterDB({ statusId: 3 }, char);
      toast.info(`Character marked as Deceased: ${char.characterName}`);
    } catch (err) {
      updateState((prev) => ({
        ...prev,
        characters: snapshot.characters,
        combatState: {
          ...prev.combatState,
          combatants: snapshot.combatState.combatants,
        },
      }));
      console.error("Failed to mark character as Deceased: ", err);
      toast.error(`Failed to sync death status for ${char.characterName}`);
    }
  };

  return {
    handleResourcePoolUpdate,
    handleConditionAdded,
    handleConditionWithTimer,
    handleExhaustionDeath,
  };
}
