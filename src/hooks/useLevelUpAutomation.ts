import { useEffect } from 'react';
import { Character } from '../types';
import { getResourcePoolSuggestions } from '../lib/resourcePoolScaling';
import { parseResourcePools } from '../lib/resourcePools';
import { parseClassString } from '../lib/hitDice';
import { PoolEdit } from '../components/PartyTab/LevelUpResourcePools';

export function useLevelUpAutomation(
  isOpen: boolean,
  newLevel: number,
  character: Character,
  hasManuallyToggledJack: boolean,
  setPoolEdits: React.Dispatch<React.SetStateAction<PoolEdit[]>>,
  setHasJackOfAllTrades: React.Dispatch<React.SetStateAction<boolean>>
) {
  useEffect(() => {
    if (isOpen) {
      const currentPools = parseResourcePools(character.resourcePools || '[]');
      const suggestions = getResourcePoolSuggestions(
        character.class ?? '',
        newLevel,
        currentPools
      );
      
      setPoolEdits(suggestions.map(s => ({
        name: s.name,
        max: s.suggestedMax,
        reset: s.reset,
        isNew: s.isNew,
        include: s.suggestedMax > 0,
        isAutoDerived: s.isAutoDerived
      })));
    } else {
      setPoolEdits([]);
    }
  }, [isOpen, newLevel, character.class, character.resourcePools]);

  useEffect(() => {
    if (isOpen && !hasManuallyToggledJack) {
      const isBard = parseClassString(character.class || '').some(c => 
        c.toLowerCase().trim() === 'bard'
      );
      if (character.level === 1 && newLevel === 2 && isBard) {
        setHasJackOfAllTrades(true);
      }
    }
  }, [isOpen, newLevel, character.level, character.class, hasManuallyToggledJack]);
}
