import { Combatant } from '../../types';

export const mockCombatant: Combatant = {
  id: 'c1',
  name: 'Goblin',
  type: 'npc',
  ac: 15,
  maxHp: 30,
  currentHp: 30,
  tempHp: 5,
  initiative: 10,
  notes: '',
  passivePerception: 10,
  conditions: '',
  abilityScores: '{}',
  proficiencies: '{}',
  speed: '30 ft.',
  senses: 'darkvision 60 ft.',
  languages: 'Common',
  challengeRating: '1/4',
  traits: '[]',
  actions: '[]',
  reactions: '[]',
  legendaryActionsList: '[]',
  conditionTimers: {},
  tempAcModifier: 0,
  reactionUsed: false,
};

export function makeCombatant(overrides: Partial<Combatant & { playerId?: string; npcId?: string }> = {}): Combatant {
  return { ...mockCombatant, ...overrides } as Combatant;
}

export const mockPcCombatant: Combatant = makeCombatant({
  id: 'combat-pc-1',
  name: 'Test Character',
  type: 'pc',
  characterId: 'char-1',
  playerId: 'char-1',
});

export const mockNpcCombatant: Combatant = makeCombatant({
  id: 'combat-npc-1',
  name: 'Goblin',
  type: 'npc',
  npcId: 'npc-1',
});

export const mockConcentratingPcCombatant: Combatant = makeCombatant({
  id: 'combat-pc-conc',
  name: 'Concentrating Caster',
  type: 'pc',
  characterId: 'char-conc',
  playerId: 'char-conc',
  conditions: 'concentrating',
});
