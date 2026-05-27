import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NpcLibraryTab } from '../NpcLibraryTab';
import { useAppState } from '../../hooks/useAppState';

// Mock useAppState
vi.mock('../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
}));

// Mock dbOperations
vi.mock('../../services/dbOperations', () => ({
  resetNpcHpDB: vi.fn().mockResolvedValue({}),
}));

describe('NpcLibraryTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders "No NPCs loaded" message correctly when state contains no npcs', () => {
    vi.mocked(useAppState).mockReturnValue({
      state: {
        characters: [],
        encounters: [],
        npcs: [],
        encounterCombatants: [],
        combatState: {
          activeEncounterId: null,
          combatants: [],
          turnIndex: 0,
          round: 1,
        },
      },
      updateState: vi.fn(),
    });

    render(<NpcLibraryTab />);

    expect(screen.getByText(/No NPCs loaded in library/i)).toBeDefined();
    expect(screen.queryByText(/Library Content/i)).toBeNull();
  });

  it('renders a list of NPCs and supports searching', () => {
    const mockNpcs = [
      {
        id: 'npc_goblin',
        name: 'Goblin Scout',
        ac: 12,
        maxHp: 15,
        tempHp: 0,
        currentHp: 15,
        conditions: '',
        notes: 'Small and stealthy.',
        resistances: 'None',
        immunities: 'None',
        vulnerabilities: 'None',
      },
      {
        id: 'npc_orc',
        name: 'Orc Warrior',
        ac: 13,
        maxHp: 30,
        tempHp: 0,
        currentHp: 20, 
        conditions: 'Poisoned',
        notes: 'Fierce battle hardened leader.',
        resistances: 'Fire',
        immunities: 'Cold',
        vulnerabilities: 'Acid',
      },
    ];

    vi.mocked(useAppState).mockReturnValue({
      state: {
        characters: [],
        encounters: [],
        npcs: mockNpcs,
        encounterCombatants: [],
        combatState: {
          activeEncounterId: null,
          combatants: [],
          turnIndex: 0,
          round: 1,
        },
      },
      updateState: vi.fn(),
    });

    render(<NpcLibraryTab />);

    // Check goblin info (Collapsed state)
    expect(screen.getByDisplayValue('Goblin Scout')).toBeDefined();
    expect(screen.getByText('12')).toBeDefined(); // AC
    expect(screen.getByText('15/15')).toBeDefined(); // HP

    // Check Orc info
    expect(screen.getByDisplayValue('Orc Warrior')).toBeDefined();
    expect(screen.getByText('20/30')).toBeDefined(); // HP

    // Test Search
    const searchInput = screen.getByPlaceholderText(/Search by name.../i);
    fireEvent.change(searchInput, { target: { value: 'Goblin' } });
    
    expect(screen.getByDisplayValue('Goblin Scout')).toBeDefined();
    expect(screen.queryByDisplayValue('Orc Warrior')).toBeNull();

    // Test Filter by Resistance
    fireEvent.change(searchInput, { target: { value: '' } }); // Clear search
    const resInput = screen.getByRole('combobox', { name: 'Resistance' });
    fireEvent.change(resInput, { target: { value: 'fire' } });
    
    expect(screen.queryByDisplayValue('Goblin Scout')).toBeNull();
    expect(screen.getByDisplayValue('Orc Warrior')).toBeDefined();

    // Clear filters
    fireEvent.click(screen.getByText(/Clear Filters/i));
    expect(screen.getByDisplayValue('Goblin Scout')).toBeDefined();
    expect(screen.getByDisplayValue('Orc Warrior')).toBeDefined();
  });
});
