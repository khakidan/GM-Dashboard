import { useState } from 'react';
import { useAppState } from '../../../hooks/useAppState';
import { addNpcDB, updateNpcFullDB, deleteNpcDB } from '../../../services/dbOperations';
import { toast } from 'sonner';
import { NPC } from '../../../types';
import { parseRechargeOn } from '../../../lib/combatantBuilder';
import {
  proficiencyBonusFromCR,
  parseProficiencies,
  serializeProficiencies,
} from '../../../lib/abilityScores';

export function useNpcLibrary() {
  const { state, updateState, getSnapshot } = useAppState();
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

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
      updateState(prev => ({ ...prev, npcs: previousState.npcs }));
      
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
    // If CR changed, recalculate and embed the
    // proficiency bonus in proficiencies JSON
    if (updates.challengeRating !== undefined) {
      try {
        const currentNpc = state.npcs.find(
          n => n.id === npcId
        );
        const existingProfs = parseProficiencies(
          updates.proficiencies
          ?? currentNpc?.proficiencies
          ?? '{}'
        );
        existingProfs.proficiencyBonus =
          proficiencyBonusFromCR(
            updates.challengeRating
          );
        updates.proficiencies =
          serializeProficiencies(existingProfs);
      } catch {
        // silently ignore parse errors
      }
    }

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
          return { ...ec, npcCurrentHp: Math.min(ec.npcCurrentHp, updates.maxHp) };
        }
        return ec;
      });

      // Propagate template changes (ac, maxHp, conditions, notes, resistances, etc.) to active NPC combatants
      const nextCombatants = prev.combatState.combatants.map(c => {
        if (c.encounterCombatantId && matchedECIds.has(c.encounterCombatantId)) {
          return {
            ...c,
            ...(updates.ac !== undefined ? { ac: updates.ac } : {}),
            ...(updates.maxHp !== undefined ? { maxHp: updates.maxHp, currentHp: Math.min(c.currentHp, updates.maxHp) } : {}),
            ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
            ...(updates.resistances !== undefined ? { resistances: updates.resistances } : {}),
            ...(updates.immunities !== undefined ? { immunities: updates.immunities } : {}),
            ...(updates.vulnerabilities !== undefined ? { vulnerabilities: updates.vulnerabilities } : {}),
            // Re-derive rechargeAbilities if actions changed
            ...(updates.actions !== undefined ? {
              rechargeAbilities: (() => {
                let derived: Array<{
                  name: string;
                  rechargeOn: number;
                  isCharged: boolean;
                }> = [];
                try {
                  const parsedActions = JSON.parse(
                    updates.actions || '[]'
                  ) as Array<{ name: string; recharge?: string }>;
                  for (const action of parsedActions) {
                    const rechargeOn = parseRechargeOn(
                      action.recharge
                    );
                    if (rechargeOn !== null) {
                      derived.push({
                        name: action.name,
                        rechargeOn,
                        isCharged: true,
                      });
                    }
                  }
                } catch {}
                return derived.length > 0 ? derived : undefined;
              })(),
            } : {}),
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
      // Fetch the latest NPC from the global store using getSnapshot() to avoid stale closure data
      const npc = getSnapshot().npcs.find(n => n.id === npcId);
      if (!npc) return;

      await updateNpcFullDB(npc);
    } catch (error) {
      // 4a. Roll back to snapshot on failure
      updateState(prev => ({
        ...prev,
        npcs: previousState.npcs,
        encounterCombatants: previousState.encounterCombatants,
        combatState: {
          ...prev.combatState,
          combatants: previousState.combatState.combatants,
        },
      }));
      
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
      updateState(prev => ({ ...prev, npcs: previousState.npcs }));
      
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
    handleAddNpc,
    handleUpdateNpc,
    handleDeleteNpc,
  };
}
