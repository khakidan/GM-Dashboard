import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppState, CombatState } from '../types';
import { STORAGE_KEYS } from '../lib/constants';
import {
  ActiveCombatLog,
  CombatEvent,
  PartySnapshot,
  InitiativeEntry,
  generateCombatEventId,
  ActionType,
} from '../lib/combatLog';

// The initial empty state — identical to what 
// useAppState currently returns on first load
const initialCombatState = {
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
  combatStarted: false,
  actionContext: {
    sourceOverride: null,
    actionType: 'attack'
  },
} as CombatState & { 
  combatStarted: boolean; 
  actionContext: { sourceOverride: string | null; actionType: ActionType } 
};

const initialState: Omit<AppState, 'combatState'> & { 
  activeCombatLog: ActiveCombatLog | null, 
  combatState: CombatState & { 
    combatStarted: boolean;
    actionContext: { sourceOverride: string | null; actionType: ActionType };
  } 
} = {
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
  activeCombatLog: null,
};

// The Zustand store type extends AppState with 
// the two methods that useAppState currently 
// exposes — this allows the wrapper to delegate 
// directly to the store
export interface DashboardStore extends Omit<AppState, 'combatState'> {
  activeCombatLog: ActiveCombatLog | null;
  combatState: CombatState & { 
    combatStarted: boolean;
    actionContext: { sourceOverride: string | null; actionType: ActionType };
  };
  setCombatStarted: (value: boolean) => void;
  setActionContext: (sourceOverride: string | null, actionType: ActionType) => void;
  updateState: (
    updater: 
      | ((prev: AppState) => AppState) 
      | Partial<AppState>
  ) => void;
  getSnapshot: () => AppState;
  initCombatLog: (
    encounterId: string,
    encounterName: string,
    location: string,
    partySnapshot: PartySnapshot[],
    initiativeOrder: InitiativeEntry[],
    startingRound: number
  ) => void;
  addCombatEvent: (event: Omit<CombatEvent, 'id' | 'timestamp'>) => void;
  advanceCombatLogRound: () => void;
  clearCombatLog: () => void;
}

export const useDashboardStore = 
  create<DashboardStore>()(
    persist(
      (set, get) => ({
        ...initialState,

        setCombatStarted: (value: boolean) => {
          set((state) => ({
            combatState: {
              ...state.combatState,
              combatStarted: value,
            }
          }));
        },

        setActionContext: (sourceOverride: string | null, actionType: ActionType) => {
          set((state) => ({
            combatState: {
              ...state.combatState,
              actionContext: {
                sourceOverride,
                actionType,
              }
            }
          }));
        },

        updateState: (updater) => {
          if (typeof updater === 'function') {
            set((state) => updater(state as unknown as AppState) as unknown as Partial<DashboardStore>);
          } else {
            set(updater as unknown as Partial<DashboardStore>);
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

        initCombatLog: (encounterId, encounterName, location, partySnapshot, initiativeOrder, startingRound) => {
          set(() => ({
            activeCombatLog: {
              encounterId,
              encounterName,
              location,
              startedAt: new Date().toISOString(),
              currentRound: startingRound,
              partySnapshot,
              initiativeOrder,
              events: [],
            },
          }));
        },

        addCombatEvent: (event) => {
          set((state) => {
            if (!state.activeCombatLog) return {};
            const newEvent: CombatEvent = {
              ...event,
              id: generateCombatEventId(),
              timestamp: new Date().toISOString(),
            };
            return {
              activeCombatLog: {
                ...state.activeCombatLog,
                events: [...state.activeCombatLog.events, newEvent],
              },
            };
          });
        },

        advanceCombatLogRound: () => {
          set((state) => {
            if (!state.activeCombatLog) return {};
            return {
              activeCombatLog: {
                ...state.activeCombatLog,
                currentRound: state.activeCombatLog.currentRound + 1,
              },
            };
          });
        },

        clearCombatLog: () => {
          set(() => ({
            activeCombatLog: null,
          }));
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
          activeCombatLog: state.activeCombatLog,
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
        if (incoming?.activeCombatLog !== undefined) {
          useDashboardStore.setState({
            activeCombatLog: incoming.activeCombatLog,
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
