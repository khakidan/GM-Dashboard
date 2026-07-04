import { useEffect } from 'react';
import {
  parseProficiencies,
  serializeProficiencies,
  proficiencyBonusFromCR,
} from '../lib/abilityScores';

interface UseNpcCrAutomationParams {
  challengeRating: string;
  proficiencies: string;
  onChange: (updatedProficiencies: string) => void;
}

export function useNpcCrAutomation({
  challengeRating,
  proficiencies,
  onChange,
}: UseNpcCrAutomationParams) {
  useEffect(() => {
    if (!challengeRating) return;
    try {
      const profBonus = proficiencyBonusFromCR(challengeRating);
      const parsed = parseProficiencies(proficiencies);
      if (parsed.proficiencyBonus === profBonus) return; // already correct, no update

      const updated = {
        ...parsed,
        proficiencyBonus: profBonus,
      };
      onChange(serializeProficiencies(updated));
    } catch {
      // silently ignore invalid CR strings
    }
  }, [challengeRating]);
}
