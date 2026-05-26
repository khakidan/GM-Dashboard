import { useState } from 'react';
import { useAppState } from '../../../hooks/useAppState';
import { Encounter } from '../../../types';
import { deleteEncounterFully } from '../../../services/dbOperations';

interface UseEncountersProps {
  onSelectEncounter: (id: string) => void;
  onSyncRequested: () => Promise<void>;
}

export function useEncounters({ onSelectEncounter, onSyncRequested }: UseEncountersProps) {
  const { state, updateState } = useAppState();
  const [isAdding, setIsAdding] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateEncounter = async () => {
    setIsAdding(true);
    setGlobalError(null);
    const previousState = state;

    const currentIds = state.encounters.map(e => parseInt(e.id)).filter(n => !isNaN(n));
    const nextIdNum = currentIds.length > 0 ? Math.max(...currentIds) + 1 : 1;
    const optimisticId = nextIdNum.toString();

    const optimisticEncounter: Encounter = {
      id: optimisticId,
      name: `New Encounter ${optimisticId}`,
      location: 'Unknown Location',
      difficultyId: 2,
      difficultyName: 'Medium',
      npcDefinitions: '',
      status: 'planned'
    };

    updateState(prev => ({
      ...prev,
      encounters: [...prev.encounters, optimisticEncounter]
    }));

    try {
      const { addEncounterDB } = await import('../../../services/dbOperations');
      const realEnc = await addEncounterDB(`New Encounter ${optimisticId}`, 'Unknown Location', 2, 0);

      updateState(prev => ({
        ...prev,
        encounters: prev.encounters.map(e => e.id === optimisticId ? { ...e, id: realEnc.id } : e)
      }));
      
      onSyncRequested().catch(console.error);
    } catch (err: unknown) {
      console.error("Failed to create encounter", err);
      updateState(previousState);
      
      const errorObj = err as Record<string, unknown> | null;
      if (errorObj?.message === "UNAUTHENTICATED" || errorObj?.error === "UNAUTHENTICATED") {
        alert("Your session has expired. Please sign in again.");
        window.location.reload();
      } else {
        setGlobalError("Unable to create a new encounter at this time. Please try again.");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (enc: Encounter) => {
    setIsDeletingId(enc.id);
    setGlobalError(null);
    
    const previousState = state;
    updateState(prev => ({
      ...prev,
      encounters: prev.encounters.filter(e => e.id !== enc.id),
      encounterCombatants: prev.encounterCombatants.filter(ec => ec.encounterId !== enc.id)
    }));

    try {
      await deleteEncounterFully(enc.id);
      onSyncRequested().catch(console.error);
    } catch (err: unknown) {
      console.error("Failed to delete encounter", err);
      updateState(previousState);
      
      const errorObj = err as Record<string, unknown> | null;
      if (errorObj?.message === "UNAUTHENTICATED" || errorObj?.error === "UNAUTHENTICATED") {
        alert("Your session has expired. Please sign in again.");
        window.location.reload();
      } else {
        setGlobalError(`Failed to delete "${enc.name || 'Encounter'}". It might be heavily linked to combatants.`);
      }
    } finally {
      setIsDeletingId(null);
    }
  };

  return {
    state,
    isAdding,
    isDeletingId,
    globalError,
    expandedIds,
    toggleExpand,
    handleCreateEncounter,
    handleDelete,
  };
}
