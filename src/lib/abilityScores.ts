import { SpellcastingAbility, parseSpellcastingAbility } from './spellcasting';

export const abilitiesInOrder = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const;

export type AbilityName = typeof abilitiesInOrder[number];

export type SkillName =
  'Athletics' |
  'Acrobatics' | 'Sleight of Hand' | 
    'Stealth' |
  'Arcana' | 'History' | 
    'Investigation' | 'Nature' | 
    'Religion' |
  'Animal Handling' | 'Insight' | 
    'Medicine' | 'Perception' | 
    'Survival' |
  'Deception' | 'Intimidation' | 
    'Performance' | 'Persuasion';

export type SkillProficiency = 'none' | 'proficient' | 'expertise';

export interface AbilityScores {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
}

export interface Proficiencies {
  proficiencyBonus: number;
  jackOfAllTrades: boolean;
  savingThrows: AbilityName[];
  skills: Partial<Record<SkillName, 'proficient' | 'expertise'>>;
  passiveBonuses: {
    perception: number;
    insight: number;
    investigation: number;
  };
  spellcastingAbility?: SpellcastingAbility;
  toughFeat?: boolean;
}

// Maps each skill to its governing ability score
export const SKILL_ABILITY_MAP: Record<SkillName, AbilityName> = {
  'Athletics': 'STR',
  'Acrobatics': 'DEX',
  'Sleight of Hand': 'DEX',
  'Stealth': 'DEX',
  'Arcana': 'INT',
  'History': 'INT',
  'Investigation': 'INT',
  'Nature': 'INT',
  'Religion': 'INT',
  'Animal Handling': 'WIS',
  'Insight': 'WIS',
  'Medicine': 'WIS',
  'Perception': 'WIS',
  'Survival': 'WIS',
  'Deception': 'CHA',
  'Intimidation': 'CHA',
  'Performance': 'CHA',
  'Persuasion': 'CHA',
};

// All 18 skills in display order
export const ALL_SKILLS: SkillName[] = Object.keys(SKILL_ABILITY_MAP) as SkillName[];

export const DEFAULT_ABILITY_SCORES: AbilityScores = {
  STR: 10, DEX: 10, CON: 10,
  INT: 10, WIS: 10, CHA: 10,
};

export const DEFAULT_PROFICIENCIES: Proficiencies = {
  proficiencyBonus: 2,
  jackOfAllTrades: false,
  savingThrows: [],
  skills: {},
  passiveBonuses: {
    perception: 0,
    insight: 0,
    investigation: 0,
  },
  toughFeat: false,
};

// floor((score - 10) / 2)
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

// Standard 5e table:
// Levels 1-4: +2, 5-8: +3, 9-12: +4,
// 13-16: +5, 17-20: +6
// Clamps: below 1 → +2, above 20 → +6
export function proficiencyBonusFromLevel(level: number): number {
  const lvl = Math.max(1, Math.min(20, level));
  if (lvl <= 4) return 2;
  if (lvl <= 8) return 3;
  if (lvl <= 12) return 4;
  if (lvl <= 16) return 5;
  return 6;
}

/**
 * Returns the proficiency bonus for an NPC
 * based on its Challenge Rating per D&D 5e rules.
 * CR is stored as a string (e.g. "1/4", "5", "20").
 * Returns 2 for unknown or unparseable values.
 */
export function proficiencyBonusFromCR(
  cr: string | undefined
): number {
  if (!cr) return 2;
  // Handle fractional CRs
  if (cr === '1/8' || cr === '1/4' ||
      cr === '1/2') return 2;
  const num = parseFloat(cr);
  if (isNaN(num)) return 2;
  if (num <= 4)  return 2;
  if (num <= 8)  return 3;
  if (num <= 12) return 4;
  if (num <= 16) return 5;
  if (num <= 20) return 6;
  if (num <= 24) return 7;
  if (num <= 28) return 8;
  return 9; // CR 29-30
}

// modifier + profBonus if proficient
// modifier only if not proficient
export function getSavingThrowBonus(
  score: number,
  isProficient: boolean,
  proficiencyBonus: number
): number {
  const mod = calculateModifier(score);
  return isProficient ? mod + proficiencyBonus : mod;
}

// modifier + (2x profBonus for expertise,
//   profBonus for proficient,
//   floor(profBonus/2) for jackOfAllTrades,
//   0 for none)
// jackOfAllTrades only applies when proficiency is 'none'
export function getSkillBonus(
  score: number,
  proficiency: SkillProficiency,
  proficiencyBonus: number,
  jackOfAllTrades: boolean
): number {
  const mod = calculateModifier(score);
  if (proficiency === 'expertise') {
    return mod + (proficiencyBonus * 2);
  }
  if (proficiency === 'proficient') {
    return mod + proficiencyBonus;
  }
  if (proficiency === 'none' && jackOfAllTrades) {
    return mod + Math.floor(proficiencyBonus / 2);
  }
  return mod;
}

// 10 + getSkillBonus for the relevant passive skill + passiveBonuses offset
// perception → WIS + Perception prof
// insight → WIS + Insight prof
// investigation → INT + Investigation prof
export function getPassiveScore(
  abilityScores: AbilityScores,
  proficiencies: Proficiencies,
  passive: 'perception' | 'insight' | 'investigation'
): number {
  if (passive === 'perception') {
    const prof = proficiencies.skills['Perception'] ?? 'none';
    const skillBonus = getSkillBonus(
      abilityScores.WIS,
      prof,
      proficiencies.proficiencyBonus,
      proficiencies.jackOfAllTrades
    );
    return 10 + skillBonus + (proficiencies.passiveBonuses?.perception ?? 0);
  }
  if (passive === 'insight') {
    const prof = proficiencies.skills['Insight'] ?? 'none';
    const skillBonus = getSkillBonus(
      abilityScores.WIS,
      prof,
      proficiencies.proficiencyBonus,
      proficiencies.jackOfAllTrades
    );
    return 10 + skillBonus + (proficiencies.passiveBonuses?.insight ?? 0);
  }
  // investigation
  const prof = proficiencies.skills['Investigation'] ?? 'none';
  const skillBonus = getSkillBonus(
    abilityScores.INT,
    prof,
    proficiencies.proficiencyBonus,
    proficiencies.jackOfAllTrades
  );
  return 10 + skillBonus + (proficiencies.passiveBonuses?.investigation ?? 0);
}

// Parses JSON string → AbilityScores
// Returns DEFAULT_ABILITY_SCORES on empty string or invalid JSON
export function parseAbilityScores(json: string): AbilityScores {
  if (!json || typeof json !== 'string' || json.trim() === '') {
    return { ...DEFAULT_ABILITY_SCORES };
  }
  try {
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === 'object') {
      return {
        STR: typeof parsed.STR === 'number' ? parsed.STR : DEFAULT_ABILITY_SCORES.STR,
        DEX: typeof parsed.DEX === 'number' ? parsed.DEX : DEFAULT_ABILITY_SCORES.DEX,
        CON: typeof parsed.CON === 'number' ? parsed.CON : DEFAULT_ABILITY_SCORES.CON,
        INT: typeof parsed.INT === 'number' ? parsed.INT : DEFAULT_ABILITY_SCORES.INT,
        WIS: typeof parsed.WIS === 'number' ? parsed.WIS : DEFAULT_ABILITY_SCORES.WIS,
        CHA: typeof parsed.CHA === 'number' ? parsed.CHA : DEFAULT_ABILITY_SCORES.CHA,
      };
    }
    return { ...DEFAULT_ABILITY_SCORES };
  } catch {
    return { ...DEFAULT_ABILITY_SCORES };
  }
}

// Parses JSON string → Proficiencies
// Returns DEFAULT_PROFICIENCIES on empty string or invalid JSON
export function parseProficiencies(json: string): Proficiencies {
  if (!json || typeof json !== 'string' || json.trim() === '') {
    return {
      proficiencyBonus: DEFAULT_PROFICIENCIES.proficiencyBonus,
      jackOfAllTrades: DEFAULT_PROFICIENCIES.jackOfAllTrades,
      savingThrows: [...DEFAULT_PROFICIENCIES.savingThrows],
      skills: { ...DEFAULT_PROFICIENCIES.skills },
      passiveBonuses: { ...DEFAULT_PROFICIENCIES.passiveBonuses },
      toughFeat: false,
    };
  }
  try {
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === 'object') {
      const proficiencyBonus = typeof parsed.proficiencyBonus === 'number' 
        ? parsed.proficiencyBonus 
        : DEFAULT_PROFICIENCIES.proficiencyBonus;
      const jackOfAllTrades = typeof parsed.jackOfAllTrades === 'boolean' 
        ? parsed.jackOfAllTrades 
        : DEFAULT_PROFICIENCIES.jackOfAllTrades;
      const savingThrows = Array.isArray(parsed.savingThrows) 
        ? parsed.savingThrows.filter((s: any) => abilitiesInOrder.includes(s))
        : DEFAULT_PROFICIENCIES.savingThrows;
      const skills = (parsed.skills && typeof parsed.skills === 'object') 
        ? parsed.skills 
        : DEFAULT_PROFICIENCIES.skills;
      
      const passiveBonuses = {
        perception: typeof parsed.passiveBonuses?.perception === 'number' 
          ? parsed.passiveBonuses.perception 
          : DEFAULT_PROFICIENCIES.passiveBonuses.perception,
        insight: typeof parsed.passiveBonuses?.insight === 'number' 
          ? parsed.passiveBonuses.insight 
          : DEFAULT_PROFICIENCIES.passiveBonuses.insight,
        investigation: typeof parsed.passiveBonuses?.investigation === 'number' 
          ? parsed.passiveBonuses.investigation 
          : DEFAULT_PROFICIENCIES.passiveBonuses.investigation,
      };

      const spellcastingAbility = parsed.hasOwnProperty('spellcastingAbility')
        ? parseSpellcastingAbility(parsed.spellcastingAbility)
        : undefined;

      const toughFeat = typeof parsed.toughFeat === 'boolean' ? parsed.toughFeat : false;

      return {
        proficiencyBonus,
        jackOfAllTrades,
        savingThrows,
        skills,
        passiveBonuses,
        spellcastingAbility,
        toughFeat,
      };
    }
    return {
      proficiencyBonus: DEFAULT_PROFICIENCIES.proficiencyBonus,
      jackOfAllTrades: DEFAULT_PROFICIENCIES.jackOfAllTrades,
      savingThrows: [...DEFAULT_PROFICIENCIES.savingThrows],
      skills: { ...DEFAULT_PROFICIENCIES.skills },
      passiveBonuses: { ...DEFAULT_PROFICIENCIES.passiveBonuses },
      toughFeat: false,
    };
  } catch {
    return {
      proficiencyBonus: DEFAULT_PROFICIENCIES.proficiencyBonus,
      jackOfAllTrades: DEFAULT_PROFICIENCIES.jackOfAllTrades,
      savingThrows: [...DEFAULT_PROFICIENCIES.savingThrows],
      skills: { ...DEFAULT_PROFICIENCIES.skills },
      passiveBonuses: { ...DEFAULT_PROFICIENCIES.passiveBonuses },
      toughFeat: false,
    };
  }
}

export function serializeAbilityScores(scores: AbilityScores): string {
  return JSON.stringify(scores);
}

export function serializeProficiencies(proficiencies: Proficiencies): string {
  return JSON.stringify(proficiencies);
}
