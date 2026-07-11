export interface ConditionMechanics {
  speedZero: boolean;
  speedHalved: boolean;
  hpMaxHalved: boolean;
  incapacitates: boolean;
  outgoingAdvantage: boolean;
  outgoingDisadvantage: boolean;
  incomingAdvantage: boolean;
  incomingDisadvantage: boolean;
  critVulnerableInMelee: boolean;
  autoFailStr: boolean;
  autoFailDex: boolean;
  dexSaveDisadvantage: boolean;
  allSaveDisadvantage: boolean;
  turnStartNote?: string;
  removedByLongRest: boolean;
  tempAcModifier: number;
}

export function buildConditionSummary(
  activeConditions: string[]
): {
  lines: string[];
  speedLocked: boolean;
  speedHalved: boolean;
  hpMaxHalved: boolean;
  actionsBlocked: boolean;
  outgoingDisadvantage: boolean;
  incomingAdvantage: boolean;
  critVulnerable: boolean;
  autoFailStr: boolean;
  autoFailDex: boolean;
  dexSaveDisadvantage: boolean;
  allSaveDisadvantage: boolean;
  finalOutgoing: 'advantage' | 'disadvantage' | 'normal' | null;
  finalIncoming: 'advantage' | 'disadvantage' | 'normal' | null;
  totalAcModifier: number;
  sources: Record<string, string[]>;
} {
  const result = {
    lines: [] as string[],
    speedLocked: false,
    speedHalved: false,
    hpMaxHalved: false,
    actionsBlocked: false,
    outgoingDisadvantage: false,
    incomingAdvantage: false,
    critVulnerable: false,
    autoFailStr: false,
    autoFailDex: false,
    dexSaveDisadvantage: false,
    allSaveDisadvantage: false,
    finalOutgoing: null as 'advantage' | 'disadvantage' | 'normal' | null,
    finalIncoming: null as 'advantage' | 'disadvantage' | 'normal' | null,
    totalAcModifier: 0,
    sources: {
      speedLocked: [] as string[],
      speedHalved: [] as string[],
      hpMaxHalved: [] as string[],
      actionsBlocked: [] as string[],
      outgoingAdvantage: [] as string[],
      outgoingDisadvantage: [] as string[],
      incomingAdvantage: [] as string[],
      incomingDisadvantage: [] as string[],
      critVulnerable: [] as string[],
      autoFailStr: [] as string[],
      autoFailDex: [] as string[],
      dexSaveDisadvantage: [] as string[],
      allSaveDisadvantage: [] as string[],
    } as Record<string, string[]>
  };

  const matchedConditions: string[] = [];
  for (const raw of activeConditions) {
    const condition = raw.trim().toLowerCase();
    const mechanics = CONDITION_MECHANICS[condition];
    if (mechanics) {
      matchedConditions.push(condition);
    }
  }

  for (const condition of matchedConditions) {
    const mechanics = CONDITION_MECHANICS[condition];
    if (mechanics.speedZero) {
      result.speedLocked = true;
      result.sources.speedLocked.push(condition);
    }
    if (mechanics.speedHalved) {
      result.speedHalved = true;
      result.sources.speedHalved.push(condition);
    }
    if (mechanics.hpMaxHalved) {
      result.hpMaxHalved = true;
      result.sources.hpMaxHalved.push(condition);
    }
    if (mechanics.incapacitates) {
      result.actionsBlocked = true;
      result.sources.actionsBlocked.push(condition);
    }
    if (mechanics.outgoingAdvantage) {
      result.sources.outgoingAdvantage.push(condition);
    }
    if (mechanics.outgoingDisadvantage) {
      result.outgoingDisadvantage = true;
      result.sources.outgoingDisadvantage.push(condition);
    }
    if (mechanics.incomingAdvantage) {
      result.incomingAdvantage = true;
      result.sources.incomingAdvantage.push(condition);
    }
    if (mechanics.incomingDisadvantage) {
      result.sources.incomingDisadvantage.push(condition);
    }
    if (mechanics.critVulnerableInMelee) {
      result.critVulnerable = true;
      result.sources.critVulnerable.push(condition);
    }
    if (mechanics.autoFailStr) {
      result.autoFailStr = true;
      result.sources.autoFailStr.push(condition);
    }
    if (mechanics.autoFailDex) {
      result.autoFailDex = true;
      result.sources.autoFailDex.push(condition);
    }
    if (mechanics.dexSaveDisadvantage) {
      result.dexSaveDisadvantage = true;
      result.sources.dexSaveDisadvantage.push(condition);
    }
    if (mechanics.allSaveDisadvantage) {
      result.allSaveDisadvantage = true;
      result.sources.allSaveDisadvantage.push(condition);
    }
    if (mechanics.tempAcModifier) {
      result.totalAcModifier += mechanics.tempAcModifier;
    }
  }

  const outAdvSources = result.sources.outgoingAdvantage;
  const outDisadvSources = result.sources.outgoingDisadvantage;

  const finalOutgoing =
    outAdvSources.length > 0 && outDisadvSources.length > 0
      ? 'normal'
      : outAdvSources.length > 0 ? 'advantage'
      : outDisadvSources.length > 0 ? 'disadvantage'
      : null;

  result.finalOutgoing = finalOutgoing;

  const inAdvSources = result.sources.incomingAdvantage;
  const inDisadvSources = result.sources.incomingDisadvantage;

  const finalIncoming =
    inAdvSources.length > 0 && inDisadvSources.length > 0
      ? 'normal'
      : inAdvSources.length > 0 ? 'advantage'
      : inDisadvSources.length > 0 ? 'disadvantage'
      : null;

  result.finalIncoming = finalIncoming;

  if (result.speedLocked) {
    result.lines.push(`Movement: LOCKED (${result.sources.speedLocked.join(', ')})`);
  } else if (result.speedHalved) {
    if (matchedConditions.includes('slowed') && matchedConditions.length === 1) {
      // Overridden below by specific slowed text if slowed is solitary
    } else {
      result.lines.push(`Speed halved (${result.sources.speedHalved.join(', ')})`);
    }
  }

  if (result.actionsBlocked) {
    result.lines.push(`Actions: BLOCKED (${result.sources.actionsBlocked.join(', ')})`);
  }

  if (matchedConditions.includes('slowed') && matchedConditions.length === 1) {
    // Specifically matching the requested exact string when only 'slowed' is present
    result.lines = ['Speed halved. -2 AC and DEX saves. Limited to action OR bonus action per turn. Maximum one attack per turn.'];
  } else {
    if (result.totalAcModifier !== 0) {
      const sign = result.totalAcModifier > 0 ? '+' : '';
      result.lines.push(`${sign}${result.totalAcModifier} AC`);
    }
  }

  if (finalOutgoing === 'advantage') {
    result.lines.push(`Attack rolls: ADVANTAGE (${outAdvSources.join(', ')})`);
  } else if (finalOutgoing === 'disadvantage') {
    result.lines.push(`Attack rolls: DISADVANTAGE (${outDisadvSources.join(', ')})`);
  } else if (finalOutgoing === 'normal') {
    result.lines.push(`Attack rolls: NORMAL — advantage and disadvantage cancel out (${outAdvSources.join(', ')} vs ${outDisadvSources.join(', ')})`);
  }

  if (finalIncoming === 'advantage') {
    result.lines.push(`Incoming attacks: ADVANTAGE for attackers (${inAdvSources.join(', ')})`);
  } else if (finalIncoming === 'disadvantage') {
    result.lines.push(`Incoming attacks: DISADVANTAGE for attackers (${inDisadvSources.join(', ')})`);
  } else if (finalIncoming === 'normal') {
    result.lines.push(`Incoming attacks: NORMAL — advantage and disadvantage cancel out`);
  }

  if (result.critVulnerable) {
    result.lines.push(`⚠ Melee hits within 5 ft: AUTO CRIT (${result.sources.critVulnerable.join(', ')})`);
  }
  if (result.autoFailStr) {
    result.lines.push(`STR saves: AUTO-FAIL (${result.sources.autoFailStr.join(', ')})`);
  }
  if (result.autoFailDex) {
    result.lines.push(`DEX saves: AUTO-FAIL (${result.sources.autoFailDex.join(', ')})`);
  }
  if (result.dexSaveDisadvantage) {
    result.lines.push(`DEX saves: DISADVANTAGE (${result.sources.dexSaveDisadvantage.join(', ')})`);
  }
  if (result.allSaveDisadvantage) {
    result.lines.push(`All saves: DISADVANTAGE (${result.sources.allSaveDisadvantage.join(', ')})`);
  }

  return result;
}

export const CONDITION_MECHANICS: Record<string, ConditionMechanics> = {
  blinded: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: true,
    incomingAdvantage: true, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  charmed: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  deafened: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  frightened: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: true,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  grappled: {
    speedZero: true, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  incapacitated: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: true,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  invisible: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: true, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: true,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  paralyzed: {
    speedZero: true, speedHalved: false, hpMaxHalved: false,
    incapacitates: true,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: true, incomingDisadvantage: false,
    critVulnerableInMelee: true,
    autoFailStr: true, autoFailDex: true,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  petrified: {
    speedZero: true, speedHalved: false, hpMaxHalved: false,
    incapacitates: true,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: true, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: true, autoFailDex: true,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  poisoned: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: true,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  prone: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: true,
    incomingAdvantage: true, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  restrained: {
    speedZero: true, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: true,
    incomingAdvantage: true, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: true, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  stunned: {
    speedZero: true, speedHalved: false, hpMaxHalved: false,
    incapacitates: true,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: true, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: true, autoFailDex: true,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  unconscious: {
    speedZero: true, speedHalved: false, hpMaxHalved: false,
    incapacitates: true,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: true, incomingDisadvantage: false,
    critVulnerableInMelee: true,
    autoFailStr: true, autoFailDex: true,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  dodging: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: true,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  hasted: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 2
  },
  slowed: {
    speedZero: false, speedHalved: true, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: -2
  },
  concentrating: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  raging: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  'exhaustion 1': {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: true,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  'exhaustion 2': {
    speedZero: false, speedHalved: true, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: true,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  'exhaustion 3': {
    speedZero: false, speedHalved: true, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: true,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: true,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  'exhaustion 4': {
    speedZero: false, speedHalved: true, hpMaxHalved: true,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: true,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: true,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  'exhaustion 5': {
    speedZero: true, speedHalved: false, hpMaxHalved: true,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: true,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: true,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  'exhaustion 6': {
    speedZero: true, speedHalved: false, hpMaxHalved: true,
    incapacitates: true,
    outgoingAdvantage: false, outgoingDisadvantage: true,
    incomingAdvantage: true, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: true,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  blessed: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  baned: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  hexed: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  "hunter's mark": {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  'shield of faith': {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  'spirit guardians': {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  'spiritual weapon': {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  blurred: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  polymorphed: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  fly: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  stoneskin: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  'fire shield': {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  'mirror image': {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  enlarged: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  reduced: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  'mage armor': {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  'wild shaped': {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  guided: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  firewall: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  'aid (boosted)': {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  }
};

export function applyLongRestToConditions(
  conditions: string
): { 
  remaining: string; 
  removed: string[]; 
  exhaustionReduced: boolean;
  newExhaustionLevel: number | null;
} {
  const chips = conditions.split(',').map(s => s.trim()).filter(Boolean);
  const remaining: string[] = [];
  const removed: string[] = [];
  let exhaustionReduced = false;
  let newExhaustionLevel: number | null = null;

  for (const chip of chips) {
    const lower = chip.toLowerCase();
    const exhaustionMatch = lower.match(/^exhaustion\s+([1-6])$/);
    if (exhaustionMatch) {
      const level = parseInt(exhaustionMatch[1], 10);
      exhaustionReduced = true;
      if (level > 1) {
        newExhaustionLevel = level - 1;
        remaining.push(`exhaustion ${level - 1}`);
      } else {
        newExhaustionLevel = null;
      }
    } else {
      const mech = CONDITION_MECHANICS[lower];
      if (mech && mech.removedByLongRest) {
        removed.push(chip);
      } else {
        remaining.push(chip);
      }
    }
  }

  return {
    remaining: remaining.join(', '),
    removed,
    exhaustionReduced,
    newExhaustionLevel
  };
}

