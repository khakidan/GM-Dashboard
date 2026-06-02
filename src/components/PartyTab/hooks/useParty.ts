import { effectiveMaxHp, applyLongRestToConditions } from '../../../lib/conditions';
import { useState } from 'react';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { Character } from '../../../types';
import { addCharacterDB, updateCharacterDB, deleteCharacterFully } from '../../../services/dbOperations';
import { toast } from 'sonner';
;
;

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
    const previousState = state;
    const charId = levelUpCharacter.id;

    // 4. Close the dialog
    setLevelUpCharacter(null);

    // 1. Optimistically update local state with the new values
    updateState(prev => {
      const updatedCharacters = prev.characters.map(c => 
        c.id === charId ? { ...c, ...updates } : c
      );
      const updatedCombatants = (prev.combatState?.combatants || []).map(c => {
        if (c.characterId === charId) {
          return {
            ...c,
            ...(updates.ac !== undefined ? { ac: updates.ac } : {}),
            ...(updates.maxHp !== undefined ? { maxHp: updates.maxHp } : {}),
            ...(updates.tempHpMax !== undefined ? { tempHpMax: updates.tempHpMax } : {}),
            ...(updates.conditions !== undefined ? { conditions: updates.conditions } : {}),
            ...(updates.currentHp !== undefined ? { currentHp: updates.currentHp } : {}),
            ...(updates.tempHp !== undefined ? { tempHp: updates.tempHp } : {}),
            ...(updates.characterName !== undefined ? { name: updates.characterName } : {}),
            ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
            ...(updates.passivePerception !== undefined ? { passivePerception: updates.passivePerception } : {}),
          };
        }
        return c;
      });
      return {
        ...prev,
        characters: updatedCharacters,
        combatState: {
          activeEncounterId: prev.combatState?.activeEncounterId ?? null,
          activeTurnId: prev.combatState?.activeTurnId ?? null,
          round: prev.combatState?.round ?? 1,
          ...prev.combatState,
          combatants: updatedCombatants,
        }
      };
    });

    // Find the latest char info to ensure we have the right name for the toast
    const char = state.characters.find(c => c.id === charId) || levelUpCharacter;

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
    } catch (error) {
      // 4a. Roll back to snapshot on failure
      updateState(previousState);
      
      // 4b. Set local error state for UI/Tests
      setGlobalError(`Failed to update details for "${levelUpCharacter.characterName}".`);
      
      // 4c. Show error toast
      toast.error('Failed to save changes. Please try again.', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
      
      // 4e. Log for debugging
      console.error('[DB Error]', error);
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
    } catch (error) {
      // 4a. Roll back to snapshot on failure
      updateState(previousState);
      
      // 4b. Set local error state
      setGlobalError('Failed to add player. Please try again.');
      
      // 4c. Show error toast
      toast.error('Failed to save changes. Please try again.', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
      
      // 4d. Log for debugging
      console.error('[DB Error]', error);
    } finally {
      setIsAddingPlayer(false);
    }
  };

  const handleLongRest = async () => {
    if (!confirm("Are you sure you want the party to take a long rest? This will reset all Current HP to Max HP and clear all Temp HP.")) return;
    
    setIsResting(true);
    setGlobalError(null);
    
    const previousState = state;
    // 1. Update local state optimistically
    updateState(prev => {
      const updatedCharacters = prev.characters.map(c => {
        if (!c.isActive) return c;
        
        const { 
          remaining, 
          removed, 
          exhaustionReduced,
          newExhaustionLevel
        } = applyLongRestToConditions(c.conditions || '');

        const updates: Partial<Character> = {
          currentHp: effectiveMaxHp(c.maxHp, c.tempHpMax),
          tempHp: 0,
        };

        if (remaining !== c.conditions) {
          updates.conditions = remaining;
        }

        const hadHpHalvingExhaustion = [4, 5, 6].some(
          n => (c.conditions || '').toLowerCase()
            .includes(`exhaustion ${n}`)
        );
        const stillHasHpHalvingExhaustion = newExhaustionLevel 
          !== null && newExhaustionLevel >= 4;

        if (hadHpHalvingExhaustion && !stillHasHpHalvingExhaustion) {
          updates.tempHpMax = 0;
          updates.currentHp = c.maxHp;
        }

        return { ...c, ...updates };
      });

      // Mirror the changes into any active PC combatants
      const updatedCombatants = (prev.combatState?.combatants || []).map(
        combatant => {
          if (combatant.type !== 'pc' || !combatant.characterId) {
            return combatant;
          }
          const updatedChar = updatedCharacters.find(
            c => c.id === combatant.characterId
          );
          if (!updatedChar) return combatant;

          return {
            ...combatant,
            currentHp: updatedChar.currentHp,
            tempHp: updatedChar.tempHp ?? 0,
            maxHp: updatedChar.maxHp,
            conditions: updatedChar.conditions || '',
            conditionTimers: {},
          };
        }
      );

      return {
        ...prev,
        characters: updatedCharacters,
        combatState: {
          activeEncounterId: prev.combatState?.activeEncounterId ?? null,
          activeTurnId: prev.combatState?.activeTurnId ?? null,
          round: prev.combatState?.round ?? 1,
          ...prev.combatState,
          combatants: updatedCombatants,
        },
      };
    });

    try {
      // It's best to rely on dbOperations update loop for safety
      // Use getSnapshot() to ensure we aren't using stale 'state' from the hook closure
      const preRestActivePCs = previousState.characters.filter(c => c.isActive);
      
      let anyExhaustionReduced = false;
      const removedEffects: string[] = [];

      const updatePromises = preRestActivePCs.map(char => {
        const { 
          remaining, 
          removed, 
          exhaustionReduced,
          newExhaustionLevel
        } = applyLongRestToConditions(char.conditions || '');

        if (exhaustionReduced) {
          anyExhaustionReduced = true;
        }
        if (removed.length > 0) {
          removedEffects.push(...removed);
        }

        const updates: Partial<Character> = {
          currentHp: effectiveMaxHp(char.maxHp, char.tempHpMax),
          tempHp: 0,
        };

        if (remaining !== char.conditions) {
          updates.conditions = remaining;
        }

        const hadHpHalvingExhaustion = [4, 5, 6].some(
          n => (char.conditions || '').toLowerCase()
            .includes(`exhaustion ${n}`)
        );
        const stillHasHpHalvingExhaustion = newExhaustionLevel 
          !== null && newExhaustionLevel >= 4;

        if (hadHpHalvingExhaustion && !stillHasHpHalvingExhaustion) {
          updates.tempHpMax = 0;
          updates.currentHp = char.maxHp;
        }

        return updateCharacterDB(updates, char);
      });

      await Promise.all(updatePromises);

      const lines: string[] = [];
      if (anyExhaustionReduced) {
        lines.push('Exhaustion reduced by 1 for affected characters.');
      }
      if (removedEffects.length > 0) {
        lines.push(`Effects cleared: ${[...new Set(removedEffects)].join(', ')}.`);
      }

      toast.success('Long rest complete', {
        description: lines.length > 0 
          ? lines.join(' ') 
          : 'All HP restored. No conditions were changed.',
        duration: 8000,
      });

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
    } catch (error) {
      // 4a. Roll back to snapshot on failure
      updateState(previousState);
      
      // 4b. Set local error state
      setGlobalError(`Failed to delete "${char.characterName}".`);
      
      // 4c. Show error toast
      toast.error('Failed to save changes. Please try again.', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
      
      // 4d. Log for debugging
      console.error('[DB Error]', error);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Character>) => {
    const previousState = state;
    // Deep validation on updates
    const sanitizedUpdates = { ...updates };
    if (typeof sanitizedUpdates.characterName === 'string') sanitizedUpdates.characterName = sanitizedUpdates.characterName.trim();
    if (typeof sanitizedUpdates.playerName === 'string') sanitizedUpdates.playerName = sanitizedUpdates.playerName.trim();
    
    // Fallbacks for numbers
    if (sanitizedUpdates.ac !== undefined) sanitizedUpdates.ac = Math.max(0, Number(sanitizedUpdates.ac) || 0);
    if (sanitizedUpdates.tempAc !== undefined) sanitizedUpdates.tempAc = Number(sanitizedUpdates.tempAc) || 0;
    if (sanitizedUpdates.maxHp !== undefined) sanitizedUpdates.maxHp = Math.max(1, Number(sanitizedUpdates.maxHp) || 1);
    if (sanitizedUpdates.currentHp !== undefined) sanitizedUpdates.currentHp = Math.max(0, Number(sanitizedUpdates.currentHp) || 0);
    if (sanitizedUpdates.tempHp !== undefined) sanitizedUpdates.tempHp = Math.max(0, Number(sanitizedUpdates.tempHp) || 0);
    if (sanitizedUpdates.level !== undefined) sanitizedUpdates.level = Math.max(1, Number(sanitizedUpdates.level) || 1);
    if (sanitizedUpdates.passivePerception !== undefined) sanitizedUpdates.passivePerception = Math.max(0, Number(sanitizedUpdates.passivePerception) || 0);

    // 1. Update local state immediately (Optimistic Update)
    updateState(prev => {
      const updatedCharacters = prev.characters.map(c => 
        c.id === id ? { ...c, ...sanitizedUpdates } : c
      );
      const updatedCombatants = (prev.combatState?.combatants || []).map(c => {
        if (c.characterId === id) {
          return {
            ...c,
            ...(sanitizedUpdates.ac !== undefined ? { ac: sanitizedUpdates.ac } : {}),
            ...(sanitizedUpdates.maxHp !== undefined ? { maxHp: sanitizedUpdates.maxHp } : {}),
            ...(sanitizedUpdates.tempHpMax !== undefined ? { tempHpMax: sanitizedUpdates.tempHpMax } : {}),
            ...(sanitizedUpdates.conditions !== undefined ? { conditions: sanitizedUpdates.conditions } : {}),
            ...(sanitizedUpdates.currentHp !== undefined ? { currentHp: sanitizedUpdates.currentHp } : {}),
            ...(sanitizedUpdates.tempHp !== undefined ? { tempHp: sanitizedUpdates.tempHp } : {}),
            ...(sanitizedUpdates.characterName !== undefined ? { name: sanitizedUpdates.characterName } : {}),
            ...(sanitizedUpdates.notes !== undefined ? { notes: sanitizedUpdates.notes } : {}),
            ...(sanitizedUpdates.passivePerception !== undefined ? { passivePerception: sanitizedUpdates.passivePerception } : {}),
            ...(sanitizedUpdates.tempAc !== undefined ? { tempAcModifier: sanitizedUpdates.tempAc } : {}),
          };
        }
        return c;
      });
      return {
        ...prev,
        characters: updatedCharacters,
        combatState: {
          activeEncounterId: prev.combatState?.activeEncounterId ?? null,
          activeTurnId: prev.combatState?.activeTurnId ?? null,
          round: prev.combatState?.round ?? 1,
          ...prev.combatState,
          combatants: updatedCombatants,
        }
      };
    });

    // 2. Check if we need to sync to sheets (if we updated data that lives in the sheet)
    const isSheetData = Object.keys(sanitizedUpdates).some(k => 
      ['playerName', 'characterName', 'ac', 'maxHp', 'tempHp', 'currentHp', 'conditions', 'passivePerception', 'level', 'statusId', 'notes', 'resistances', 'immunities', 'vulnerabilities', 'tempAc'].includes(k)
    );

    if (!isSheetData) return;

    // Use getSnapshot() to get the absolute latest state before syncing
    const char = getSnapshot().characters.find(c => c.id === id);
    if (!char) return;
    
    setSyncingId(id);
    try {
      await updateCharacterDB(sanitizedUpdates, char);
    } catch (error) {
      // 4a. Roll back to snapshot on failure
      updateState(previousState);
      
      // 4b. Set local error state
      setGlobalError(`Failed to update details for "${char.characterName}".`);
      
      // 4c. Show error toast
      toast.error('Failed to save changes. Please try again.', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
      
      // 4d. Log for debugging
      console.error('[DB Error]', error);
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
