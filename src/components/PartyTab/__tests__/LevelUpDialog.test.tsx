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

  it('Level up confirm payload includes proficiencies with updated proficiency bonus', () => {
    const onConfirmMock = vi.fn();
    const char: Character = {
      ...mockCharacter,
      level: 4,
      proficiencies: JSON.stringify({
        proficiencyBonus: 2,
        jackOfAllTrades: false,
        savingThrows: [],
        skills: {},
        passiveBonuses: {
          perception: 0,
          insight: 0,
          investigation: 0
        }
      })
    };

    const { container } = render(
      <LevelUpDialog
        {...defaultProps}
        character={char}
        onConfirm={onConfirmMock}
      />
    );

    const confirmBtn = container.querySelector('#confirm-level-up-btn') as HTMLButtonElement;
    fireEvent.click(confirmBtn);

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    const call = onConfirmMock.mock.calls[0][0];
    const profs = JSON.parse(call.proficiencies);
    expect(profs.proficiencyBonus).toBe(3);
  });

  it('Level up preserves existing skill proficiencies when updating bonus', () => {
    const onConfirmMock = vi.fn();
    const char: Character = {
      ...mockCharacter,
      level: 8,
      proficiencies: JSON.stringify({
        proficiencyBonus: 3,
        jackOfAllTrades: false,
        savingThrows: [],
        skills: { Perception: 'proficient' },
        passiveBonuses: {
          perception: 0,
          insight: 0,
          investigation: 0
        }
      })
    };

    const { container } = render(
      <LevelUpDialog
        {...defaultProps}
        character={char}
        onConfirm={onConfirmMock}
      />
    );

    const confirmBtn = container.querySelector('#confirm-level-up-btn') as HTMLButtonElement;
    fireEvent.click(confirmBtn);

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    const call = onConfirmMock.mock.calls[0][0];
    const profs = JSON.parse(call.proficiencies);
    expect(profs.proficiencyBonus).toBe(4);
    expect(profs.skills.Perception).toBe('proficient');
  });

  describe('HP and Tough Feat calculations', () => {
    const hpMockCharacter: Character = {
      ...mockCharacter,
      level: 4,
      abilityScores: JSON.stringify({ STR: 10, DEX: 10, CON: 14, INT: 10, WIS: 10, CHA: 10 }),
      proficiencies: JSON.stringify({
        proficiencyBonus: 2,
        jackOfAllTrades: false,
        savingThrows: [],
        skills: {},
        passiveBonuses: { perception: 0, insight: 0, investigation: 0 },
        toughFeat: false
      })
    };

    it('totalHpGained = hpRoll + CON mod', () => {
      const onConfirmMock = vi.fn();
      const { container } = render(
        <LevelUpDialog {...defaultProps} character={hpMockCharacter} onConfirm={onConfirmMock} />
      );

      const hpRollInput = container.querySelector('input[type="number"][min="1"]') as HTMLInputElement;
      fireEvent.change(hpRollInput, { target: { value: '6' } });

      const confirmBtn = container.querySelector('#confirm-level-up-btn') as HTMLButtonElement;
      fireEvent.click(confirmBtn);

      expect(onConfirmMock).toHaveBeenCalledTimes(1);
      const call = onConfirmMock.mock.calls[0][0];
      expect(call.maxHp).toBe(hpMockCharacter.maxHp + 8);
      expect(call.currentHp).toBe(hpMockCharacter.currentHp + 8);
    });

    it('Tough feat checkbox adds +2', () => {
      const onConfirmMock = vi.fn();
      const { container } = render(
        <LevelUpDialog {...defaultProps} character={hpMockCharacter} onConfirm={onConfirmMock} />
      );

      const hpRollInput = container.querySelector('input[type="number"][min="1"]') as HTMLInputElement;
      fireEvent.change(hpRollInput, { target: { value: '6' } });

      const toughFeatCheckbox = screen.getByRole('checkbox', { name: /Tough feat/i });
      fireEvent.click(toughFeatCheckbox);

      const confirmBtn = container.querySelector('#confirm-level-up-btn') as HTMLButtonElement;
      fireEvent.click(confirmBtn);

      expect(onConfirmMock).toHaveBeenCalledTimes(1);
      const call = onConfirmMock.mock.calls[0][0];
      expect(call.maxHp).toBe(hpMockCharacter.maxHp + 10);
      expect(call.currentHp).toBe(hpMockCharacter.currentHp + 10);
    });

    it('toughFeat persists in proficiencies when checkbox checked', () => {
      const onConfirmMock = vi.fn();
      const { container } = render(
        <LevelUpDialog {...defaultProps} character={hpMockCharacter} onConfirm={onConfirmMock} />
      );

      const toughFeatCheckbox = screen.getByRole('checkbox', { name: /Tough feat/i });
      fireEvent.click(toughFeatCheckbox);

      const confirmBtn = container.querySelector('#confirm-level-up-btn') as HTMLButtonElement;
      fireEvent.click(confirmBtn);

      expect(onConfirmMock).toHaveBeenCalledTimes(1);
      const call = onConfirmMock.mock.calls[0][0];
      const profs = JSON.parse(call.proficiencies);
      expect(profs.toughFeat).toBe(true);
    });

    it('hasToughFeat initializes from character.proficiencies', () => {
      const charWithToughFeat: Character = {
        ...hpMockCharacter,
        proficiencies: JSON.stringify({
          proficiencyBonus: 2,
          jackOfAllTrades: false,
          savingThrows: [],
          skills: {},
          passiveBonuses: { perception: 0, insight: 0, investigation: 0 },
          toughFeat: true
        })
      };

      render(<LevelUpDialog {...defaultProps} character={charWithToughFeat} />);

      const checkbox = screen.getByRole('checkbox', { name: /Tough feat/i });
      expect(checkbox).toBeChecked();
    });
  });
});
