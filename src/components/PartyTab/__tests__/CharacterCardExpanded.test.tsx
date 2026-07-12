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
    level: 2, // Paladin gets spellcasting at level 2
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

  it('clamps current HP to effective max HP (exhaustion-halved scenario) on blur', () => {
    const onUpdateMock = vi.fn();
    const testCharacter = {
      ...defaultCharacter,
      maxHp: 40,
      tempHpMax: 20, // effectiveMaxHp is 20
      currentHp: 17,
    };

    render(
      <CharacterCardExpanded
        {...defaultProps}
        character={testCharacter}
        onUpdate={onUpdateMock}
      />
    );

    const hpInput = screen.getByDisplayValue('17');
    expect(hpInput).toBeInTheDocument();

    // Type a value above the effective max HP (20)
    fireEvent.change(hpInput, { target: { value: '35' } });
    
    // Trigger blur to commit the value
    fireEvent.blur(hpInput);

    expect(onUpdateMock).toHaveBeenCalledWith({ currentHp: 20 });
  });
});
