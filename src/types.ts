export type CombatantType = 'pc' | 'npc';

export interface Character {
  id: string;
  playerName: string;
  characterName: string;
  ac: number;
  maxHp: number;
  tempHp: number;
  currentHp: number;
  conditions: string;
  passivePerception: number;
  level: number;
  statusId: number;
  statusName: string;
  notes: string;
  isActive: boolean;
  sheetRowIndex?: number;
  resistances?: string;
  immunities?: string;
  vulnerabilities?: string;
}

export interface NPC {
  id: string; // NPC_ID
  name: string; // NPC_Name
  ac: number;
  maxHp: number;
  tempHp: number;
  currentHp: number;
  conditions: string;
  notes: string;
  resistances?: string;
  immunities?: string;
  vulnerabilities?: string;
}

export interface Encounter {
  id: string; // Encounter_ID
  name: string;
  location: string;
  difficultyId: number;
  difficultyName: string;
  npcDefinitions: string; // Number_of_NPCs
  status: 'planned' | 'active' | 'completed';
  sheetRowIndex?: number; // 0-indexed row number in the sheet
}

export interface Combatant {
  id: string;
  encounterCombatantId?: string; // Link to Encounter_Combatants_ID
  name: string;
  type: CombatantType;
  ac: number;
  maxHp: number;
  currentHp: number;
  tempHp?: number;
  conditions?: string;
  passivePerception: number;
  initiative: number;
  notes?: string;
  characterId?: string; // Link back to PC if applicable
  resistances?: string;
  immunities?: string;
  vulnerabilities?: string;
  conditionTimers?: Record<string, number>;
}

export interface CombatState {
  activeEncounterId: string | null;
  combatants: Combatant[];
  activeTurnId: string | null;
  round: number;
}

export interface EncounterCombatant {
  id: string; // Encounter_Combatants_ID
  encounterId: string;
  playerId: string | null;
  npcId: string | null;
  quantity: number;
  sheetRowIndex?: number;
  initiative?: number;
  conditionTimers?: Record<string, number>;
}

export interface DifficultyLevel {
  id: number;
  name: string;
}

export interface AppState {
  campaignName: string;
  characters: Character[];
  encounters: Encounter[];
  npcs: NPC[];
  encounterCombatants: EncounterCombatant[];
  difficulties: Record<string, string>;
  statuses: Record<string, string>;
  combatState: CombatState;
}

export type DamageType =
  | 'acid' | 'bludgeoning' | 'bludgeoning (nonmagical)'
  | 'cold' | 'fire' | 'force' | 'lightning' | 'necrotic'
  | 'piercing' | 'piercing (nonmagical)' | 'poison'
  | 'psychic' | 'radiant' | 'slashing' | 'slashing (nonmagical)'
  | 'thunder';

