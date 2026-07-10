export interface PartySnapshot {
  id: string;
  name: string;
  type: 'pc' | 'npc';
  startingHp: number;
  maxHp: number;
  level?: number; // PCs only
  cr?: string; // NPCs only
}

export interface InitiativeEntry {
  combatantId: string;
  name: string;
  initiative: number;
  type: 'pc' | 'npc';
}

export type CombatEventType =
  | 'combat-start'
  | 'combat-end'
  | 'round-start'
  | 'damage'
  | 'healing'
  | 'condition-applied'
  | 'condition-removed'
  | 'combatant-defeated'
  | 'manual-adjustment'
  | 'resource-changed'
  | 'death-save';

export type ActionType =
  | 'attack'
  | 'opportunity-attack'
  | 'lair-action'
  | 'legendary-action'
  | 'reaction'
  | 'spell'
  | 'environmental'
  | 'other';

export interface CombatEvent {
  id: string;
  round: number;
  type: CombatEventType;
  actorId: string | null;
  actorName: string | null;
  targetId: string | null;
  targetName: string | null;
  actionType?: ActionType;
  value?: number;
  damageType?: string;
  condition?: string;
  hpBefore?: number;
  hpAfter?: number;
  resourceName?: string;
  resourceBefore?: number;
  resourceAfter?: number;
  resourceMax?: number;
  isManualAdjustment: boolean;
  timestamp: string;
}

export interface ActiveCombatLog {
  encounterId: string;
  encounterName: string;
  location: string;
  startedAt: string;
  currentRound: number;
  partySnapshot: PartySnapshot[];
  initiativeOrder: InitiativeEntry[];
  events: CombatEvent[];
}

export interface EncounterLog {
  id: string;
  encounterId: string;
  encounterName: string;
  location: string;
  date: string;
  durationRounds: number;
  outcome: 'Victory' | 'Defeat' | 'Abandoned' | 'Incomplete';
  partySnapshot: PartySnapshot[];
  events: CombatEvent[];
  transcript: string;
}

/**
 * Returns a unique string combining Date.now() and Math.random() without an external library.
 */
export function generateCombatEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
}

export const ACTION_TYPE_LABELS: Record<string, string> = {
  'opportunity-attack': 'Opportunity Attack',
  'lair-action': 'Lair Action',
  'legendary-action': 'Legendary Action',
  'reaction': 'Reaction',
  'spell': 'Spell',
  'environmental': 'Environment',
  'other': 'Other',
};

function formatEventDescription(evt: CombatEvent): string {
  let actor = evt.actorName || 'Unknown';
  if (actor === 'environment') actor = 'Environment';
  if (actor === 'lair-action') actor = 'Lair Action';
  if (actor === 'unknown') actor = 'Unknown';
  
  const target = evt.targetName || 'Unknown';
  const hpBefore = evt.hpBefore ?? 0;
  const hpAfter = evt.hpAfter ?? 0;
  const val = evt.value ?? 0;

  switch (evt.type) {
    case 'damage': {
      const typeStr = evt.damageType ? `${evt.damageType} ` : '';
      
      if (evt.actionType && evt.actionType !== 'attack') {
        const label = ACTION_TYPE_LABELS[evt.actionType] || evt.actionType;
        
        if (evt.actionType === 'lair-action' || evt.actionType === 'environmental' || actor === 'Environment' || actor === 'Lair Action' || actor === 'Unknown') {
          const displayLabel = (actor === 'Environment' || actor === 'Lair Action' || actor === 'Unknown') ? actor : label;
          return `${displayLabel}: ${val} ${typeStr}damage to ${target} (${hpBefore} -> ${hpAfter} HP)`;
        }
        return `${actor} used ${label}: dealt ${val} ${typeStr}damage to ${target} (${hpBefore} -> ${hpAfter} HP)`;
      }

      if (actor === 'Environment' || actor === 'Lair Action' || actor === 'Unknown') {
        return `${actor}: ${val} ${typeStr}damage to ${target} (${hpBefore} -> ${hpAfter} HP)`;
      }
      return `${actor} dealt ${val} ${typeStr}damage to ${target} (${hpBefore} -> ${hpAfter} HP)`;
    }
    case 'healing':
      if (actor === 'Environment' || actor === 'Lair Action' || actor === 'Unknown') {
        return `${actor}: healed ${target} for ${val} HP (${hpBefore} -> ${hpAfter} HP)`;
      }
      return `${actor} healed ${target} for ${val} HP (${hpBefore} -> ${hpAfter} HP)`;
    case 'condition-applied':
      return `${actor} applied ${evt.condition || 'condition'} to ${target}`;
    case 'condition-removed':
      return `${evt.condition || 'condition'} removed from ${target}`;
    case 'combatant-defeated':
      return `${target} was defeated`;
    case 'manual-adjustment':
      return `${target}: HP adjusted ${hpBefore} -> ${hpAfter} (manual correction)`;
    case 'resource-changed': {
      const rName = evt.resourceName || 'Resource';
      const rBefore = evt.resourceBefore ?? 0;
      const rAfter = evt.resourceAfter ?? 0;
      if (rAfter > rBefore) {
        return `${target}: ${rName} ${rBefore} -> ${rAfter} (restored)`;
      }
      return `${target}: ${rName} ${rBefore} -> ${rAfter}`;
    }
    case 'death-save': {
      const outcome = evt.condition === 'success' ? 'Success' : 'Failure';
      return `${target} rolled a death saving throw: ${outcome} (${evt.resourceName}: ${evt.resourceBefore} -> ${evt.resourceAfter})`;
    }
    default:
      return '';
  }
}

/**
 * Produces a plain text transcript of the combat log.
 */
export function generateTranscript(
  log: ActiveCombatLog,
  outcome: 'Victory' | 'Defeat' | 'Abandoned' | 'Incomplete'
): string {
  const sections: string[] = [];

  // Section 1: Header
  sections.push(`ENCOUNTER: ${log.encounterName}
Date: ${formatDate(log.startedAt)}
Location: ${log.location}
Outcome: ${outcome}`);

  // Section 2: PARTY
  const partyLines = log.partySnapshot.map(p => {
    const typeStr = p.type === 'pc' ? `Level ${p.level ?? 1}` : `CR ${p.cr ?? '—'}`;
    return `- ${p.name} (${typeStr}, ${p.startingHp} HP)`;
  });
  sections.push(`PARTY\n${partyLines.join('\n')}`);

  // Section 3: INITIATIVE ORDER
  const sortedInitiative = log.initiativeOrder.slice().sort((a, b) => b.initiative - a.initiative);
  const initiativeLines = sortedInitiative.map((entry, idx) => {
    return `${idx + 1}. ${entry.name} — ${entry.initiative}`;
  });
  sections.push(`INITIATIVE ORDER\n${initiativeLines.join('\n')}`);

  // Section 4: ROUNDS
  const printableEvents = log.events.filter(
    evt => evt.type !== 'round-start' && evt.type !== 'combat-start' && evt.type !== 'combat-end'
  );

  const roundsWithEvents = Array.from(new Set(printableEvents.map(e => e.round))).sort((a, b) => a - b);
  const roundBlocks = roundsWithEvents.map(r => {
    const roundEvents = printableEvents.filter(e => e.round === r);
    const eventLines = roundEvents.map(evt => {
      const desc = formatEventDescription(evt);
      if (evt.actorName) {
        return `${evt.actorName}'s turn: ${desc}`;
      } else {
        return desc;
      }
    });
    return `ROUND ${r}\n${eventLines.join('\n')}`;
  });

  if (roundBlocks.length > 0) {
    sections.push(roundBlocks.join('\n\n'));
  }

  // Section 5: ENCOUNTER SUMMARY
  const summaryLines: string[] = [];
  summaryLines.push(`ENCOUNTER SUMMARY`);
  summaryLines.push(`Outcome: ${outcome}`);
  summaryLines.push(`Total rounds: ${log.currentRound}`);

  summaryLines.push('');
  summaryLines.push(`DAMAGE DEALT`);

  const damageEvents = log.events.filter(e => e.type === 'damage' && typeof e.value === 'number');
  if (damageEvents.length === 0) {
    summaryLines.push(`No damage dealt`);
  } else {
    // Group by actor
    const damageByActor = new Map<string, { total: number; byType: Map<string, { total: number; hits: number }> }>();

    for (const evt of damageEvents) {
      const actorName = evt.actorName || 'Unknown Source';
      if (!damageByActor.has(actorName)) {
        damageByActor.set(actorName, { total: 0, byType: new Map() });
      }

      const actorData = damageByActor.get(actorName)!;
      actorData.total += (evt.value || 0);

      const dmgType = evt.damageType || 'untyped';
      if (!actorData.byType.has(dmgType)) {
        actorData.byType.set(dmgType, { total: 0, hits: 0 });
      }
      const typeData = actorData.byType.get(dmgType)!;
      typeData.total += (evt.value || 0);
      typeData.hits += 1;
    }

    for (const [actor, data] of Array.from(damageByActor.entries())) {
      summaryLines.push(`${actor}: ${data.total} total`);
      for (const [dmgType, typeData] of Array.from(data.byType.entries())) {
        const hitWord = typeData.hits === 1 ? 'hit' : 'hits';
        summaryLines.push(`  ${dmgType}: ${typeData.total} (${typeData.hits} ${hitWord})`);
      }
    }
  }

  summaryLines.push('');
  summaryLines.push(`HEALING`);
  const healingEvents = log.events.filter(e => e.type === 'healing' && typeof e.value === 'number');
  if (healingEvents.length === 0) {
    summaryLines.push(`No healing`);
  } else {
    for (const evt of healingEvents) {
      const actorName = evt.actorName || 'Unknown Source';
      const targetName = evt.targetName || 'Unknown Target';
      summaryLines.push(`${actorName} healed ${targetName} for ${evt.value} HP (Round ${evt.round})`);
    }
  }

  summaryLines.push('');
  summaryLines.push(`CONDITIONS`);
  const conditionEvents = log.events.filter(e => e.type === 'condition-applied' && e.condition);
  if (conditionEvents.length === 0) {
    summaryLines.push(`No conditions applied`);
  } else {
    for (const evt of conditionEvents) {
      const actorName = evt.actorName || 'Unknown Source';
      const targetName = evt.targetName || 'Unknown Target';
      const condition = evt.condition;

      // Look for matching removal
      const removedEvt = log.events.find(
        e => e.type === 'condition-removed' &&
             e.targetId === evt.targetId &&
             e.condition === evt.condition &&
             e.round >= evt.round
      );

      let durationStr = `applied Round ${evt.round}`;
      if (removedEvt) {
        durationStr += `, removed Round ${removedEvt.round}`;
      }

      summaryLines.push(`${actorName} → ${targetName}: ${condition} (${durationStr})`);
    }
  }

  summaryLines.push('');
  summaryLines.push(`COMBATANTS DEFEATED`);
  const defeatedEvents = log.events.filter(e => e.type === 'combatant-defeated' && e.targetName);
  if (defeatedEvents.length === 0) {
    summaryLines.push(`None`);
  } else {
    for (const evt of defeatedEvents) {
      summaryLines.push(`${evt.targetName} (Round ${evt.round})`);
    }
  }

  sections.push(summaryLines.join('\n'));

  return sections.join('\n\n');
}
