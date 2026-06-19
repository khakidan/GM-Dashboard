import '@testing-library/jest-dom/vitest';
// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

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
        campaignName: 'Test Campaign',
        hasInitialSynced: true,
        characters: [],
        encounters: [],
        npcs: [],
        encounterCombatants: [],
        difficulties: {},
        statuses: {},
        combatState: {
          activeEncounterId: null,
          combatants: [],
          activeTurnId: null,
          round: 1,
          concentrationLinks: {},
        },
      },
      updateState: vi.fn(),
      getSnapshot: vi.fn(),
    } as any);

    render(<NpcLibraryTab />);

    expect(screen.getByText(/No NPCs loaded in library/i)).toBeInTheDocument();
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
        campaignName: 'Test Campaign',
        hasInitialSynced: true,
        characters: [],
        encounters: [],
        npcs: mockNpcs,
        encounterCombatants: [],
        difficulties: {},
        statuses: {},
        combatState: {
          activeEncounterId: null,
          combatants: [],
          activeTurnId: null,
          round: 1,
          concentrationLinks: {},
        },
      },
      updateState: vi.fn(),
      getSnapshot: vi.fn(),
    } as any);

    render(<NpcLibraryTab />);

    // Check goblin info (Collapsed state)
    expect(screen.getByDisplayValue('Goblin Scout')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument(); // AC
    expect(screen.getByText('15/15')).toBeInTheDocument(); // HP

    // Check Orc info
    expect(screen.getByDisplayValue('Orc Warrior')).toBeInTheDocument();
    expect(screen.getByText('20/30')).toBeInTheDocument(); // HP

    // Test Search
    const searchInput = screen.getByPlaceholderText(/Search by name.../i);
    fireEvent.change(searchInput, { target: { value: 'Goblin' } });
    
    expect(screen.getByDisplayValue('Goblin Scout')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Orc Warrior')).toBeNull();

    // Test Filter by Resistance
    fireEvent.change(searchInput, { target: { value: '' } }); // Clear search
    const resInput = screen.getByRole('combobox', { name: 'Resistance' });
    fireEvent.change(resInput, { target: { value: 'fire' } });
    
    expect(screen.queryByDisplayValue('Goblin Scout')).toBeNull();
    expect(screen.getByDisplayValue('Orc Warrior')).toBeInTheDocument();

    // Clear filters
    fireEvent.click(screen.getByText(/Clear Filters/i));
    expect(screen.getByDisplayValue('Goblin Scout')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Orc Warrior')).toBeInTheDocument();
  });
});
