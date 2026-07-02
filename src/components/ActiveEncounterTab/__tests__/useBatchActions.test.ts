import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useBatchActions } from '../hooks/useBatchActions';
import { toast } from 'sonner';
import { 
  deleteEncounterCombatantDB, 
  updateNpcInstanceHpDB,
  updateNpcInstanceConditionsDB
} from '../../../services/dbOperations';
import { Combatant } from '../../../types';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

vi.mock('../../../services/dbOperations', () => ({
  deleteEncounterCombatantDB: vi.fn().mockResolvedValue(true),
  updateEncounterCombatantQuantityDB: vi.fn().mockResolvedValue(true),
  updateCharacterDB: vi.fn().mockResolvedValue(true),
  updateNpcInstanceHpDB: vi.fn().mockResolvedValue(true),
  updateNpcInstanceConditionsDB: vi.fn().mockResolvedValue(true),
}));

const mockAppState = {
  combatState: {
    combatants: [] as any[],
    activeTurnId: null as string | null,
  },
  encounterCombatants: [] as any[],
  characters: [] as any[],
};

const mockUpdateState = vi.fn((updater) => {
  if (typeof updater === 'function') {
    const nextState = updater(mockAppState);
    if (nextState) {
      if (nextState.combatState) {
        mockAppState.combatState = { ...mockAppState.combatState, ...nextState.combatState };
      }
      if (nextState.characters) {
        mockAppState.characters = nextState.characters;
      }
      if (nextState.encounterCombatants) {
        mockAppState.encounterCombatants = nextState.encounterCombatants;
      }
    }
  }
});

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: () => ({
    updateState: mockUpdateState,
    state: {
      characters: [],
      npcs: [],
    },
  }),
  getSnapshot: () => ({
    combatState: {
      combatants: [...mockAppState.combatState.combatants],
      activeTurnId: mockAppState.combatState.activeTurnId,
    },
    encounterCombatants: [...mockAppState.encounterCombatants],
    characters: [...mockAppState.characters],
  }),
}));

const mockFireUnconscious = vi.fn();
vi.mock('../../../hooks/useOverlayEvents', () => ({
  useDamageEvent: () => ({ fire: vi.fn() }),
  useHealEvent: () => ({ fire: vi.fn() }),
  useUnconsciousEvent: () => ({ fire: mockFireUnconscious }),
}));

vi.mock('../../../hooks/useDeathSaves', () => ({
  useDeathSaves: () => ({ applyDamageToUnconscious: vi.fn(), recordDeathSave: vi.fn(), clearDeathSaves: vi.fn() })
}));

describe('useBatchActions', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockAppState.combatState.combatants = [];
    mockAppState.encounterCombatants = [];
    mockAppState.characters = [];
    mockAppState.combatState.activeTurnId = null;
  });

  const c1: Combatant = {
    id: 'c1',
    name: 'Goblin A',
    type: 'npc',
    ac: 15,
    maxHp: 20,
    currentHp: 20,
    tempHp: 0,
    initiative: 10,
    notes: '',
    passivePerception: 10,
    conditions: '',
    encounterCombatantId: 'ec-1',
  };

  const c2: Combatant = {
    id: 'c2',
    name: 'Goblin B',
    type: 'npc',
    ac: 15,
    maxHp: 20,
    currentHp: 20,
    tempHp: 0,
    initiative: 8,
    notes: '',
    passivePerception: 10,
    conditions: '',
    encounterCombatantId: 'ec-2',
  };

  const c3: Combatant = {
    id: 'c3',
    name: 'Fighter',
    type: 'pc',
    ac: 18,
    maxHp: 30,
    currentHp: 30,
    tempHp: 0,
    initiative: 12,
    notes: '',
    passivePerception: 12,
    conditions: '',
    characterId: 'char-fighter',
    encounterCombatantId: 'ec-3',
  };

  it('batch damage applies correct damage to all selected combatants', async () => {
    const selectedIds = new Set(['c1', 'c2']);
    const combatants = [c1, c2, c3];
    mockAppState.combatState.combatants = combatants;
    mockAppState.encounterCombatants = [
      { id: 'ec-1', quantity: 1, npcCurrentHp: 20 },
      { id: 'ec-2', quantity: 1, npcCurrentHp: 20 },
    ];

    const { result } = renderHook(() => useBatchActions({ selectedIds, combatants }));

    await act(async () => {
      await result.current.handleApplyMultiDamage(5, 'fire');
    });

    expect(mockUpdateState).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Damage applied to 2 targets');
    expect(updateNpcInstanceHpDB).toHaveBeenCalledWith('ec-1', 15, 0);
    expect(updateNpcInstanceHpDB).toHaveBeenCalledWith('ec-2', 15, 0);
  });

  it('batch heal applies correct healing to all selected combatants', async () => {
    const woundedC1 = { ...c1, currentHp: 5 };
    const woundedC2 = { ...c2, currentHp: 10 };
    const selectedIds = new Set(['c1', 'c2']);
    const combatants = [woundedC1, woundedC2, c3];
    mockAppState.combatState.combatants = combatants;
    mockAppState.encounterCombatants = [
      { id: 'ec-1', quantity: 1, npcCurrentHp: 5 },
      { id: 'ec-2', quantity: 1, npcCurrentHp: 10 },
    ];

    const { result } = renderHook(() => useBatchActions({ selectedIds, combatants }));

    await act(async () => {
      await result.current.handleApplyMultiHealing(10);
    });

    expect(updateNpcInstanceHpDB).toHaveBeenCalledWith('ec-1', 15, 0);
    expect(updateNpcInstanceHpDB).toHaveBeenCalledWith('ec-2', 20, 0);
    expect(toast.success).toHaveBeenCalledWith('Healing applied to 2 targets');
  });

  it('batch condition applies condition string to all selected combatants', async () => {
    const selectedIds = new Set(['c1', 'c2']);
    const combatants = [{ ...c1, conditions: 'poisoned' }, c2, c3];
    mockAppState.combatState.combatants = combatants;

    const { result } = renderHook(() => useBatchActions({ selectedIds, combatants }));

    await act(async () => {
      await result.current.handleApplyMultiCondition('blinded');
    });

    expect(updateNpcInstanceConditionsDB).toHaveBeenCalledWith('ec-1', 'poisoned, blinded');
    expect(updateNpcInstanceConditionsDB).toHaveBeenCalledWith('ec-2', 'blinded');
    expect(toast.success).toHaveBeenCalledWith('blinded applied to 2 targets');
  });

  it('batch delete removes all selected combatants from state', async () => {
    const selectedIds = new Set(['c1']);
    const combatants = [c1, c2, c3];
    mockAppState.combatState.combatants = combatants;
    mockAppState.encounterCombatants = [
      { id: 'ec-1', quantity: 1 },
      { id: 'ec-2', quantity: 1 },
      { id: 'ec-3', quantity: 1 },
    ];
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const { result } = renderHook(() => useBatchActions({ selectedIds, combatants }));

    await act(async () => {
      await result.current.handleDeleteSelected();
    });

    expect(deleteEncounterCombatantDB).toHaveBeenCalledWith('ec-1');
    expect(toast.success).toHaveBeenCalledWith('1 combatants removed.');
  });

  it('batch actions ignore combatants that are not in the selected ids list', async () => {
    const selectedIds = new Set(['c1']);
    const combatants = [c1, c2, c3];
    mockAppState.combatState.combatants = combatants;
    mockAppState.encounterCombatants = [{ id: 'ec-1', quantity: 1, npcCurrentHp: 20 }];

    const { result } = renderHook(() => useBatchActions({ selectedIds, combatants }));

    await act(async () => {
      await result.current.handleApplyMultiDamage(5, 'cold');
    });

    expect(updateNpcInstanceHpDB).toHaveBeenCalledTimes(1);
    expect(updateNpcInstanceHpDB).toHaveBeenCalledWith('ec-1', 15, 0);
  });

  it('rolls back state when batch damage DB write fails', async () => {
    // Intercept unhandled promise rejection because handleHealthChange runs synchronously
    // without awaiting the async updateCombatant under the hood.
    const handleRejection = (e: Event) => {
      e.preventDefault();
    };
    window.addEventListener('unhandledrejection', handleRejection);
    const processRejection = () => {
      // swallow rejection
    };
    process.on('unhandledRejection', processRejection);

    try {
      // Make the DB call fail
      vi.mocked(updateNpcInstanceHpDB).mockRejectedValueOnce(
        new Error('Network error')
      );

      const targetCombatant: Combatant = {
        id: 'c1',
        name: 'Goblin A',
        type: 'npc',
        ac: 15,
        maxHp: 20,
        currentHp: 20,
        tempHp: 0,
        initiative: 10,
        notes: '',
        passivePerception: 10,
        conditions: '',
        encounterCombatantId: 'ec-1',
      };

      const selectedIds = new Set(['c1']);
      const combatants = [targetCombatant];

      // mockAppState is the object returned by the global getSnapshot mock
      mockAppState.combatState.combatants = combatants;
      mockAppState.encounterCombatants = [
        { id: 'ec-1', quantity: 1, npcCurrentHp: 20 }
      ];

      const { result } = renderHook(() =>
        useBatchActions({ selectedIds, combatants })
      );

      // Attempt batch damage — should fail
      await act(async () => {
        try {
          await result.current.handleApplyMultiDamage(5, 'fire');
        } catch {
          // expected to throw
        }
      });

      // Assert updateState was called to roll back
      expect(mockUpdateState).toHaveBeenCalled();

      // The last updateState call should restore the previous state
      const lastCall = mockUpdateState.mock.calls[mockUpdateState.mock.calls.length - 1][0];
      const restoredState = typeof lastCall === 'function' ? lastCall(mockAppState) : lastCall;
      expect(restoredState).toEqual(mockAppState);
    } finally {
      window.removeEventListener('unhandledrejection', handleRejection);
      process.off('unhandledRejection', processRejection);
    }
  });

  it('batch damage triggers fireUnconsciousEvent when a PC is reduced to 0 HP', async () => {
    const selectedIds = new Set(['c3']);
    const pcCombatant = { ...c3, currentHp: 10 }; // Fighter has 10 HP
    const combatants = [c1, c2, pcCombatant];
    mockAppState.combatState.combatants = combatants;
    mockAppState.encounterCombatants = [];

    const { result } = renderHook(() => useBatchActions({ selectedIds, combatants }));

    await act(async () => {
      await result.current.handleApplyMultiDamage(10, 'slashing');
    });

    expect(mockFireUnconscious).toHaveBeenCalledWith({ characterName: 'Fighter' });
  });

  it('batch damage fires only first PC unconsciousness overlay and logs a warning when multiple PCs drop to 0 HP', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const pc1 = { ...c3, id: 'pc1', name: 'PC One', currentHp: 10 };
    const pc2 = { ...c3, id: 'pc2', name: 'PC Two', currentHp: 5 };
    const selectedIds = new Set(['pc1', 'pc2']);
    const combatants = [pc1, pc2];
    mockAppState.combatState.combatants = combatants;
    mockAppState.encounterCombatants = [];

    const { result } = renderHook(() => useBatchActions({ selectedIds, combatants }));

    await act(async () => {
      await result.current.handleApplyMultiDamage(10, 'slashing');
    });

    expect(mockFireUnconscious).toHaveBeenCalledTimes(1);
    expect(mockFireUnconscious).toHaveBeenCalledWith({ characterName: 'PC One' });
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Multiple PCs fell unconscious simultaneously')
    );

    consoleWarnSpy.mockRestore();
  });
});
