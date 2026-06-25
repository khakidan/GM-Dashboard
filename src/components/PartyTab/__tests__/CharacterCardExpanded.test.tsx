import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CharacterCardExpanded } from '../CharacterCardExpanded';

describe('CharacterCardExpanded', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const defaultCharacter = {
    id: 'pc-1',
    playerName: 'Alice',
    characterName: 'Thor',
    ac: 15,
    maxHp: 20,
    tempHp: 0,
    currentHp: 20,
    conditions: '',
    passivePerception: 14,
    level: 1,
    statusId: 1,
    statusName: 'Active',
    notes: '',
    isActive: true,
    class: 'Paladin',
    hitDiceConfig: '1d10',
    hitDiceUsed: '{}',
    abilityScores: '{}',
    proficiencies: '{}',
  };

  const defaultProps = {
    character: defaultCharacter,
    isSyncing: false,
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
  };

  it('renders without crashing with full character data', () => {
    const { container } = render(<CharacterCardExpanded {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('spellcasting override change calls onUpdate with both proficiencies and spellcastingAbility fields', () => {
    const onUpdateMock = vi.fn();
    render(<CharacterCardExpanded {...defaultProps} onUpdate={onUpdateMock} />);
    
    const select = screen.getByRole('combobox', { name: /Spellcasting Stat Override/i });
    fireEvent.change(select, { target: { value: 'WIS' } });

    expect(onUpdateMock).toHaveBeenCalledWith(expect.objectContaining({
      proficiencies: expect.any(String),
      spellcastingAbility: 'WIS'
    }));
  });
});
