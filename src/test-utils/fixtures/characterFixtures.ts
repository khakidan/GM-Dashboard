import { Character } from '../../types';

export const mockCharacter: Character = {
  id: 'char-1',
  playerName: 'Test Player',
  characterName: 'Test Character',
  ac: 15,
  maxHp: 40,
  tempHp: 0,
  currentHp: 40,
  conditions: '',
  passivePerception: 12,
  level: 5,
  statusId: 1,
  statusName: 'Active',
  notes: '',
  isActive: true,
  resistances: '',
  immunities: '',
  vulnerabilities: '',
  tempHpMax: 0,
  tempAc: 0,
  deathSavesFails: 0,
  deathSavesSuccesses: 0,
  class: 'Fighter',
  hitDiceConfig: '5d10',
  hitDiceUsed: '{}',
  resourcePools: '[]',
  abilityScores: '{}',
  proficiencies: '{}',
  spellcastingAbility: '',
};

export function makeCharacter(
  overrides: Partial<Character> = {}
): Character {
  return { ...mockCharacter, ...overrides };
}

export const mockConcentratingCharacter =
  makeCharacter({
    id: 'char-conc',
    characterName: 'Concentrating Caster',
    conditions: 'concentrating',
  });
