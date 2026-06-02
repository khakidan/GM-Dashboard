import { useCallback } from 'react';
import { useAppState } from './useAppState';
import { CombatState } from '../types';
import { OVERLAY_CLEAR_BUFFER_MS } from '../lib/constants';

/**
 * Generic hook for overlay events that fire, hold for a duration, then clear.
 *
 * TPayload — the type of the event value when active (e.g. { characterName: string })
 * TClear — the type of the cleared value (null for object events, false for boolean)
 */
export function useOverlayEvent<
  TPayload,
  TClear extends null | false = null
>(
  eventKey: keyof CombatState,
  durationMs: number,
  clearValue: TClear
) {
  const { updateState } = useAppState();

  const fire = useCallback((payload: TPayload) => {
    updateState(prev => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        [eventKey]: payload,
      }
    }));

    setTimeout(() => {
      updateState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          [eventKey]: clearValue,
        }
      }));
    }, durationMs + OVERLAY_CLEAR_BUFFER_MS);
  }, [eventKey, durationMs, clearValue, updateState]);

  const clear = useCallback(() => {
    updateState(prev => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        [eventKey]: clearValue,
      }
    }));
  }, [eventKey, clearValue, updateState]);

  return { fire, clear };
}
