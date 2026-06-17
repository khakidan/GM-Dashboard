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
  class: string;
  tempHpMax?: number;
  tempAc?: number;
  deathSavesFails?: number;
  deathSavesSuccesses?: number;
  hitDiceConfig: string;
  hitDiceUsed: string;
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
  legendaryActions?: number;
  legendaryResistances?: number;
  rechargeAbilities?: Array<{
    name: string;
    rechargeOn: number;
  }>;
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
  currentRound?: number;
  activeTurnId?: string;
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
  tempHpMax?: number;
  tempAcModifier?: number;
  deathSavesFails?: number;
  deathSavesSuccesses?: number;
  statusId?: number;
  isStable?: boolean;
  reactionUsed?: boolean;
  rechargeAbilities?: Array<{
    name: string;
    rechargeOn: number;  // minimum d6 result to recharge (5 = "recharge 5-6", 6 = "recharge 6")
    isCharged: boolean;  // current state
  }>;
  legendaryActions?: {
    max: number;         // typically 3
    remaining: number;
  };
  legendaryResistances?: {
    max: number;         // typically 3
    remaining: number;
  };
}

export interface CombatState {
  activeEncounterId: string | null;
  combatants: Combatant[];
  activeTurnId: string | null;
  round: number;
  concentrationLinks: Record<string, string[]>;
  deathEvent?: { characterName: string } | null;
  damageEvent?: {
    combatantNames: string[];
    damageAmount: number;
    damageType?: string;
  } | null;
  healEvent?: {
    combatantNames: string[];
    healAmount: number;
  } | null;
  unconsciousEvent?: {
    characterName: string;
  } | null;
  rageEvent?: {
    characterName: string;
  } | null;
  initiativeEvent?: boolean;
  selectedIds: string[];
  isSelectionMode: boolean;
  syncingIds: string[];
  expandedIds: string[];
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
  npcCurrentHp?: number;
  npcTempHp?: number;
  npcCurrentConditions?: string;
  npcTempAcMod?: number;
}

export interface DifficultyLevel {
  id: number;
  name: string;
}

export interface AppState {
  campaignName: string;
  hasInitialSynced: boolean;
  characters: Character[];
  encounters: Encounter[];
  npcs: NPC[];
  encounterCombatants: EncounterCombatant[];
  difficulties: Record<string, string>;
  statuses: Record<string, string>;
  combatState: CombatState;
  openDialog?: 'newPlayer' | 'newNpc' | 'newEncounter' | null;
}

export type DamageType =
  | 'acid' | 'bludgeoning' | 'bludgeoning (magical)'
  | 'cold' | 'fire' | 'force' | 'lightning' | 'necrotic'
  | 'piercing' | 'piercing (magical)' | 'poison'
  | 'psychic' | 'radiant' | 'slashing' | 'slashing (magical)'
  | 'thunder';

