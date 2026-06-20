import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CombatSidebar } from '../CombatSidebar';
import type { NPC, Character } from '../../../types';

describe('CombatSidebar', () => {
  afterEach(() => cleanup());
  const npcs: NPC[] = [{ id: 'n1', name: 'Goblin', ac: 15, maxHp: 7, currentHp: 7, tempHp: 0, conditions: '', notes: '' }];
  const characters: Character[] = [{ id: 'p1', playerName: 'P1', characterName: 'Char1', ac: 16, maxHp: 20, currentHp: 20, tempHp: 0, conditions: '', passivePerception: 12, isActive: true, level: 1, statusId: 1, statusName: 'Active', notes: '', class: '', hitDiceConfig: '', hitDiceUsed: '{}' }];
  
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
});
