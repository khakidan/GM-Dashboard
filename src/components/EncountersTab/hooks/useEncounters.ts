import { useState } from 'react';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { Encounter } from '../../../types';
import { addEncounterDB, deleteEncounterFully, updateEncounterDB } from '../../../services/dbOperations';
import { toast } from 'sonner';

interface UseEncountersProps {
  onSelectEncounter: (id: string) => void;
  onSyncRequested: () => Promise<void>;
}

export function useEncounters({ onSelectEncounter, onSyncRequested }: UseEncountersProps) {
  const { state, updateState } = useAppState();
  const [isAdding, setIsAdding] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleCreateEncounter = async (data: { name: string; location: string; difficultyId: number }) => {
    setIsAdding(true);
    setGlobalError(null);
    const previousState = state;

    const currentIds = state.encounters.map(e => parseInt(e.id)).filter(n => !isNaN(n));
    const nextIdNum = currentIds.length > 0 ? Math.max(...currentIds) + 1 : 1;
    const optimisticId = nextIdNum.toString();

    const optimisticEncounter: Encounter = {
      id: optimisticId,
      name: data.name,
      location: data.location || 'Unknown Location',
      difficultyId: data.difficultyId,
      difficultyName: state.difficulties[data.difficultyId] || 'Unknown',
      npcDefinitions: '',
      status: 'planned'
    };

    updateState(prev => ({
      ...prev,
      encounters: [...prev.encounters, optimisticEncounter]
    }));

    try {
      const realEnc = await addEncounterDB(data.name, data.location, data.difficultyId, 0);

      updateState(prev => ({
        ...prev,
        encounters: prev.encounters.map(e => e.id === optimisticId ? { ...e, ...realEnc } : e)
      }));
      
      toast.success(`${data.name} added to Encounters`);
      onSyncRequested?.()?.catch(console.error);
    } catch (error) {
      // 4a. Roll back to snapshot on failure
      updateState(prev => ({ ...prev, encounters: previousState.encounters }));
      
      // 4b. Set local error state
      setGlobalError('Unable to create a new encounter at this time. Please try again.');
      
      // 4c. Show error toast
      toast.error('Failed to save changes. Please try again.', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
      
      // 4d. Log for debugging
      console.error('[DB Error]', error);
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

    toast.success(`${enc.name || 'Encounter'} deleted.`);

    try {
      await deleteEncounterFully(enc.id);
      onSyncRequested?.()?.catch(console.error);
    } catch (error) {
      // 4a. Roll back to snapshot on failure
      updateState(prev => ({ ...prev, encounters: previousState.encounters, encounterCombatants: previousState.encounterCombatants }));
      
      // 4b. Set local error state
      setGlobalError(`Failed to delete "${enc.name}". It might be heavily linked to combatants.`);
      
      // 4c. Show error toast
      toast.error('Failed to save changes. Please try again.', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
      
      // 4e. Log for debugging
      console.error('[DB Error]', error);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleUpdateEncounter = async (
    encounterId: string,
    name: string,
    location: string,
    difficultyId: number
  ): Promise<void> => {
    // Optimistic update
    const previous = state;
    updateState(prev => ({
      ...prev,
      encounters: prev.encounters.map(e =>
        e.id === encounterId
          ? { ...e, name, location, difficultyId }
          : e
      ),
    }));
    try {
      await updateEncounterDB(
        encounterId, name, location,
        difficultyId
      );
    } catch (err) {
      updateState(prev => ({ ...prev, encounters: previous.encounters }));
      toast.error(
        'Failed to update encounter.'
      );
      throw err;
    }
  };

  return {
    state,
    isAdding,
    isDeletingId,
    globalError,
    handleCreateEncounter,
    handleDelete,
    handleUpdateEncounter,
  };
}
