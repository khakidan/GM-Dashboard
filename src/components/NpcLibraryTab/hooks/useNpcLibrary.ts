import { useState } from 'react';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { resetNpcHpDB, addNpcDB, updateNpcFullDB, deleteNpcDB } from '../../../services/dbOperations';
import { toast } from 'sonner';
import { NPC } from '../../../types';

export function useNpcLibrary() {
  const { state, updateState } = useAppState();
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleResetNpcHp = async (npcId: string, maxHp: number) => {
    setGlobalError(null);
    const previousState = state;
    
    // 1. Update the NPC in local state optimistically
    updateState(prev => ({
      ...prev,
      npcs: prev.npcs.map(n => n.id === npcId ? { ...n, currentHp: maxHp } : n)
    }));

    setSyncingId(npcId);

    try {
      await resetNpcHpDB(npcId, maxHp);
      toast.success('NPC HP reset successfully!');
    } catch (error) {
      // 4a. Roll back to snapshot on failure
      updateState(previousState);
      
      // 4b. Show error toast
      toast.error('Failed to save changes. Please try again.', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
      
      // 4c. Log for debugging
      console.error('[DB Error]', error);
      
      // 4d. Re-throw so callers can handle if needed
      throw error;
    } finally {
      setSyncingId(null);
    }
  };

  const handleAddNpc = async (newNpcData: Omit<NPC, 'id'>) => {
    setGlobalError(null);
    const previousState = state;
    const tempId = `npc-temp-${Date.now()}`;
    const tempNpc: NPC = { ...newNpcData, id: tempId };

    // Optimistic add
    updateState(prev => ({
      ...prev,
      npcs: [...prev.npcs, tempNpc]
    }));

    try {
      const savedNpc = await addNpcDB({
        name: newNpcData.name,
        ac: newNpcData.ac,
        maxHp: newNpcData.maxHp,
        tempHp: 0,
        currentHp: newNpcData.maxHp,
        conditions: '',
        notes: newNpcData.notes,
        resistances: newNpcData.resistances ?? '',
        immunities: newNpcData.immunities ?? '',
        vulnerabilities: newNpcData.vulnerabilities ?? '',
        legendaryActions: newNpcData.legendaryActions ?? 0,
        legendaryResistances: newNpcData.legendaryResistances ?? 0,
        rechargeAbilities: newNpcData.rechargeAbilities ?? [],
        abilityScores: newNpcData.abilityScores ?? '{}',
        proficiencies: newNpcData.proficiencies ?? '{}',
        speed: newNpcData.speed ?? '',
        senses: newNpcData.senses ?? '',
        languages: newNpcData.languages ?? '',
        challengeRating: newNpcData.challengeRating ?? '',
        traits: newNpcData.traits ?? '[]',
        actions: newNpcData.actions ?? '[]',
        reactions: newNpcData.reactions ?? '[]',
        legendaryActionsList: newNpcData.legendaryActionsList ?? '[]',
        spellcastingAbility: newNpcData.spellcastingAbility ?? '',
      });
      // Replace temp with real
      updateState(prev => ({
        ...prev,
        npcs: prev.npcs.map(n => n.id === tempId ? { ...savedNpc } : n) as NPC[]
      }));
      toast.success(`${newNpcData.name} added to NPC Library`);
    } catch (error) {
      // 4a. Roll back to snapshot on failure
      updateState(previousState);
      
      // 4b. Show error toast
      toast.error('Failed to save changes. Please try again.', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
      
      // 4c. Log for debugging
      console.error('[DB Error]', error);
      
      // 4d. Re-throw so callers can handle if needed
      throw error;
    }
  };

  const handleUpdateNpc = async (npcId: string, updates: Partial<NPC>) => {
    const previousState = state;
    // Optimistically update local state
    updateState(prev => {
      const nextNpcs = prev.npcs.map(n => n.id === npcId ? { ...n, ...updates } : n);

      // Find all EC records that match this npcId
      const matchedECIds = new Set(
        prev.encounterCombatants
          .filter(ec => ec.npcId === npcId)
          .map(ec => ec.id)
      );

      // Update matching EncounterCombatants' npcCurrentHp only if template maxHp changes so limits stay correct
      const nextEncounterCombatants = prev.encounterCombatants.map(ec => {
        if (ec.npcId === npcId && updates.maxHp !== undefined) {
          return { ...ec, npcCurrentHp: updates.maxHp };
        }
        return ec;
      });

      // Propagate template changes (ac, maxHp, conditions, notes, resistances, etc.) to active NPC combatants
      const nextCombatants = prev.combatState.combatants.map(c => {
        if (c.encounterCombatantId && matchedECIds.has(c.encounterCombatantId)) {
          return {
            ...c,
            ...(updates.ac !== undefined ? { ac: updates.ac } : {}),
            ...(updates.maxHp !== undefined ? { maxHp: updates.maxHp, currentHp: updates.maxHp } : {}),
            ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
            ...(updates.resistances !== undefined ? { resistances: updates.resistances } : {}),
            ...(updates.immunities !== undefined ? { immunities: updates.immunities } : {}),
            ...(updates.vulnerabilities !== undefined ? { vulnerabilities: updates.vulnerabilities } : {}),
          };
        }
        return c;
      });

      return {
        ...prev,
        npcs: nextNpcs,
        encounterCombatants: nextEncounterCombatants,
        combatState: {
          ...prev.combatState,
          combatants: nextCombatants,
        }
      };
    });

    setSyncingId(npcId);

    try {
      // Re-fetch the latest NPC from the global store to ensure we're not using stale closure data
      const npc = state.npcs.find(n => n.id === npcId);
      if (!npc) return;

      await updateNpcFullDB(npc);
    } catch (error) {
      // 4a. Roll back to snapshot on failure
      updateState(previousState);
      
      // 4b. Show error toast
      toast.error('Failed to save changes. Please try again.', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
      
      // 4c. Log for debugging
      console.error('[DB Error]', error);
      
      // 4d. Re-throw so callers can handle if needed
      throw error;
    } finally {
      setSyncingId(null);
    }
  };

  const handleDeleteNpc = async (npcId: string) => {
    const latestSnapshot = state;
    const npc = latestSnapshot.npcs.find(n => n.id === npcId);
    if (!npc) return;

    if (!confirm(`Are you sure you want to delete ${npc.name}? This action cannot be undone.`)) return;

    const previousState = state;
    
    // Optimistic delete
    updateState(prev => ({
      ...prev,
      npcs: prev.npcs.filter(n => n.id !== npcId)
    }));

    toast.success(`${npc.name} removed from library.`);

    setSyncingId(npcId);

    try {
      await deleteNpcDB(npcId);
    } catch (error) {
      // 4a. Roll back to snapshot on failure
      updateState(previousState);
      
      // 4b. Show error toast
      toast.error('Failed to save changes. Please try again.', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
      
      // 4c. Log for debugging
      console.error('[DB Error]', error);
      
      // 4d. Re-throw so callers can handle if needed
      throw error;
    } finally {
      setSyncingId(null);
    }
  };

  return {
    state,
    syncingId,
    globalError,
    handleResetNpcHp,
    handleAddNpc,
    handleUpdateNpc,
    handleDeleteNpc,
  };
}
