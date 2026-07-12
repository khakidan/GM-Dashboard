import { effectiveMaxHp, applyLongRestToConditions } from '../../../lib/conditions';
import { applyLongRestHitDiceRecovery } from '../../../lib/hitDice';
import { 
  parseResourcePools, 
  serializeResourcePools, 
  resetResourcesOnShortRest, 
  resetResourcesOnLongRest 
} from '../../../lib/resourcePools';
import { useState } from 'react';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { Character, Combatant, AppState } from '../../../types';
import { addCharacterDB, updateCharacterDB, deleteCharacterFully } from '../../../services/dbOperations';
import { toast } from 'sonner';
import { isConcentrating, fireConcentrationAlert } from '../../../lib/concentrationCheck';
import {
  parseAbilityScores,
  parseProficiencies,
  getPassiveScore,
  proficiencyBonusFromLevel,
  serializeProficiencies,
} from '../../../lib/abilityScores';

function calculateLongRestUpdates(character: Character): Partial<Character> {
  const nextHitDiceUsed = applyLongRestHitDiceRecovery(character.hitDiceConfig || '', character.hitDiceUsed || '{}');
  const currentPools = parseResourcePools(character.resourcePools || '[]');
  const updatedPools = resetResourcesOnLongRest(currentPools);
  const serializedPools = serializeResourcePools(updatedPools);
  const { remaining, newExhaustionLevel } = applyLongRestToConditions(character.conditions || '');

  const updates: Partial<Character> = {
    currentHp: effectiveMaxHp(character.maxHp, character.tempHpMax),
    tempHp: 0,
    hitDiceUsed: nextHitDiceUsed,
    deathSavesFails: 0,
    deathSavesSuccesses: 0,
    resourcePools: serializedPools,
  };

  if (remaining !== character.conditions) {
    updates.conditions = remaining;
  }

  const hadHpHalvingExhaustion = [4, 5, 6].some(
    n => (character.conditions || '').toLowerCase().includes(`exhaustion ${n}`)
  );
  const stillHasHpHalvingExhaustion = newExhaustionLevel !== null && newExhaustionLevel >= 4;
  if (hadHpHalvingExhaustion && !stillHasHpHalvingExhaustion) {
    updates.tempHpMax = 0;
    updates.currentHp = character.maxHp;
  }

  return updates;
}

function calculateShortRestUpdates(
  character: Character, 
  hpToAdd: number, 
  newHitDiceUsed: string
): Partial<Character> {
  const maxHpCeiling = effectiveMaxHp(character.maxHp, character.tempHpMax);
  const newHp = Math.min(
    character.currentHp + hpToAdd,
    maxHpCeiling
  );

  const currentPools = parseResourcePools(character.resourcePools || '[]');
  const updatedPools = resetResourcesOnShortRest(currentPools);
  const serializedPools = serializeResourcePools(updatedPools);

  return {
    currentHp: newHp,
    hitDiceUsed: newHitDiceUsed,
    resourcePools: serializedPools,
  };
}

function withDefaultCombatState(
  prevCombatState: AppState['combatState'] | undefined, 
  updatedCombatants: Combatant[]
) {
  return {
    activeEncounterId: prevCombatState?.activeEncounterId ?? null,
    activeTurnId: prevCombatState?.activeTurnId ?? null,
    round: prevCombatState?.round ?? 1,
    ...prevCombatState,
    combatants: updatedCombatants,
  };
}

function mirrorCharacterFieldsToCombatants(
  combatants: Combatant[],
  characterId: string,
  updates: Partial<Character>
): Combatant[] {
  return combatants.map(c => {
    if (c.characterId !== characterId) return c;
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
      ...(updates.tempAc !== undefined ? { tempAcModifier: updates.tempAc } : {}),
    };
  });
}

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
      const updatedCombatants = mirrorCharacterFieldsToCombatants(
        prev.combatState?.combatants || [],
        charId,
        updates
      );
      return {
        ...prev,
        characters: updatedCharacters,
        combatState: withDefaultCombatState(prev.combatState, updatedCombatants as Combatant[])
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
      updateState(prev => ({
        ...prev,
        characters: previousState.characters,
        combatState: {
          ...prev.combatState,
          combatants: previousState.combatState.combatants,
        },
      }));
      
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
      resourcePools: newCharData.resourcePools ?? '[]',
      abilityScores: newCharData.abilityScores ?? '{}',
      proficiencies: newCharData.proficiencies ?? '{}',
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
      updateState(prev => ({ ...prev, characters: previousState.characters }));
      
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

  const handleLongRest = async (characterIds: string[]) => {
    setIsResting(true);
    setGlobalError(null);
    
    const eligibleCharacterIds = characterIds.filter(id => {
      const char = state.characters.find(c => c.id === id);
      return char?.statusId !== 3;
    });

    if (eligibleCharacterIds.length === 0) {
      toast.info("No eligible characters to rest — deceased characters cannot rest.");
      setIsResting(false);
      return;
    }
    
    const previousState = state;
    // 1. Update local state optimistically
    updateState(prev => {
      const updatedCharacters = prev.characters.map(c => {
        if (!eligibleCharacterIds.includes(c.id)) return c;
        
        const updates = calculateLongRestUpdates(c);

        return { ...c, ...updates };
      });

      // Mirror the changes into any active PC combatants
      const updatedCombatants = (prev.combatState?.combatants || []).map(
        combatant => {
          if (combatant.type !== 'pc' || !combatant.characterId || !eligibleCharacterIds.includes(combatant.characterId)) {
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
            tempHpMax: updatedChar.tempHpMax,
            conditions: updatedChar.conditions || '',
            conditionTimers: {},
          };
        }
      );

      return {
        ...prev,
        characters: updatedCharacters,
        combatState: withDefaultCombatState(prev.combatState, updatedCombatants as Combatant[]),
      };
    });

    try {
      const selectedChars = previousState.characters.filter(c => eligibleCharacterIds.includes(c.id));
      
      const updatePromises = selectedChars.map(char => {
        const updates = calculateLongRestUpdates(char);

        return updateCharacterDB(updates, char);
      });

      await Promise.all(updatePromises);

      let anyExhaustionReduced = false;
      const removedEffects: string[] = [];
      selectedChars.forEach(char => {
        const { removed, exhaustionReduced } = applyLongRestToConditions(char.conditions || '');
        if (exhaustionReduced) anyExhaustionReduced = true;
        if (removed.length > 0) removedEffects.push(...removed);
      });

      const lines: string[] = [];
      lines.push(`Long rest applied to ${selectedChars.length} character(s).`);
      if (anyExhaustionReduced) lines.push('Exhaustion reduced by 1 for affected characters.');
      if (removedEffects.length > 0) lines.push(`Effects cleared: ${[...new Set(removedEffects)].join(', ')}.`);

      toast.success('Long rest complete', {
        description: lines.join(' '),
        duration: 8000,
      });

    } catch (error) {
      // 4a. Roll back to snapshot on failure
      updateState(prev => ({
        ...prev,
        characters: previousState.characters,
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
    } finally {
      setIsResting(false);
    }
  };

  const handleShortRest = async (
    results: Array<{
      characterId: string;
      hpToAdd: number;
      newHitDiceUsed: string;
    }>
  ) => {
    setGlobalError(null);
    
    const eligibleResults = results.filter(res => {
      const char = state.characters.find(c => c.id === res.characterId);
      return char?.statusId !== 3;
    });

    if (eligibleResults.length === 0) {
      toast.info("No eligible characters to rest — deceased characters cannot rest.");
      return;
    }

    const previousState = state;

    // 1. Update local state optimistically
    updateState(prev => {
      const updatedCharacters = prev.characters.map(c => {
        const res = eligibleResults.find(r => r.characterId === c.id);
        if (!res) return c;

        const updates = calculateShortRestUpdates(c, res.hpToAdd, res.newHitDiceUsed);

        return {
          ...c,
          ...updates,
        };
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
          };
        }
      );

      return {
        ...prev,
        characters: updatedCharacters,
        combatState: withDefaultCombatState(prev.combatState, updatedCombatants as Combatant[]),
      };
    });

    try {
      const updatePromises = eligibleResults.map(res => {
        const char = previousState.characters.find(c => c.id === res.characterId);
        if (!char) return Promise.resolve();

        const updates = calculateShortRestUpdates(char, res.hpToAdd, res.newHitDiceUsed);

        return updateCharacterDB(updates, char);
      });

      await Promise.all(updatePromises);

      toast.success('Short rest complete', {
        description: `Short rest applied to ${eligibleResults.length} character(s).`,
      });

    } catch (error) {
      // 4a. Roll back to snapshot on failure
      updateState(prev => ({
        ...prev,
        characters: previousState.characters,
        combatState: {
          ...prev.combatState,
          combatants: previousState.combatState.combatants,
        },
      }));
      
      // 4b. Set local error state
      setGlobalError('Failed to save short rest. Please try again.');

      // 4c. Show error toast
      toast.error('Failed to save changes. Please try again.', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
      
      // 4d. Log for debugging
      console.error('[DB Error]', error);
    }
  };

  const handleDeletePlayer = async (id: string) => {
    const char = state.characters.find(c => c.id === id);
    if (!char) return;

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
      updateState(prev => ({ ...prev, characters: previousState.characters }));
      
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
    
    // Recalculate passive perception if abilityScores, proficiencies, or level changed
    const characterForCalc = state.characters.find(c => c.id === id);
    if (characterForCalc) {
      if (sanitizedUpdates.abilityScores !== undefined || sanitizedUpdates.proficiencies !== undefined || sanitizedUpdates.level !== undefined) {
        const charLevel = sanitizedUpdates.level !== undefined ? Number(sanitizedUpdates.level) : characterForCalc.level;
        const rawAbil = sanitizedUpdates.abilityScores !== undefined ? String(sanitizedUpdates.abilityScores) : (characterForCalc.abilityScores || '{}');
        const rawProf = sanitizedUpdates.proficiencies !== undefined ? String(sanitizedUpdates.proficiencies) : (characterForCalc.proficiencies || '{}');
        
        const abilObj = parseAbilityScores(rawAbil);
        const profObj = parseProficiencies(rawProf);

        // If level changed, let's update proficiency bonus
        if (sanitizedUpdates.level !== undefined) {
          profObj.proficiencyBonus = proficiencyBonusFromLevel(charLevel);
          sanitizedUpdates.proficiencies = serializeProficiencies(profObj);
        }

        const recalculatedPassivePerception = getPassiveScore(abilObj, profObj, 'perception');
        sanitizedUpdates.passivePerception = recalculatedPassivePerception;
      }
    }

    // Fallbacks for numbers
    if (sanitizedUpdates.ac !== undefined) sanitizedUpdates.ac = Math.max(0, Number(sanitizedUpdates.ac) || 0);
    if (sanitizedUpdates.tempAc !== undefined) sanitizedUpdates.tempAc = Number(sanitizedUpdates.tempAc) || 0;
    if (sanitizedUpdates.maxHp !== undefined) sanitizedUpdates.maxHp = Math.max(1, Number(sanitizedUpdates.maxHp) || 1);
    if (sanitizedUpdates.currentHp !== undefined) sanitizedUpdates.currentHp = Math.max(0, Number(sanitizedUpdates.currentHp) || 0);
    if (sanitizedUpdates.tempHp !== undefined) sanitizedUpdates.tempHp = Math.max(0, Number(sanitizedUpdates.tempHp) || 0);
    if (sanitizedUpdates.level !== undefined) sanitizedUpdates.level = Math.max(1, Number(sanitizedUpdates.level) || 1);
    if (sanitizedUpdates.passivePerception !== undefined) sanitizedUpdates.passivePerception = Math.max(0, Number(sanitizedUpdates.passivePerception) || 0);

    const character = state.characters.find(c => c.id === id);
    if (character && sanitizedUpdates.currentHp !== undefined) {
      const newHp = Number(sanitizedUpdates.currentHp);
      const previousHp = character.currentHp;
      const damageTaken = previousHp - newHp;
      
      if (damageTaken > 0 && isConcentrating(character.conditions)) {
        fireConcentrationAlert(
          character.characterName,
          damageTaken
        );
      }
    }

    // 1. Update local state immediately (Optimistic Update)
    updateState(prev => {
      const updatedCharacters = prev.characters.map(c => 
        c.id === id ? { ...c, ...sanitizedUpdates } : c
      );
      const updatedCombatants = mirrorCharacterFieldsToCombatants(
        prev.combatState?.combatants || [],
        id,
        sanitizedUpdates
      );
      return {
        ...prev,
        characters: updatedCharacters,
        combatState: withDefaultCombatState(prev.combatState, updatedCombatants as Combatant[])
      };
    });

    // 2. Check if we need to sync to sheets (if we updated data that lives in the sheet)
    const isSheetData = Object.keys(sanitizedUpdates).some(k => 
      ['playerName', 'characterName', 'class', 'ac', 'maxHp', 'tempHp', 'currentHp', 'conditions', 'passivePerception', 'level', 'statusId', 'notes', 'resistances', 'immunities', 'vulnerabilities', 'tempAc', 'deathSavesFails', 'deathSavesSuccesses', 'hitDiceConfig', 'hitDiceUsed', 'resourcePools', 'abilityScores', 'proficiencies', 'spellcastingAbility'].includes(k)
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
      updateState(prev => ({
        ...prev,
        characters: previousState.characters,
        combatState: {
          ...prev.combatState,
          combatants: previousState.combatState.combatants,
        },
      }));
      
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
    handleShortRest,
    handleDeletePlayer,
    handleUpdate,
    levelUpCharacter,
    setLevelUpCharacter,
    handleLevelUpConfirm,
  };
}
