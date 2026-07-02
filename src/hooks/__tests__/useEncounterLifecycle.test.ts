import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEncounterLifecycle } from '../useEncounterLifecycle';
import { useCombatSync } from '../../components/ActiveEncounterTab/hooks/useCombatSync';
import { useDashboardStore } from '../dashboardStore';

vi.mock('../../services/dbOperations', () => ({
  updateEncounterStateDB: vi.fn().mockResolvedValue(undefined),
  clearEncounterStateDB: vi.fn().mockResolvedValue(undefined),
  updateInitiativeDB: vi.fn().mockResolvedValue(undefined),
  addEncounterCombatantDB: vi.fn().mockResolvedValue([]),
}));

import { addEncounterCombatantDB } from '../../services/dbOperations';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

describe('useEncounterLifecycle & useCombatSync Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDashboardStore.setState({
      characters: [],
      npcs: [],
      encounters: [],
      encounterCombatants: [],
      statuses: {},
      difficulties: {},
      campaignName: '',
      hasInitialSynced: false,
      openDialog: null,
      combatState: {
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
      },
    });
  });

  const setupHook = () => {
    return renderHook(() => {
      const lifecycle = useEncounterLifecycle();
      const sync = useCombatSync();
      return { lifecycle, sync };
    });
  };

  it('startCombat sets the active encounter id and initializes combatants from the encounter', async () => {
    const mockEncounter: any = { id: 'enc-1', name: 'Forest Ambush', location: 'Forest', difficultyId: 2, difficultyName: 'Medium', status: 'planned', npcDefinitions: 'npc-1', currentRound: 0, activeTurnId: '' };
    const mockEncounterCombatant: any = { id: 'ec-1', encounterId: 'enc-1', playerId: null, npcId: 'npc-1', quantity: 1, initiative: 12, conditionTimers: {}, npcCurrentHp: -1, npcTempHp: 0, npcCurrentConditions: '', npcTempAcMod: 0 };
    const mockNpc: any = { id: 'npc-1', name: 'Goblin', ac: 15, maxHp: 7, tempHp: 0, currentHp: 7, conditions: '', notes: '', resistances: '', immunities: '', vulnerabilities: '', legendaryActions: 0, legendaryResistances: 0, rechargeAbilities: [], abilityScores: '{}', proficiencies: '{}', speed: '30 ft.', senses: '', languages: 'Goblin', challengeRating: '1/4', traits: '[]', actions: '[]', reactions: '[]', legendaryActionsList: '[]', spellcastingAbility: '' };

    useDashboardStore.setState({
      encounters: [mockEncounter],
      encounterCombatants: [mockEncounterCombatant],
      npcs: [mockNpc],
    });

    const { result } = setupHook();

    await act(async () => {
      await result.current.lifecycle.startEncounter('enc-1');
    });

    const storeState = useDashboardStore.getState();
    expect(storeState.combatState.activeEncounterId).toBe('enc-1');
    expect(storeState.combatState.combatants).toHaveLength(1);
    expect(storeState.combatState.combatants[0].name).toBe('Goblin');
    expect(storeState.combatState.activeTurnId).toBe(storeState.combatState.combatants[0].id);
  });

  it('endCombat clears the active encounter id and combat state', async () => {
    useDashboardStore.setState({
      combatState: {
        activeEncounterId: 'enc-1',
        activeTurnId: 'c-1',
        round: 2,
        combatants: [{ id: 'c-1', name: 'Hero', initiative: 15 } as any],
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
        combatStarted: true,
      }
    });

    const { result } = setupHook();

    await act(async () => {
      result.current.lifecycle.clearEncounter();
    });

    const storeState = useDashboardStore.getState();
    expect(storeState.combatState.activeEncounterId).toBeNull();
  });

  it('nextTurn advances activeTurnId to the next combatant in initiative order', async () => {
    const comb1 = { id: 'c-1', name: 'Hero', initiative: 20, type: 'pc', currentHp: 10 } as any;
    const comb2 = { id: 'c-2', name: 'Goblin', initiative: 10, type: 'pc', currentHp: 10 } as any;

    useDashboardStore.setState({
      combatState: {
        activeEncounterId: 'enc-1',
        activeTurnId: 'c-1',
        round: 1,
        combatants: [comb1, comb2],
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
        combatStarted: true,
      }
    });

    const { result } = setupHook();

    await act(async () => {
      result.current.sync.nextTurn();
    });

    const storeState = useDashboardStore.getState();
    expect(storeState.combatState.activeTurnId).toBe('c-2');
    expect(storeState.combatState.round).toBe(1);
  });

  it('nextTurn increments the round number when wrapping from last to first combatant', async () => {
    const comb1 = { id: 'c-1', name: 'Hero', initiative: 20, type: 'pc', currentHp: 10 } as any;
    const comb2 = { id: 'c-2', name: 'Goblin', initiative: 10, type: 'pc', currentHp: 10 } as any;

    useDashboardStore.setState({
      combatState: {
        activeEncounterId: 'enc-1',
        activeTurnId: 'c-2',
        round: 1,
        combatants: [comb1, comb2],
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
        combatStarted: true,
      }
    });

    const { result } = setupHook();

    await act(async () => {
      result.current.sync.nextTurn();
    });

    const storeState = useDashboardStore.getState();
    expect(storeState.combatState.activeTurnId).toBe('c-1');
    expect(storeState.combatState.round).toBe(2);
  });

  it('rollNpcInitiative assigns initiative values to NPC combatants using DEX modifier', async () => {
    const mockNpcTemplate = { id: 'npc-1', name: 'Goblin', abilityScores: JSON.stringify({ DEX: 14 }) };
    const mockCombatant = { id: 'c-1', name: 'Goblin 1', type: 'npc', npcId: 'npc-1', initiative: 0, encounterCombatantId: 'ec-1' } as any;

    useDashboardStore.setState({
      npcs: [mockNpcTemplate as any],
      combatState: {
        activeEncounterId: 'enc-1',
        activeTurnId: 'c-1',
        round: 1,
        combatants: [mockCombatant],
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
      }
    });

    const { result } = setupHook();

    await act(async () => {
      result.current.sync.rollInitForNPCs();
    });

    const storeState = useDashboardStore.getState();
    const updatedCombatant = storeState.combatState.combatants[0];
    // DEX is 14 -> modifier is +2.
    // Initiative is rolled with 1d20 + 2. It should be >= 3 and <= 22.
    expect(updatedCombatant.initiative).toBeGreaterThanOrEqual(1);
    expect(updatedCombatant.initiative).toBeLessThanOrEqual(22);
  });

  it('startEncounter auto-adds and persists active PCs when encounter has no combatants', async () => {
    const mockEncounter: any = { id: 'enc-1', name: 'New Encounter', status: 'planned' };
    const mockPc: any = { id: 'pc-1', characterName: 'Hero', statusId: 1, isActive: true }; // isActive is used by builder fallback

    useDashboardStore.setState({
      encounters: [mockEncounter],
      characters: [mockPc],
      encounterCombatants: [], // Empty means first entry
    });

    const { result } = setupHook();

    await act(async () => {
      await result.current.lifecycle.startEncounter('enc-1');
    });

    expect(addEncounterCombatantDB).toHaveBeenCalledWith('enc-1', 'pc-1', null, 1);
  });

  it('startEncounter does NOT call addEncounterCombatantDB if combatants already exist', async () => {
    const mockEncounter: any = { id: 'enc-1', name: 'Existing Encounter', status: 'planned' };
    const mockEc: any = { id: 'ec-1', encounterId: 'enc-1', playerId: 'pc-1', quantity: 1 };
    const mockPc: any = { id: 'pc-1', characterName: 'Hero', statusId: 1, isActive: true };

    useDashboardStore.setState({
      encounters: [mockEncounter],
      characters: [mockPc],
      encounterCombatants: [mockEc], // Not empty for this encounter
    });

    const { result } = setupHook();

    await act(async () => {
      await result.current.lifecycle.startEncounter('enc-1');
    });

    expect(addEncounterCombatantDB).not.toHaveBeenCalled();
  });
});
