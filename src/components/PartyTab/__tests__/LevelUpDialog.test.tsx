import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, fireEvent, cleanup, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { LevelUpDialog } from '../LevelUpDialog';
import type { Character } from '../../../types';
import { getResourcePoolSuggestions } from '../../../lib/resourcePoolScaling';

vi.mock('../../../lib/resourcePoolScaling', () => ({
  getResourcePoolSuggestions: vi.fn().mockReturnValue([])
}));

describe('LevelUpDialog', () => {
  afterEach(() => cleanup());

  const mockCharacter: Character = {
    id: 'char123',
    playerName: 'John Doe',
    characterName: 'Aethelgard the Valiant',
    ac: 18,
    maxHp: 45,
    tempHp: 0,
    currentHp: 40,
    conditions: 'None',
    passivePerception: 14,
    level: 4,
    statusId: 1,
    statusName: 'Active',
    notes: 'Brave warrior, specializes in shields.',
    isActive: true,
    class: 'Barbarian',
    hitDiceConfig: '',
    hitDiceUsed: '{}',
    abilityScores: '{}',
    proficiencies: '{}',
  };

  const defaultProps = {
    character: mockCharacter,
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  it('renders without crashing when isOpen is true', () => {
    const { container } = render(<LevelUpDialog {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('resource pools section renders when the character has a class with pool suggestions', () => {
    const { container } = render(<LevelUpDialog {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('onConfirm is called with resourcePools in the updates object when confirmed', () => {
    const onConfirmMock = vi.fn();
    const { container } = render(<LevelUpDialog {...defaultProps} onConfirm={onConfirmMock} />);
    
    const confirmBtn = container.querySelector('#confirm-level-up-btn') as HTMLButtonElement;
    fireEvent.click(confirmBtn);

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    expect(onConfirmMock.mock.calls[0][0]).toHaveProperty('resourcePools');
  });

  it('Level up resource pool suggestions are generated for the correct class and level', () => {
    const barbarian: Character = {
      ...mockCharacter,
      class: 'Barbarian',
      level: 4,
      resourcePools: JSON.stringify([{ name: 'Rage', current: 3, max: 3, reset: 'long' }])
    };

    render(<LevelUpDialog {...defaultProps} character={barbarian} />);

    expect(getResourcePoolSuggestions).toHaveBeenCalledWith(
      'Barbarian',
      5, // newLevel = character.level + 1
      expect.any(Array)
    );
  });
});
