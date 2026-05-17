import { useCallback, useSyncExternalStore } from 'react';
import { AppState, Character, Encounter, CombatState, NPC, EncounterCombatant } from '../types';

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
};

const defaultAppState: AppState = {
  campaignName: "The Funky Tusk Lover's Campaign",
  characters: initialCharacters,
  encounters: initialEncounters,
  npcs: initialNPCs,
  encounterCombatants: initialEncounterCombatants,
  difficulties: {},
  statuses: {},
  combatState: defaultCombatState,
};

// Global Store Setup
type Listener = () => void;
const listeners = new Set<Listener>();

let globalState = defaultAppState;
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    globalState = { ...defaultAppState, ...JSON.parse(stored) };
  }
} catch (e) {
  console.error("Failed to parse app state", e);
}

function getSnapshot() {
  return globalState;
}

function setGlobalState(next: AppState) {
  globalState = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(globalState));
  } catch (e) {
    console.error("Failed to save state to localStorage (possibly image is too large)", e);
  }
  listeners.forEach(l => l());
}

export function useAppState() {
  const state = useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      const handleStorage = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            globalState = JSON.parse(e.newValue);
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
    getSnapshot
  );

  const updateState = useCallback((newStateOrUpdater: AppState | ((prev: AppState) => AppState)) => {
    const next = typeof newStateOrUpdater === 'function' ? newStateOrUpdater(globalState) : newStateOrUpdater;
    setGlobalState(next);
  }, []);

  return { state, updateState };
}
