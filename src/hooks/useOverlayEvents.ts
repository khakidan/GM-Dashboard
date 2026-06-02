import { useOverlayEvent } from './useOverlayEvent';
import { OVERLAY_DURATIONS } from '../lib/constants';

export function useDeathEvent() {
  return useOverlayEvent<{ characterName: string }, null>(
    'deathEvent',
    OVERLAY_DURATIONS.death,
    null
  );
}

export function useDamageEvent() {
  return useOverlayEvent<{ combatantName: string; damageAmount: number }, null>(
    'damageEvent',
    OVERLAY_DURATIONS.damage,
    null
  );
}

export function useHealEvent() {
  return useOverlayEvent<{ combatantName: string; healAmount: number }, null>(
    'healEvent',
    OVERLAY_DURATIONS.heal,
    null
  );
}

export function useUnconsciousEvent() {
  return useOverlayEvent<{ characterName: string }, null>(
    'unconsciousEvent',
    OVERLAY_DURATIONS.unconscious,
    null
  );
}

export function useRageEvent() {
  return useOverlayEvent<{ characterName: string }, null>(
    'rageEvent',
    OVERLAY_DURATIONS.rage,
    null
  );
}

export function useInitiativeEvent() {
  return useOverlayEvent<true, false>(
    'initiativeEvent',
    OVERLAY_DURATIONS.initiative,
    false
  );
}
