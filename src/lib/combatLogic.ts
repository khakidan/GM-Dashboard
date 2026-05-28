// src/lib/combatLogic.ts

import { Combatant, DamageType } from '../types';

// ─── Health change ────────────────────────────────────────────────────────────

export interface HealthChangeResult {
  newCurrentHp: number;
  newTempHp: number;
}

/**
 * Calculate the result of applying damage or healing to a combatant.
 *
 * Damage resolution order (D&D 5e rules):
 *   1. Damage absorbs temp HP first
 *   2. Remaining damage reduces current HP
 *   3. Current HP cannot go below 0
 *
 * Healing:
 *   - Increases current HP up to maxHp
 *   - Does NOT restore temp HP
 */
export function applyHealthChange(
  currentHp: number,
  tempHp: number,
  maxHp: number,
  amount: number,
  isDamage: boolean
): HealthChangeResult {
  const magnitude = Math.abs(amount);

  if (isDamage) {
    let remaining = magnitude;
    let newTemp = tempHp;

    if (newTemp > 0) {
      if (remaining >= newTemp) {
        remaining -= newTemp;
        newTemp = 0;
      } else {
        newTemp -= remaining;
        remaining = 0;
      }
    }

    const newCurrent = Math.max(0, currentHp - remaining);
    return { newCurrentHp: newCurrent, newTempHp: newTemp };
  } else {
    const newCurrent = Math.min(maxHp, currentHp + magnitude);
    return { newCurrentHp: newCurrent, newTempHp: tempHp };
  }
}

// ─── Turn order ───────────────────────────────────────────────────────────────

/**
 * Return the index of the next combatant in initiative order.
 * Wraps around to 0 when the last combatant's turn ends.
 * Returns 0 when no active turn exists (first call).
 */
export function nextTurnIndex(
  combatants: Pick<Combatant, 'id'>[],
  activeTurnId: string | null
): number {
  if (combatants.length === 0) return 0;
  const currentIndex = combatants.findIndex(c => c.id === activeTurnId);
  if (currentIndex === -1) return 0;
  return (currentIndex + 1) % combatants.length;
}

/**
 * Returns true if advancing from currentIndex to nextIndex
 * constitutes completing a full round (i.e. wrapping back to index 0).
 */
export function isNewRound(currentIndex: number, nextIndex: number): boolean {
  return currentIndex !== -1 && nextIndex === 0;
}

// ─── Health status label (used in PlayerView) ─────────────────────────────────

export interface HealthStatus {
  label: 'Full' | 'Defeated' | 'Healthy' | 'Injured' | 'Bloodied';
  /** Tailwind color class */
  color: string;
}

export function getHealthStatus(current: number, max: number): HealthStatus {
  if (current >= max) return { label: 'Full', color: 'text-emerald-600' };
  if (current <= 0) return { label: 'Defeated', color: 'text-red-700 opacity-60' };
  const ratio = current / max;
  if (ratio >= 0.9) return { label: 'Healthy',  color: 'text-green-600' };
  if (ratio >  0.5) return { label: 'Injured',  color: 'text-yellow-600' };
  return               { label: 'Bloodied', color: 'text-red-600' };
}

// ─── Initiative roll helpers ──────────────────────────────────────────────────

/** Roll 1d20. Accepts an injectable rng for deterministic testing. */
export function rollD20(rng: () => number = Math.random): number {
  return Math.floor(rng() * 20) + 1;
}

/** Roll initiative for every NPC in the list and re-sort descending. */
export function rollNpcInitiatives(
  combatants: Combatant[],
  rng?: () => number
): Combatant[] {
  return [...combatants]
    .map(c => c.type === 'npc' ? { ...c, initiative: rollD20(rng) } : c)
    .sort((a, b) => b.initiative - a.initiative);
}

// ─── IRV (Immunity, Resistance, Vulnerability) Math ────────────────────────────

export function checkIrvMatch(damageType: string, irvString: string | null | undefined): boolean {
  if (!irvString || !damageType) return false;

  // Normalise: strip hyphens so 'non-magical' and 'nonmagical' are treated
  // identically. This gives backward compat for any older sheet data.
  const norm = (s: string) => s.replace(/-/g, '').toLowerCase().trim();

  const target  = norm(damageType);
  const rawNorm = norm(irvString);
  const parts   = irvString.split(',').map(s => norm(s));

  for (const part of parts) {
    // Exact match after normalisation
    if (part === target) return true;

    // Part contains the full target string
    if (part.includes(target)) return true;

    // Handle compound entries where 'nonmagical' qualifies a group, e.g.
    // "bludgeoning, piercing, slashing (nonmagical)" — after splitting we get
    // separate 'bludgeoning' and 'slashing (nonmagical)' parts, so we check
    // whether the base type appears in this part AND nonmagical appears
    // anywhere in the full IRV string.
    if (target.includes('nonmagical')) {
      const baseType = target.replace(/\(nonmagical\)/g, '').trim();
      if (part.includes(baseType) && rawNorm.includes('nonmagical')) {
        return true;
      }
    }
  }

  return false;
}

export function computeDamageWithIrv(
  baseDamage: number,
  damageType: DamageType | null,
  resistances: string | undefined,
  immunities: string | undefined,
  vulnerabilities: string | undefined
): { finalDamage: number; modifier: 'immune' | 'resistant' | 'vulnerable' | 'normal' } {
  if (damageType === null) {
    return { finalDamage: baseDamage, modifier: 'normal' };
  }
  
  if (checkIrvMatch(damageType, immunities)) {
    return { finalDamage: 0, modifier: 'immune' };
  }
  
  if (checkIrvMatch(damageType, resistances)) {
    return { finalDamage: Math.floor(baseDamage / 2), modifier: 'resistant' };
  }
  
  if (checkIrvMatch(damageType, vulnerabilities)) {
    return { finalDamage: baseDamage * 2, modifier: 'vulnerable' };
  }
  
  return { finalDamage: baseDamage, modifier: 'normal' };
}

// ─── Condition Expiry Tracking ────────────────────────────────────────────────

export function getExpiredConditions(
  combatants: Combatant[],
  currentRound: number
): Array<{ combatantId: string; combatantName: string; conditionName: string }> {
  const expired: Array<{ combatantId: string; combatantName: string; conditionName: string }> = [];
  for (const c of combatants) {
    if (!c.conditionTimers) continue;
    const condList = (c.conditions || '').split(',').map(s => s.toLowerCase().trim());
    
    for (const [conditionName, expiresAtRound] of Object.entries(c.conditionTimers)) {
      if (expiresAtRound <= currentRound) {
        const condNameLower = conditionName.toLowerCase().trim();
        if (condList.includes(condNameLower) || (c.conditions || '').toLowerCase().includes(condNameLower)) {
          expired.push({
            combatantId: c.id,
            combatantName: c.name,
            conditionName,
          });
        }
      }
    }
  }
  return expired;
}

export function computeConcentrationDC(damage: number): number {
  return Math.max(10, Math.floor(damage / 2));
}
