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

const mockUpdateState = vi.fn();
const mockAppState = {
  combatState: {
    combatants: [] as any[],
    activeTurnId: null as string | null,
  },
  encounterCombatants: [] as any[],
  characters: [] as any[],
};

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: () => ({
    updateState: mockUpdateState,
    state: {
      characters: [],
      npcs: [],
    },
  }),
  getSnapshot: () => mockAppState,
}));

vi.mock('../../../hooks/useOverlayEvents', () => ({
  useDamageEvent: () => ({ fire: vi.fn() }),
  useHealEvent: () => ({ fire: vi.fn() }),
  useUnconsciousEvent: () => ({ fire: vi.fn() }),
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
});
