import { useCallback } from 'react';
import { useAppState } from './useAppState';
import { CombatState } from '../types';
import { OVERLAY_CLEAR_BUFFER_MS } from '../lib/constants';

// Module-level map to track active timeouts per event key across all hook instances
const activeTimeouts = new Map<keyof CombatState, ReturnType<typeof setTimeout>>();

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
    // Clear any pending timeout for this event key to prevent race conditions from rapid fires
    const existingTimeout = activeTimeouts.get(eventKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    updateState(prev => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        [eventKey]: payload,
      }
    }));

    const timeoutId = setTimeout(() => {
      updateState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          [eventKey]: clearValue,
        }
      }));
      activeTimeouts.delete(eventKey);
    }, durationMs + OVERLAY_CLEAR_BUFFER_MS);

    activeTimeouts.set(eventKey, timeoutId);
  }, [eventKey, durationMs, clearValue, updateState]);

  const clear = useCallback(() => {
    // Clear any pending timeout when manually clearing the event
    const existingTimeout = activeTimeouts.get(eventKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      activeTimeouts.delete(eventKey);
    }

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
