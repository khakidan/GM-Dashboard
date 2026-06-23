import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CombatSidebar } from '../CombatSidebar';
import type { NPC, Character } from '../../../types';

describe('CombatSidebar', () => {
  afterEach(() => cleanup());
  const npcs: NPC[] = [{ id: 'n1', name: 'Goblin', ac: 15, maxHp: 7, currentHp: 7, tempHp: 0, conditions: '', notes: '', abilityScores: '{}', proficiencies: '{}' }];
  const characters: Character[] = [{ id: 'p1', playerName: 'P1', characterName: 'Char1', ac: 16, maxHp: 20, currentHp: 20, tempHp: 0, conditions: '', passivePerception: 12, isActive: true, level: 1, statusId: 1, statusName: 'Active', notes: '', class: '', hitDiceConfig: '', hitDiceUsed: '{}', abilityScores: '{}', proficiencies: '{}' }];
  
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    npcs,
    characters,
    onAddPreset: vi.fn(),
    onAddNpc: vi.fn(),
  };

  it('renders correctly with three tabs', () => {
    render(<CombatSidebar {...defaultProps} />);
    expect(screen.getByText('Add Combatant')).toBeInTheDocument();
    expect(screen.getByText('NPC Library')).toBeInTheDocument();
    expect(screen.getByText('Party Members')).toBeInTheDocument();
    expect(screen.getByText('Create NPC')).toBeInTheDocument();
  });

  it('selects NPC Library by default', () => {
    render(<CombatSidebar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search NPCs...')).toBeInTheDocument();
  });

  it('navigates to Party Members tab', () => {
    render(<CombatSidebar {...defaultProps} />);
    fireEvent.click(screen.getByText('Party Members'));
    expect(screen.getByText('Char1')).toBeInTheDocument();
  });

  it('navigates to Create NPC tab', () => {
    render(<CombatSidebar {...defaultProps} />);
    fireEvent.click(screen.getByText('Create NPC'));
    expect(screen.getByText('Create & Add to Encounter')).toBeInTheDocument();
  });

  it('filters the NPC list based on typing in the search input', () => {
    const customNpcs: NPC[] = [
      { id: 'n1', name: 'Goblin', ac: 15, maxHp: 7, currentHp: 7, tempHp: 0, conditions: '', notes: '', abilityScores: '{}', proficiencies: '{}' },
      { id: 'n2', name: 'Orc', ac: 13, maxHp: 15, currentHp: 15, tempHp: 0, conditions: '', notes: '', abilityScores: '{}', proficiencies: '{}' }
    ];
    render(<CombatSidebar {...defaultProps} npcs={customNpcs} />);
    
    // First, verify both NPCs are rendered
    expect(screen.getByText('Goblin')).toBeInTheDocument();
    expect(screen.getByText('Orc')).toBeInTheDocument();

    // Type in search
    const searchInput = screen.getByPlaceholderText('Search NPCs...');
    fireEvent.change(searchInput, { target: { value: 'Gob' } });

    // Verify only Goblin is shown
    expect(screen.getByText('Goblin')).toBeInTheDocument();
    expect(screen.queryByText('Orc')).not.toBeInTheDocument();

    // Type something that matches nothing
    fireEvent.change(searchInput, { target: { value: 'Dragon' } });
    expect(screen.queryByText('Goblin')).not.toBeInTheDocument();
    expect(screen.queryByText('Orc')).not.toBeInTheDocument();
    expect(screen.getByText("No NPCs match 'Dragon'")).toBeInTheDocument();

    // Clear search input
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('Goblin')).toBeInTheDocument();
    expect(screen.getByText('Orc')).toBeInTheDocument();
  });

  it('handles selecting an NPC and clicking "Add to Encounter" with quantity', async () => {
    const onAddPreset = vi.fn();
    render(<CombatSidebar {...defaultProps} onAddPreset={onAddPreset} />);
    
    const addButton = screen.getByRole('button', { name: /Add to Encounter/i });
    
    // Button is disabled when no NPC is selected
    expect(addButton).toBeDisabled();

    // Select Goblin
    const goblinBtn = screen.getByText('Goblin');
    fireEvent.click(goblinBtn);

    // Button is now enabled
    expect(addButton).not.toBeDisabled();

    // Click add
    fireEvent.click(addButton);
    expect(onAddPreset).toHaveBeenCalledWith('npc', 'n1', 1);
  });

  it('displays correct interactive and disabled states for characters in party members tab', () => {
    const customCharacters: Character[] = [
      { id: 'p1', playerName: 'P1', characterName: 'Char1', ac: 16, maxHp: 20, currentHp: 20, tempHp: 0, conditions: '', passivePerception: 12, isActive: true, level: 1, statusId: 1, statusName: 'Active', notes: '', class: '', hitDiceConfig: '', hitDiceUsed: '{}', abilityScores: '{}', proficiencies: '{}' },
      { id: 'p2', playerName: 'P2', characterName: 'Char2', ac: 14, maxHp: 18, currentHp: 18, tempHp: 0, conditions: '', passivePerception: 10, isActive: true, level: 1, statusId: 1, statusName: 'Active', notes: '', class: '', hitDiceConfig: '', hitDiceUsed: '{}', abilityScores: '{}', proficiencies: '{}' }
    ];
    // Combatants list contains 'p1' (Char1) meaning they are already in the encounter
    const combatants = [
      {
        id: 'c1',
        name: 'Char1',
        characterId: 'p1',
        type: 'pc' as const,
        ac: 16,
        maxHp: 20,
        currentHp: 20,
        tempHp: 0,
        conditions: '',
        initiative: 12,
        passivePerception: 12
      }
    ];

    render(<CombatSidebar {...defaultProps} characters={customCharacters} combatants={combatants} />);
    
    // Switch to Party Members tab
    fireEvent.click(screen.getByText('Party Members'));

    // Check states: Char1 is already in, checkbox is disabled and has label
    const checkboxes = screen.getAllByRole('checkbox');
    const char1Checkbox = checkboxes[0] as HTMLInputElement;
    expect(char1Checkbox).toBeDisabled();
    expect(screen.getByText('Already in encounter')).toBeInTheDocument();

    // Char2 is NOT in, checkbox is enabled
    const char2Checkbox = checkboxes[1] as HTMLInputElement;
    expect(char2Checkbox).not.toBeDisabled();
  });
});
