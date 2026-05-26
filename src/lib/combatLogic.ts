// src/lib/combatLogic.ts

import { Combatant } from '../types';

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
  label: 'Defeated' | 'Healthy' | 'Injured' | 'Bloodied';
  /** Tailwind color class */
  color: string;
}

export function getHealthStatus(current: number, max: number): HealthStatus {
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