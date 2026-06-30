import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppState, CombatState } from '../types';
import { STORAGE_KEYS } from '../lib/constants';

// The initial empty state — identical to what 
// useAppState currently returns on first load
const initialCombatState: CombatState = {
  activeEncounterId: null,
  activeTurnId: null,
  round: 1,
  combatants: [],
  concentrationLinks: {},
  deathEvent: null,
  damageEvent: null,
  healEvent: null,
  rageEvent: null,
  unconsciousEvent: null,
  initiativeEvent: false,
  selectedIds: [],
  isSelectionMode: false,
  syncingIds: [],
  expandedIds: [],
};

const initialState: AppState = {
  characters: [],
  npcs: [],
  encounters: [],
  encounterCombatants: [],
  conditions: [],
  spells: [],
  statuses: {},
  difficulties: {},
  campaignName: '',
  hasInitialSynced: false,
  openDialog: null,
  combatState: initialCombatState,
};

// The Zustand store type extends AppState with 
// the two methods that useAppState currently 
// exposes — this allows the wrapper to delegate 
// directly to the store
export interface DashboardStore extends AppState {
  updateState: (
    updater: 
      | ((prev: AppState) => AppState) 
      | Partial<AppState>
  ) => void;
  getSnapshot: () => AppState;
}

export const useDashboardStore = 
  create<DashboardStore>()(
    persist(
      (set, get) => ({
        ...initialState,

        updateState: (updater) => {
          if (typeof updater === 'function') {
            set((state) => updater(state));
          } else {
            set(updater);
          }
        },

        getSnapshot: () => {
          // Return only the AppState fields, 
          // not the store methods
          const state = get();
          return {
            characters: state.characters,
            npcs: state.npcs,
            encounters: state.encounters,
            encounterCombatants: state.encounterCombatants,
            conditions: state.conditions,
            spells: state.spells,
            statuses: state.statuses,
            difficulties: state.difficulties,
            campaignName: state.campaignName,
            hasInitialSynced: state.hasInitialSynced,
            openDialog: state.openDialog,
            combatState: state.combatState,
          };
        },
      }),

      {
        name: STORAGE_KEYS.appState,
        storage: createJSONStorage(() => localStorage),

        // Only these fields are persisted to 
        // localStorage between sessions.
        // This matches the existing persistence 
        // rules from the SSOT refactor.
        partialize: (state): any => ({
          campaignName: state.campaignName,
          // hasInitialSynced always stored as 
          // false so every fresh load waits for 
          // sheet sync
          hasInitialSynced: false,
          // combatState IS persisted for cross-tab 
          // sync (PlayerView needs it) but overlay 
          // events are stripped — they are transient
          combatState: {
            ...state.combatState,
            deathEvent: null,
            damageEvent: null,
            healEvent: null,
            rageEvent: null,
            unconsciousEvent: null,
            initiativeEvent: false,
            syncingIds: [],
            selectedIds: [],
            isSelectionMode: false,
            expandedIds: [],
          },
        }),
      }
    )
  );

// Cross-tab sync — when another tab writes 
// combatState to localStorage (e.g. GM dashboard 
// starts an encounter), this tab receives the 
// storage event and updates its local store.
// This is how PlayerView sees the active encounter.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (
      event.key === STORAGE_KEYS.appState && 
      event.newValue
    ) {
      try {
        const parsed = JSON.parse(event.newValue);
        const incoming = parsed?.state;
        if (incoming?.combatState) {
          useDashboardStore.setState({
            combatState: {
              ...incoming.combatState,
              deathEvent: null,
              damageEvent: null,
              healEvent: null,
              rageEvent: null,
              unconsciousEvent: null,
              initiativeEvent: false,
            },
          });
        }
        if (incoming?.campaignName !== undefined) {
          useDashboardStore.setState({
            campaignName: incoming.campaignName,
          });
        }
      } catch (error) {
        console.error(
          '[Cross-tab sync error]', 
          error
        );
      }
    }
  });
}
