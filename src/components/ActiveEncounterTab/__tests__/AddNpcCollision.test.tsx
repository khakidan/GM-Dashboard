// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ActiveEncounterTab } from '../index';
import { useAppState } from '../../../hooks/useAppState';
import { MemoryRouter } from 'react-router-dom';
import { buildCombatantsFromState } from '../../../lib/combatantBuilder';

// Mock the dependencies
vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn(),
}));

vi.mock('../../../services/dbOperations', () => ({
  addNpcDB: vi.fn().mockResolvedValue({ id: 'new-npc-id' }),
  addEncounterCombatantDB: vi.fn().mockResolvedValue({ id: 'new-ec-id' }),
  updateInitiativeDB: vi.fn().mockResolvedValue({ success: true }),
}));

describe('ActiveEncounterTab ID Uniqueness', () => {
  const mockUpdateState = vi.fn();
  const mockState = {
    encounters: [{ id: 'enc1', name: 'Test Encounter', status: 'active' }],
    combatState: {
      activeEncounterId: 'enc1',
      combatants: [],
      round: 1,
      activeTurnId: null,
    },
    npcs: [{ id: 'npc1', name: 'Goblin', ac: 12, maxHp: 7, currentHp: 7, tempHp: 0, conditions: '', notes: '' }],
    characters: [],
    encounterCombatants: [],
    difficulties: { 1: 'Easy' },
  };

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppState as any).mockReturnValue({
      state: mockState,
      updateState: mockUpdateState,
    });
  });

  it('generates distinct IDs when adding multiple instances of the same NPC template', async () => {
    render(
      <MemoryRouter>
        <ActiveEncounterTab onBack={() => {}} />
      </MemoryRouter>
    );
    
    // Open the sidebar
    const toolsBtn = screen.getByRole('button', { name: /Tools/i });
    fireEvent.click(toolsBtn);

    // Select NPC preset
    fireEvent.click(screen.getByText('Goblin'));

    // Set quantity to 2
    const qtyInput = screen.getByLabelText(/How many\?/i);
    fireEvent.change(qtyInput, { target: { value: '2' } });

    // Click add
    const addBtn = screen.getByRole('button', { name: /Add to Encounter/i });
    fireEvent.click(addBtn);

    // Verify updateState was called with two distinct combatant IDs
    await waitFor(() => {
      expect(mockUpdateState).toHaveBeenCalled();
    });

    // The first call to updateState happens optimistically in handleAddPreset
    const optimisticUpdateCall = mockUpdateState.mock.calls[0][0];
    const newState = optimisticUpdateCall(mockState);
    
    const npcCombatants = newState.combatState.combatants.filter((c: any) => c.type === 'npc');
    expect(npcCombatants).toHaveLength(2);
    expect(npcCombatants[0].id).not.toBe(npcCombatants[1].id);
  });

  it('generates a collision-proof ID for manual Quick NPC Creator', async () => {
    render(
      <MemoryRouter>
        <ActiveEncounterTab onBack={() => {}} />
      </MemoryRouter>
    );
    
    // Open the sidebar
    const toolsBtn = screen.getByRole('button', { name: /Tools/i });
    fireEvent.click(toolsBtn);
    
    // Navigate to Create NPC tab
    fireEvent.click(screen.getByText('Create NPC'));

    // Fill in Quick NPC form (Name is on Identity tab)
    const nameInput = screen.getByPlaceholderText(/e.g. Ancient Red Dragon/i);
    fireEvent.change(nameInput, { target: { value: 'Custom Goblin' } });

    // Switch to Combat tab for HP and AC
    fireEvent.click(screen.getByRole('tab', { name: 'Combat' }));

    const hpInput = screen.getByLabelText(/Max HP/i);
    fireEvent.change(hpInput, { target: { value: '15' } });

    const acInput = screen.getByLabelText(/^AC\b/i);
    fireEvent.change(acInput, { target: { value: '13' } });

    // Click add
    const addBtn = screen.getByRole('button', { name: /Create & Add to Encounter/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(mockUpdateState).toHaveBeenCalled();
    });

    const optimisticUpdateCall = mockUpdateState.mock.calls[0][0];
    const newState = optimisticUpdateCall(mockState);
    
    const customNpc = newState.combatState.combatants.find((c: any) => c.name === 'Custom Goblin');
    expect(customNpc).toBeDefined();
    // Verify ID pattern includes random suffixes
    expect(customNpc.id).toMatch(/combat-npc-temp-npc-\d+-[a-z0-9]+-0-\d+-[a-z0-9]+/);
  });

  it('rebuilds combatants from state sharing the same npcId with distinct ids and names', () => {
    const mockEncounter = {
      id: 'enc1',
      name: 'Test Encounter',
      location: '',
      difficultyId: 1,
      npcDefinitions: '',
      currentRound: 1,
      activeTurnId: '',
    };

    const mockEncounterCombatants = [
      {
        id: 'ec1',
        encounterId: 'enc1',
        playerId: null,
        npcId: 'npc1',
        quantity: 1,
        initiative: 10,
        npcCurrentHp: 7,
        npcTempHp: 0,
      },
      {
        id: 'ec2',
        encounterId: 'enc1',
        playerId: null,
        npcId: 'npc1',
        quantity: 1,
        initiative: 12,
        npcCurrentHp: 7,
        npcTempHp: 0,
      }
    ];

    const mockNpcs = [
      {
        id: 'npc1',
        name: 'Goblin',
        ac: 12,
        maxHp: 7,
        currentHp: 7,
        tempHp: 0,
        conditions: '',
        notes: '',
      }
    ];

    const result = buildCombatantsFromState(mockEncounter, mockEncounterCombatants, [], mockNpcs);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('combat-npc-ec1');
    expect(result[1].id).toBe('combat-npc-ec2');
    expect(result[0].name).toBe('Goblin 1');
    expect(result[1].name).toBe('Goblin 2');
  });
});
