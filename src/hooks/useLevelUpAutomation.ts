import { useEffect } from 'react';
import { Character, PoolEdit } from '../types';
import { getResourcePoolSuggestions } from '../lib/resourcePoolScaling';
import { parseResourcePools } from '../lib/resourcePools';
import { parseClassString } from '../lib/hitDice';

export function useLevelUpAutomation(
  isOpen: boolean,
  newLevel: number,
  character: Character,
  inProgressClass: string,
  hasManuallyToggledJack: boolean,
  setPoolEdits: React.Dispatch<React.SetStateAction<PoolEdit[]>>,
  setHasJackOfAllTrades: React.Dispatch<React.SetStateAction<boolean>>
) {
  useEffect(() => {
    if (isOpen) {
      const currentPools = parseResourcePools(character.resourcePools || '[]');
      const suggestions = getResourcePoolSuggestions(
        inProgressClass,
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
  }, [isOpen, newLevel, inProgressClass, character.resourcePools]);

  useEffect(() => {
    if (isOpen && !hasManuallyToggledJack) {
      const isBardClass = (className: string) => className.toLowerCase().trim().startsWith('bard');

      const classesBefore = parseClassString(character.class || '');
      const bardIndexBefore = classesBefore.findIndex(c => isBardClass(c));
      let bardLevelBefore = 0;
      if (bardIndexBefore !== -1) {
        const perClass = Math.floor(character.level / classesBefore.length);
        const remainder = character.level % classesBefore.length;
        bardLevelBefore = perClass + (bardIndexBefore < remainder ? 1 : 0);
      }

      const classesAfter = parseClassString(inProgressClass);
      const bardIndexAfter = classesAfter.findIndex(c => isBardClass(c));
      let bardLevelAfter = 0;
      if (bardIndexAfter !== -1) {
        const perClass = Math.floor(newLevel / classesAfter.length);
        const remainder = newLevel % classesAfter.length;
        bardLevelAfter = perClass + (bardIndexAfter < remainder ? 1 : 0);
      }

      if (bardLevelBefore < 2 && bardLevelAfter >= 2) {
        setHasJackOfAllTrades(true);
      }
    }
  }, [isOpen, newLevel, character.level, character.class, inProgressClass, hasManuallyToggledJack]);
}
