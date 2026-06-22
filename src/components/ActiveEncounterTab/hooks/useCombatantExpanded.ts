import { Combatant, Character } from '../../../types';
import { useAppState } from '../../../hooks/useAppState';
import { updateCharacterDB } from '../../../services/dbOperations';
import { getResourceForEffect, parseResourcePools, spendResourcePip, serializeResourcePools } from '../../../lib/resourcePools';
import { toast } from 'sonner';

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

      // 1. Optimistic local state update in Zustand
      updateState((prev) => ({
        ...prev,
        characters: prev.characters.map((charItem) =>
          charItem.id === charId ? { ...charItem, resourcePools: serialized } : charItem
        ),
      }));

      // 2. Call updateCharacterDB with the changed fields
      try {
        await updateCharacterDB({ resourcePools: serialized }, char);
      } catch (err) {
        console.error("Failed to update character resource pools: ", err);
        toast.error(`Failed to sync resource update for ${char.characterName}`);
      }
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

  return {
    handleResourcePoolUpdate,
    handleConditionAdded,
    handleConditionWithTimer,
  };
}
