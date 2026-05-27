import { useState } from 'react';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { Character } from '../../../types';
import { addCharacterDB, updateCharacterDB, deleteCharacterFully } from '../../../services/dbOperations';
import { toast } from 'sonner';

export function useParty() {
  const { state, updateState } = useAppState();
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isResting, setIsResting] = useState(false);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [levelUpCharacter, setLevelUpCharacter] = useState<Character | null>(null);

  const handleLevelUpConfirm = async (updates: Partial<Character>) => {
    if (!levelUpCharacter) return;
    const previousState = getSnapshot();
    const charId = levelUpCharacter.id;

    // 4. Close the dialog
    setLevelUpCharacter(null);

    // 1. Optimistically update local state with the new values
    updateState(prev => ({
      ...prev,
      characters: prev.characters.map(c => 
        c.id === charId ? { ...c, ...updates } : c
      )
    }));

    // Find the latest char info to ensure we have the right name for the toast
    const char = getSnapshot().characters.find(c => c.id === charId) || levelUpCharacter;

    // 3. Show a sonner toast: "[CharacterName] is now level [N]!"
    const newLevel = updates.level !== undefined ? updates.level : (char.level + 1);
    toast.success(`${char.characterName} is now level ${newLevel}!`);

    // 2. Call updateCharacterDB with the changed fields
    setSyncingId(charId);
    try {
      // Re-fetch char to ensure it's not stale from the component scope
      const latestChar = getSnapshot().characters.find(c => c.id === charId);
      if (!latestChar) throw new Error("Character not found");
      
      await updateCharacterDB(updates, latestChar);
    } catch (err: unknown) {
      console.error("Failed to sync level-up update to sheets", err);
      // rollback
      updateState(previousState);
      const errorObj = err as Record<string, unknown> | null;
      if (errorObj?.message === "UNAUTHENTICATED" || errorObj?.error === "UNAUTHENTICATED") {
        toast.error('Session expired — please sign in again.', {
          description: 'Your Google session timed out. Use the Connect & Sync button to reconnect.',
          duration: 8000,
        });
      } else {
        setGlobalError(`Failed to sync level up for "${char.characterName}".`);
      }
    } finally {
      setSyncingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateCharacter = async (newCharData: Omit<Character, 'id' | 'sheetRowIndex'>) => {
    setIsAddingPlayer(true);
    setGlobalError(null);
    const previousState = state;
    
    // We create a temporary character strictly for optimistic UI
    const tempId = `pc-temp-${Date.now()}`;
    const newChar: Character = {
      ...newCharData,
      id: tempId,
    };

    updateState(prev => ({
      ...prev,
      characters: [...prev.characters, newChar]
    }));

    try {
      const savedChar = await addCharacterDB(newChar);
      // Replace temp with real
      updateState(prev => ({
        ...prev,
        characters: prev.characters.map(c => c.id === tempId ? { ...savedChar } : c) as Character[]
      }));
      toast.success(`${newCharData.characterName} added to the roster`);
    } catch (err: unknown) {
      console.warn(err);
      updateState(previousState);
      const errorObj = err as Record<string, unknown> | null;
      if (errorObj?.message === "UNAUTHENTICATED" || errorObj?.error === "UNAUTHENTICATED") {
        toast.error('Session expired — please sign in again.', {
          description: 'Your Google session timed out. Use the Connect & Sync button to reconnect.',
          duration: 8000,
        });
      } else {
        setGlobalError("Failed to add player. Please try again.");
      }
    } finally {
      setIsAddingPlayer(false);
    }
  };

  const handleLongRest = async () => {
    if (!confirm("Are you sure you want the party to take a long rest? This will reset all Current HP to Max HP and clear all Temp HP.")) return;
    
    setIsResting(true);
    setGlobalError(null);
    
    const previousState = getSnapshot();
    // 1. Update local state optimistically
    updateState(prev => ({
      ...prev,
      characters: prev.characters.map(c => 
        c.isActive ? { ...c, currentHp: c.maxHp, tempHp: 0 } : c
      )
    }));

    try {
      // It's best to rely on dbOperations update loop for safety
      // Use getSnapshot() to ensure we aren't using stale 'state' from the hook closure
      const activePCs = getSnapshot().characters.filter(c => c.isActive);
      
      const updatePromises = activePCs.map(char => {
        return updateCharacterDB({ currentHp: char.maxHp, tempHp: 0 }, char);
      });

      await Promise.all(updatePromises);
    } catch (err: unknown) {
      console.error("Long rest failed", err);
      // 2. Rollback
      updateState(previousState);
      const errorObj = err as Record<string, unknown> | null;
      if (errorObj?.message === "UNAUTHENTICATED" || errorObj?.error === "UNAUTHENTICATED") {
        toast.error('Session expired — please sign in again.', {
          description: 'Your Google session timed out. Use the Connect & Sync button to reconnect.',
          duration: 8000,
        });
      } else {
        setGlobalError("Failed to complete long rest synchronisation.");
      }
    } finally {
      setIsResting(false);
    }
  };

  const handleDeletePlayer = async (id: string) => {
    const char = state.characters.find(c => c.id === id);
    if (!char) return;

    if (!confirm(`Are you sure you want to delete ${char.characterName}?`)) return;

    setGlobalError(null);
    const previousState = state;
    
    updateState(prev => ({
      ...prev,
      characters: prev.characters.filter(c => c.id !== id)
    }));

    toast.success(`${char.characterName} removed from roster.`);

    try {
      await deleteCharacterFully(id);
    } catch (err: unknown) {
      console.warn("Failed to delete character", err);
      updateState(previousState);
      
      const errorObj = err as Record<string, unknown> | null;
      if (errorObj?.message === "UNAUTHENTICATED" || errorObj?.error === "UNAUTHENTICATED") {
        toast.error('Session expired — please sign in again.', {
          description: 'Your Google session timed out. Use the Connect & Sync button to reconnect.',
          duration: 8000,
        });
      } else {
        setGlobalError(`Failed to delete "${char.characterName}". Please try again.`);
      }
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Character>) => {
    const previousState = getSnapshot();
    // Deep validation on updates
    const sanitizedUpdates = { ...updates };
    if (typeof sanitizedUpdates.characterName === 'string') sanitizedUpdates.characterName = sanitizedUpdates.characterName.trim();
    if (typeof sanitizedUpdates.playerName === 'string') sanitizedUpdates.playerName = sanitizedUpdates.playerName.trim();
    
    // Fallbacks for numbers
    if (sanitizedUpdates.ac !== undefined) sanitizedUpdates.ac = Math.max(0, parseInt(sanitizedUpdates.ac as any) || 0);
    if (sanitizedUpdates.maxHp !== undefined) sanitizedUpdates.maxHp = Math.max(1, parseInt(sanitizedUpdates.maxHp as any) || 1);
    if (sanitizedUpdates.currentHp !== undefined) sanitizedUpdates.currentHp = Math.max(0, parseInt(sanitizedUpdates.currentHp as any) || 0);
    if (sanitizedUpdates.tempHp !== undefined) sanitizedUpdates.tempHp = Math.max(0, parseInt(sanitizedUpdates.tempHp as any) || 0);
    if (sanitizedUpdates.level !== undefined) sanitizedUpdates.level = Math.max(1, parseInt(sanitizedUpdates.level as any) || 1);
    if (sanitizedUpdates.passivePerception !== undefined) sanitizedUpdates.passivePerception = Math.max(0, parseInt(sanitizedUpdates.passivePerception as any) || 0);

    // 1. Update local state immediately (Optimistic Update)
    updateState(prev => ({
      ...prev,
      characters: prev.characters.map(c => 
        c.id === id ? { ...c, ...sanitizedUpdates } : c
      )
    }));

    // 2. Check if we need to sync to sheets (if we updated data that lives in the sheet)
    const isSheetData = Object.keys(sanitizedUpdates).some(k => 
      ['playerName', 'characterName', 'ac', 'maxHp', 'tempHp', 'currentHp', 'conditions', 'passivePerception', 'level', 'statusId', 'notes', 'resistances', 'immunities', 'vulnerabilities'].includes(k)
    );

    if (!isSheetData) return;

    // Use getSnapshot() to get the absolute latest state before syncing
    const char = getSnapshot().characters.find(c => c.id === id);
    if (!char) return;
    
    setSyncingId(id);
    try {
      await updateCharacterDB(sanitizedUpdates, char);
    } catch (err: unknown) {
      console.error("Failed to sync party update to sheets", err);
      // 3. Rollback
      updateState(previousState);
      const errorObj = err as Record<string, unknown> | null;
      if (errorObj?.message === "UNAUTHENTICATED" || errorObj?.error === "UNAUTHENTICATED") {
        toast.error('Session expired — please sign in again.', {
          description: 'Your Google session timed out. Use the Connect & Sync button to reconnect.',
          duration: 8000,
        });
      } else {
        setGlobalError(`Failed to update details for "${char.characterName}".`);
      }
    } finally {
      setSyncingId(null);
    }
  };

  return {
    state,
    syncingId,
    isResting,
    isAddingPlayer,
    globalError,
    expandedIds,
    toggleExpand,
    handleCreateCharacter,
    handleLongRest,
    handleDeletePlayer,
    handleUpdate,
    levelUpCharacter,
    setLevelUpCharacter,
    handleLevelUpConfirm,
  };
}
