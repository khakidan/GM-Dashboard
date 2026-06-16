// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useHealthChange } from '../hooks/useHealthChange';
import type { Combatant } from '../../../types';
import { toast } from 'sonner';
import { useUnconsciousEvent } from '../../../hooks/useOverlayEvents';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

vi.mock('../../../services/dbOperations', () => ({
  updateDeathSavesDB: vi.fn().mockResolvedValue(true),
  updateCharacterDB: vi.fn().mockResolvedValue(true),
}));

const mockUpdateState = vi.fn();
const mockAppState = {
  combatState: {
    combatants: [] as any[],
  },
};

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: () => ({
    updateState: mockUpdateState,
  }),
  getSnapshot: () => mockAppState,
}));

const mockFireDamage = vi.fn();
const mockFireHeal = vi.fn();
const mockFireUnconscious = vi.fn();

vi.mock('../../../hooks/useOverlayEvents', () => ({
  useDamageEvent: () => ({ fire: mockFireDamage }),
  useHealEvent: () => ({ fire: mockFireHeal }),
  useUnconsciousEvent: () => ({ fire: mockFireUnconscious }),
  useDeathEvent: () => ({ fire: vi.fn() }),
}));

describe('useHealthChange', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
  const syncingIds = new Set<string>();

  const baseCombatant: Combatant = {
    id: 'c1',
    name: 'Goblin',
    type: 'npc',
    ac: 15,
    maxHp: 30,
    currentHp: 30,
    tempHp: 5,
    initiative: 10,
    notes: '',
    passivePerception: 10,
    conditions: '',
  };

  it('handleHealthChange with isDamage true reduces currentHp correctly', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setDamageInputs({ c1: '10' });
    });

    act(() => {
      // 10 damage: 5 is absorbed by tempHp, 5 by currentHp. So temp=0, hp=25
      result.current.handleHealthChange('c1', baseCombatant, true);
    });

    expect(updateSpy).toHaveBeenCalledWith('c1', { currentHp: 25, tempHp: 0 });
  });

  it('handleHealthChange with isDamage false increases currentHp correctly', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));
    const woundedCombatant = { ...baseCombatant, currentHp: 10, tempHp: 0 };

    act(() => {
      result.current.setHealInputs({ c1: '15' });
    });

    act(() => {
      result.current.handleHealthChange('c1', woundedCombatant, false);
    });

    // 10 + 15 = 25
    expect(updateSpy).toHaveBeenCalledWith('c1', { currentHp: 25, tempHp: 0 });
  });

  it('handleHealthChange absorbs damage into tempHp before currentHp', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setDamageInputs({ c1: '3' });
    });

    act(() => {
      // 3 damage, tempHp is 5. So temp=2, hp=30
      result.current.handleHealthChange('c1', baseCombatant, true);
    });

    expect(updateSpy).toHaveBeenCalledWith('c1', { currentHp: 30, tempHp: 2 });
    expect(mockFireDamage).toHaveBeenCalledWith({
      combatantNames: ['Goblin'],
      damageAmount: 3,
      damageType: undefined,
    });
  });

  it('handleHealthChange fires heal event when healing is applied', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setHealInputs({ c1: '5' });
    });

    // Make character wounded first
    const wounded = { ...baseCombatant, currentHp: 10 };

    act(() => {
      result.current.handleHealthChange('c1', wounded, false);
    });

    expect(updateSpy).toHaveBeenCalledWith('c1', { currentHp: 15, tempHp: 5 });
    expect(mockFireHeal).toHaveBeenCalledWith({
      combatantNames: ['Goblin'],
      healAmount: 5,
    });
  });

  it('handleHealthChange clears the health input for that combatant id after applying the change', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setDamageInputs({ c1: '5', c2: '10' });
    });

    act(() => {
      result.current.handleHealthChange('c1', baseCombatant, true);
    });

    expect(result.current.damageInputs['c1']).toBe('');
    expect(result.current.damageInputs['c2']).toBe('10');
  });

  it('handleHealthChange is a no-op when the input value is empty', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setDamageInputs({ c1: '' });
    });

    act(() => {
      result.current.handleHealthChange('c1', baseCombatant, true);
    });

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('handleHealthChange is a no-op when the input value is not a number', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setDamageInputs({ c1: 'abc' });
    });

    act(() => {
      result.current.handleHealthChange('c1', baseCombatant, true);
    });

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('does not fire concentration toast when non-concentrating take damage', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));
    act(() => {
      result.current.setDamageInputs({ c1: '5' });
    });
    act(() => {
      result.current.handleHealthChange('c1', baseCombatant, true);
    });
    expect(toast).not.toHaveBeenCalled();
  });

  it('does not fire concentration toast when damage is 0 (immune)', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));
    const concCombatant = { ...baseCombatant, conditions: 'concentrating' };
    
    act(() => {
      result.current.setDamageInputs({ c1: '0' });
    });
    act(() => {
      result.current.handleHealthChange('c1', concCombatant, true);
    });
    expect(toast).not.toHaveBeenCalled();
  });

  it('fires concentration toast with correct DC when damage > 0', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));
    const concCombatant = { ...baseCombatant, conditions: 'concentrating, hasted' };
    
    act(() => {
      result.current.setDamageInputs({ c1: '12' });
    });
    act(() => {
      result.current.handleHealthChange('c1', concCombatant, true);
    });
    expect(toast).toHaveBeenCalledWith('Concentration check required', expect.objectContaining({
      description: expect.stringContaining('CON save DC: 10')
    }));
  });

  it('clears concentration and its timers when the toast action is triggered', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));
    const concCombatant: Combatant = {
      ...baseCombatant,
      conditions: 'blinded, concentrating, blessed',
      conditionTimers: { 'blinded': 5, 'blessed': 10, 'concentrating': 10 }
    };

    act(() => {
      result.current.setDamageInputs({ c1: '20' });
    });

    act(() => {
      result.current.handleHealthChange('c1', concCombatant, true);
    });

    // Get the toast call
    const lastToastCall = vi.mocked(toast).mock.calls[0];
    const options = lastToastCall[1] as any;
    const onFailedSave = options.action.onClick;

    // Trigger the failing save action
    act(() => {
      onFailedSave();
    });

    // Check updateCombatant call
    // 'blessed' and 'concentrating' are concentration effects, so they should be removed.
    // 'blinded' should stay.
    expect(updateSpy).toHaveBeenCalledWith('c1', expect.objectContaining({
      conditions: 'blinded',
      conditionTimers: { 'blinded': 5 }
    }));
  });

  it('An NPC at 0 HP does NOT get unconscious applied', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));
    const npcCombatant: Combatant = {
      ...baseCombatant,
      type: 'npc',
      currentHp: 10,
      conditions: '',
    };
    act(() => {
      result.current.setDamageInputs({ c1: '20' });
    });
    act(() => {
      result.current.handleHealthChange('c1', npcCombatant, true);
    });
    expect(updateSpy).toHaveBeenCalledWith('c1', {
      currentHp: 0,
      tempHp: 0,
    });
  });

  it('Healing an unconscious PC removes unconscious and resets death saves to 0', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));
    const unconsciousPC: Combatant = {
      ...baseCombatant,
      type: 'pc',
      currentHp: 0,
      tempHp: 0,
      conditions: 'Unconscious, Blessed',
      deathSavesFails: 2,
      deathSavesSuccesses: 1,
    };
    act(() => {
      result.current.setHealInputs({ c1: '10' });
    });
    act(() => {
      result.current.handleHealthChange('c1', unconsciousPC, false);
    });
    expect(updateSpy).toHaveBeenCalledWith('c1', {
      currentHp: 10,
      tempHp: 0,
      conditions: 'Blessed',
      deathSavesFails: 0,
      deathSavesSuccesses: 0,
      isStable: false,
    });
  });

  it('Critical hit on unconscious PC adds 2 failures not 1', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));
    const unconsciousPC: Combatant = {
      ...baseCombatant,
      type: 'pc',
      characterId: 'char-1',
      currentHp: 0,
      tempHp: 0,
      conditions: 'Unconscious',
      deathSavesFails: 0,
      deathSavesSuccesses: 0,
    };
    mockAppState.combatState.combatants = [unconsciousPC];
    act(() => {
      result.current.setDamageInputs({ c1: '5' });
    });
    act(() => {
      // isCritical = true is passed
      result.current.handleHealthChange('c1', unconsciousPC, true, null, undefined, true);
    });
    expect(mockUpdateState).toHaveBeenCalled();
    const updater = mockUpdateState.mock.calls[0][0];
    const dummyState = {
      characters: [{ id: 'char-1', deathSavesFails: 0 }],
      combatState: {
        combatants: [{ id: 'c1', type: 'pc', characterId: 'char-1', deathSavesFails: 0, isStable: false }]
      }
    };
    const nextState = updater(dummyState as any);
    const updatedPC = nextState.combatState.combatants[0];
    expect(updatedPC.deathSavesFails).toBe(2);
    expect(updatedPC.isStable).toBe(false);
  });

  it('When finalDamage > 0, fireDamageEvent is called with the correct names and amount', () => {
    mockUpdateState.mockClear();
    mockFireDamage.mockClear();
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setDamageInputs({ c1: '10' });
    });

    act(() => {
      // 10 damage: 5 goes to tempHp, 5 to currentHp. finalDamageAmount is 10
      result.current.handleHealthChange('c1', baseCombatant, true);
    });

    expect(mockFireDamage).toHaveBeenCalledTimes(1);
    expect(mockFireDamage).toHaveBeenCalledWith({
      combatantNames: ['Goblin'],
      damageAmount: 10,
      damageType: undefined,
    });
  });

  it('When finalDamage is 0 (immune), damageEvent is NOT set', () => {
    mockUpdateState.mockClear();
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setDamageInputs({ c1: '0' });
    });

    act(() => {
      result.current.handleHealthChange('c1', baseCombatant, true);
    });

    expect(mockUpdateState).not.toHaveBeenCalled();
  });

  it('When the target is healing (not damage), fireDamageEvent is NOT called', () => {
    mockUpdateState.mockClear();
    mockFireDamage.mockClear();
    mockFireHeal.mockClear();
    const updateSpy = vi.fn();
    const woundedCombatant = { ...baseCombatant, currentHp: 10, tempHp: 0 };
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setHealInputs({ c1: '15' });
    });

    act(() => {
      // 15 heal, base max is 15. so actualHeal = 5
      result.current.handleHealthChange('c1', woundedCombatant, false);
    });

    expect(mockFireDamage).not.toHaveBeenCalled();
    expect(mockFireHeal).toHaveBeenCalledTimes(1);
  });

  it('When actualHeal > 0, fireHealEvent is called with the correct names and amount', () => {
    mockUpdateState.mockClear();
    mockFireHeal.mockClear();
    const updateSpy = vi.fn();
    const woundedCombatant = { ...baseCombatant, currentHp: 5, tempHp: 0 };
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setHealInputs({ c1: '8' }); // Heals 8, max is 15. Current HP will become 13.
    });

    act(() => {
      result.current.handleHealthChange('c1', woundedCombatant, false);
    });

    expect(mockFireHeal).toHaveBeenCalledTimes(1);
    expect(mockFireHeal).toHaveBeenCalledWith({
      combatantNames: ['Goblin'],
      healAmount: 8,
    });
  });

  it('When the combatant is already at full HP and no HP is actually restored, healEvent is NOT set', () => {
    mockUpdateState.mockClear();
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setHealInputs({ c1: '10' });
    });

    act(() => {
      // already at max (15)
      result.current.handleHealthChange('c1', baseCombatant, false);
    });

    expect(mockUpdateState).not.toHaveBeenCalled();
  });

  it('When the operation is damage (not healing), fireHealEvent is NOT called', () => {
    mockUpdateState.mockClear();
    mockFireDamage.mockClear();
    mockFireHeal.mockClear();
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setDamageInputs({ c1: '10' });
    });

    act(() => {
      result.current.handleHealthChange('c1', baseCombatant, true);
    });

    expect(mockFireHeal).not.toHaveBeenCalled();
    expect(mockFireDamage).toHaveBeenCalledTimes(1);
  });

  it('When a PC hits exactly 0 HP from damage, fireUnconsciousEvent is called', () => {
    mockUpdateState.mockClear();
    mockFireUnconscious.mockClear();
    const updateSpy = vi.fn();
    const pcCombatant: Combatant = { ...baseCombatant, type: 'pc', maxHp: 15, currentHp: 15, tempHp: 0 };
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setDamageInputs({ c1: '15' });
    });

    act(() => {
      result.current.handleHealthChange('c1', pcCombatant, true);
    });

    expect(mockFireUnconscious).toHaveBeenCalledWith({
      characterName: pcCombatant.name,
    });
  });

  it('When a PC hits 0 HP, fireDamageEvent is NOT called (unconsciousEvent takes priority)', () => {
    mockUpdateState.mockClear();
    mockFireDamage.mockClear();
    const updateSpy = vi.fn();
    const pcCombatant: Combatant = { ...baseCombatant, type: 'pc', maxHp: 15, currentHp: 15, tempHp: 0 };
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setDamageInputs({ c1: '15' });
    });

    act(() => {
      result.current.handleHealthChange('c1', pcCombatant, true);
    });

    expect(mockFireDamage).not.toHaveBeenCalled();
  });

  it('When an NPC hits 0 HP, fireUnconsciousEvent is NOT set', () => {
    mockUpdateState.mockClear();
    mockFireDamage.mockClear();
    mockFireUnconscious.mockClear();
    const updateSpy = vi.fn();
    const npcCombatant = { ...baseCombatant, maxHp: 15, currentHp: 15, tempHp: 0 };
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setDamageInputs({ c1: '15' });
    });

    act(() => {
      result.current.handleHealthChange('c1', npcCombatant, true); // baseCombatant is type 'npc'
    });

    expect(mockFireUnconscious).not.toHaveBeenCalled();
    expect(mockFireDamage).toHaveBeenCalledWith({
      combatantNames: [npcCombatant.name],
      damageAmount: 15,
      damageType: undefined,
    });
  });

  it('When a PC was already unconscious and takes damage, unconsciousEvent is NOT fired again', () => {
    mockUpdateState.mockClear();
    const updateSpy = vi.fn();
    const pcCombatant: Combatant = { ...baseCombatant, type: 'pc', characterId: 'char-1', maxHp: 15, currentHp: 0, tempHp: 0, conditions: 'unconscious' };
    mockAppState.combatState.combatants = [pcCombatant];
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      // Taking damage while at 0 hp means death saves!
      result.current.setDamageInputs({ c1: '5' });
    });

    act(() => {
      result.current.handleHealthChange('c1', pcCombatant, true);
    });

    expect(mockUpdateState).toHaveBeenCalled();
    const updater = mockUpdateState.mock.calls[0][0];
    const dummyState = {
      characters: [{ id: 'char-1', deathSavesFails: 0 }],
      combatState: {
        combatants: [{ id: 'c1', type: 'pc', characterId: 'char-1', deathSavesFails: 0, isStable: false }]
      }
    };
    const nextState = updater(dummyState as any);
    const updatedPC = nextState.combatState.combatants[0];
    expect(updatedPC.deathSavesFails).toBe(1);
    expect(updatedPC.isStable).toBe(false);
  });

  it('When applyDamage reduces HP below 0 for a PC, the combatant enters unconscious state with deathSavesFails = 0', () => {
    const updateSpy = vi.fn();
    const pcCombatant: Combatant = {
      ...baseCombatant,
      type: 'pc',
      currentHp: 10,
      tempHp: 0,
      conditions: '',
    };
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setDamageInputs({ c1: '15' });
    });

    act(() => {
      result.current.handleHealthChange('c1', pcCombatant, true);
    });

    expect(updateSpy).toHaveBeenCalledWith('c1', {
      currentHp: 0,
      tempHp: 0,
      conditions: 'Unconscious',
      deathSavesFails: 0,
      deathSavesSuccesses: 0,
      isStable: false,
    });
  });
});
