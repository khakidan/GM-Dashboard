// src/hooks/useAppState.ts

import { useCallback, useSyncExternalStore } from 'react';
import { AppState, Character, Encounter, CombatState, NPC, EncounterCombatant } from '../types';
import { retryPersistedWrites } from '../services/writeQueue';

const STORAGE_KEY = 'dnd-app-state';

export const initialCharacters: Character[] = [];
export const initialEncounters: Encounter[] = [];
export const initialNPCs: NPC[] = [];
export const initialEncounterCombatants: EncounterCombatant[] = [];

const defaultCombatState: CombatState = {
  activeEncounterId: null,
  combatants: [],
  activeTurnId: null,
  round: 1,
  deathEvent: null,
  damageEvent: null,
  healEvent: null,
  unconsciousEvent: null,
  rageEvent: null,
  initiativeEvent: false,
};

const defaultAppState: AppState = {
  campaignName: "GM Encounter Dashboard",
  hasInitialSynced: false,
  characters: initialCharacters,
  encounters: initialEncounters,
  npcs: initialNPCs,
  encounterCombatants: initialEncounterCombatants,
  difficulties: {},
  statuses: {},
  combatState: defaultCombatState,
  openDialog: null,
};

// Global Store Setup
type Listener = () => void;
const listeners = new Set<Listener>();

let globalState = defaultAppState;
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    globalState = {
      ...defaultAppState,
      campaignName: parsed.campaignName || defaultAppState.campaignName,
      hasInitialSynced: false,
    };
  }
} catch (e) {
  console.error("Failed to parse app state", e);
}

export function getSnapshot() {
  return globalState;
}

export function setGlobalState(next: AppState) {
  globalState = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      campaignName: globalState.campaignName,
      hasInitialSynced: false,
    }));
  } catch (e) {
    console.error("Failed to save state to localStorage (possibly image is too large)", e);
  }
  listeners.forEach(l => l());
}

export const _testHooks = {
  getListeners: () => listeners,
  resetState: () => {
    globalState = defaultAppState;
    listeners.clear();
  }
};

export function useAppState() {
  const state = useSyncExternalStore(
    (callback) => {
      if (listeners.size === 0) {
        // First subscriber! Retry any persisted writes from previous sessions
        void retryPersistedWrites();
      }
      listeners.add(callback);
      const handleStorage = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            globalState = {
              ...globalState,
              campaignName: parsed.campaignName || globalState.campaignName,
            };
            callback();
          } catch (err) {
            console.error("Failed to parse cross-tab storage change");
          }
        }
      };
      window.addEventListener('storage', handleStorage);
      return () => {
        listeners.delete(callback);
        window.removeEventListener('storage', handleStorage);
      };
    },
    getSnapshot,
    getSnapshot
  );

  const updateState = useCallback((updates: Partial<AppState> | ((prev: AppState) => Partial<AppState>)) => {
    const nextState = typeof updates === 'function' ? updates(globalState) : updates;
    setGlobalState({ ...globalState, ...nextState });
  }, []);

  return { state, updateState };
}
