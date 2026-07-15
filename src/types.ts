import { DAMAGE_TYPE_OPTIONS } from './lib/irvOptions';

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
  resourcePools?: string;
  abilityScores: string;  // JSON
  proficiencies: string;  // JSON
  spellcastingAbility?: string;
}

export interface NpcTrait {
  name: string;
  description: string;
  _key?: string;
}

export interface NpcAction {
  name: string;
  description: string;
  attackBonus?: number;
  damage?: string;
  saveDC?: number;
  saveType?: string;
  range?: string;
  recharge?: string;
  _key?: string;
}

export interface NpcReaction {
  name: string;
  description: string;
  _key?: string;
}

export interface NpcLegendaryAction {
  name: string;
  description: string;
  cost?: number;
  attackBonus?: number;
  damage?: string;
  saveDC?: number;
  saveType?: string;
  _key?: string;
}

export interface NPC {
  id: string; // NPC_ID
  name: string; // NPC_Name
  ac: number;
  maxHp: number;
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
  abilityScores: string;  // JSON
  proficiencies: string;  // JSON
  speed: string;
  senses: string;
  languages: string;
  challengeRating: string;   // text: "1/4", "16", etc.
  traits: string;            // JSON: NpcTrait[]
  actions: string;           // JSON: NpcAction[]
  reactions: string;         // JSON: NpcReaction[]
  legendaryActionsList: string; // JSON: NpcLegendaryAction[]
  spellcastingAbility?: string;
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
  npcId?: string; // Link back to NPC template if applicable
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
  class?: string;
  level?: number;
  abilityScores?: string;
  proficiencies?: string;
  speed?: string;
  senses?: string;
  languages?: string;
  challengeRating?: string;
  traits?: string;
  actions?: string;
  reactions?: string;
  legendaryActionsList?: string;
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
  npcLegendaryActionsRemaining?: number;
  npcLegendaryResistancesRemaining?: number;
  npcRechargeState?: string;
}

export interface Condition {
  name: string;
  description: string;
  source: string;
}

export interface Spell {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  materials: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  classes: string;
  description: string;
  higherLevel: string;
  source: string;
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
  conditions: Condition[];
  spells: Spell[];
  difficulties: Record<string, string>;
  statuses: Record<string, string>;
  combatState: CombatState;
  openDialog?: 'newPlayer' | 'newNpc' | 'newEncounter' | 'shortRest' | 'longRest' | null;
}

export type DamageType = typeof DAMAGE_TYPE_OPTIONS[number];

export interface PoolEdit {
  name: string;
  max: number;
  reset: 'short' | 'long' | 'none';
  isNew: boolean;
  include: boolean;
  isAutoDerived: boolean;
}

