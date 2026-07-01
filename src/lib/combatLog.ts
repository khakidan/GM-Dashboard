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
  | 'manual-adjustment';

export interface CombatEvent {
  id: string;
  round: number;
  type: CombatEventType;
  actorId: string | null;
  actorName: string | null;
  targetId: string | null;
  targetName: string | null;
  value?: number;
  damageType?: string;
  condition?: string;
  hpBefore?: number;
  hpAfter?: number;
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

function formatEventDescription(evt: CombatEvent): string {
  const actor = evt.actorName || 'Unknown';
  const target = evt.targetName || 'Unknown';
  const hpBefore = evt.hpBefore ?? 0;
  const hpAfter = evt.hpAfter ?? 0;
  const val = evt.value ?? 0;

  switch (evt.type) {
    case 'damage': {
      const typeStr = evt.damageType ? `${evt.damageType} ` : '';
      return `${actor} dealt ${val} ${typeStr}damage to ${target} (${hpBefore} -> ${hpAfter} HP)`;
    }
    case 'healing':
      return `${actor} healed ${target} for ${val} HP (${hpBefore} -> ${hpAfter} HP)`;
    case 'condition-applied':
      return `${actor} applied ${evt.condition || 'condition'} to ${target}`;
    case 'condition-removed':
      return `${evt.condition || 'condition'} removed from ${target}`;
    case 'combatant-defeated':
      return `${target} was defeated`;
    case 'manual-adjustment':
      return `${target}: HP adjusted ${hpBefore} -> ${hpAfter} (manual correction)`;
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
  const totalDamage = log.events
    .filter(e => e.type === 'damage' && typeof e.value === 'number')
    .reduce((sum, e) => sum + (e.value || 0), 0);

  const totalHealing = log.events
    .filter(e => e.type === 'healing' && typeof e.value === 'number')
    .reduce((sum, e) => sum + (e.value || 0), 0);

  const uniqueConditions = Array.from(
    new Set(
      log.events
        .filter(e => e.type === 'condition-applied' && e.condition)
        .map(e => e.condition as string)
    )
  );
  const conditionsAppliedStr = uniqueConditions.length > 0 ? uniqueConditions.join(', ') : 'None';

  const uniqueDefeated = Array.from(
    new Set(
      log.events
        .filter(e => e.type === 'combatant-defeated' && e.targetName)
        .map(e => e.targetName as string)
    )
  );
  const defeatedStr = uniqueDefeated.length > 0 ? uniqueDefeated.join(', ') : 'None';

  sections.push(`ENCOUNTER SUMMARY
Total rounds: ${log.currentRound}
Total damage dealt: ${totalDamage}
Total healing: ${totalHealing}
Conditions applied: ${conditionsAppliedStr}
Combatants defeated: ${defeatedStr}`);

  return sections.join('\n\n');
}
