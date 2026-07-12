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
    expect(screen.getByText('Level Up Wizard')).toBeInTheDocument();
  });

  it('resource pools section shows suggested pool names when character has a class with pools', () => {
    vi.mocked(getResourcePoolSuggestions).mockReturnValue([
      { name: 'Rage', suggestedMax: 3, reset: 'long', isNew: false }
    ]);

    const charWithPools = {
      ...defaultProps.character,
      class: 'Barbarian',
      level: 4,
      resourcePools: '[]',
    };

    render(
      <LevelUpDialog
        {...defaultProps}
        character={charWithPools}
        isOpen={true}
      />
    );

    // The pool name should be visible in the rendered dialog
    expect(
      screen.getByText('Rage')
    ).toBeInTheDocument();
  });

  it('onConfirm payload contains correct resourcePools JSON with pool name and max value', async () => {
    vi.mocked(getResourcePoolSuggestions).mockReturnValue([
      { name: 'Rage', suggestedMax: 3, reset: 'long', isNew: false }
    ]);

    const charWithPools = {
      ...defaultProps.character,
      class: 'Barbarian',
      level: 4,
      resourcePools: '[]',
    };
    const onConfirmMock = vi.fn();

    const { container } = render(
      <LevelUpDialog
        {...defaultProps}
        character={charWithPools}
        isOpen={true}
        onConfirm={onConfirmMock}
      />
    );

    const confirmBtn = container.querySelector(
      '#confirm-level-up-btn'
    ) as HTMLButtonElement;
    fireEvent.click(confirmBtn);

    expect(onConfirmMock).toHaveBeenCalled();
    const call =
      onConfirmMock.mock.calls[0][0];

    // resourcePools should be a JSON string containing Rage
    const pools = JSON.parse(
      call.resourcePools
    );
    expect(pools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Rage',
        })
      ])
    );
  });

  it('pool suggestions from getResourcePoolSuggestions are rendered in the dialog', () => {
    vi.mocked(getResourcePoolSuggestions).mockReturnValue([
      { name: 'Rage', suggestedMax: 3, reset: 'long', isNew: false }
    ]);

    const charWithPools = {
      ...defaultProps.character,
      class: 'Barbarian',
      level: 4,
      resourcePools: '[]',
    };

    render(
      <LevelUpDialog
        {...defaultProps}
        character={charWithPools}
        isOpen={true}
      />
    );

    // Verify the resource pools heading and the Rage pool row are visible
    expect(
      screen.getByText('Resource Pools')
    ).toBeInTheDocument();

    // The pool input should exist with the correct suggested max value
    // for a Barbarian leveling to 5 (Rage max at level 5 = 3)
    const rageInput = document.getElementById(
      'pool-input-rage'
    ) as HTMLInputElement;
    expect(rageInput).not.toBeNull();
    expect(rageInput.value).toBe('3');
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

  it('GM-edited pool max value is serialized into resourcePools on confirm', () => {
    // Override the mock to return a Rage suggestion for this test
    vi.mocked(getResourcePoolSuggestions).mockReturnValueOnce([{
      name: 'Rage',
      suggestedMax: 3,
      reset: 'long',
      isNew: false,
      isAutoDerived: true,
    }] as any);

    const onConfirmMock = vi.fn();
    const charWithPools = {
      ...defaultProps.character,
      class: 'Barbarian',
      level: 4,
      resourcePools: '[]',
    };

    const { container } = render(
      <LevelUpDialog
        {...defaultProps}
        character={charWithPools}
        isOpen={true}
        onConfirm={onConfirmMock}
      />
    );

    // Find the Rage max input by its id
    const rageInput = container.querySelector('#pool-input-rage') as HTMLInputElement;
    expect(rageInput).not.toBeNull();

    // GM changes the max value to 5
    fireEvent.change(rageInput, {
      target: { value: '5' }
    });

    // Confirm
    const confirmBtn = container.querySelector('#confirm-level-up-btn') as HTMLButtonElement;
    fireEvent.click(confirmBtn);

    expect(onConfirmMock).toHaveBeenCalled();
    const call = onConfirmMock.mock.calls[0][0];
    const pools = JSON.parse(call.resourcePools);

    // Pool should contain Rage with the GM-edited max of 5
    expect(pools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Rage',
          max: 5,
        })
      ])
    );
  });

  it('new pool with include unchecked is excluded from resourcePools on confirm', () => {
    // Return a new pool suggestion (isNew: true means it has the include checkbox)
    vi.mocked(getResourcePoolSuggestions).mockReturnValueOnce([{
      name: 'Rage',
      suggestedMax: 3,
      reset: 'long',
      isNew: true,
      isAutoDerived: true,
    }] as any);

    const onConfirmMock = vi.fn();
    const charWithPools = {
      ...defaultProps.character,
      class: 'Barbarian',
      level: 4,
      resourcePools: '[]',
    };

    const { container } = render(
      <LevelUpDialog
        {...defaultProps}
        character={charWithPools}
        isOpen={true}
        onConfirm={onConfirmMock}
      />
    );

    // Find and uncheck the include checkbox for Rage
    const rageCheckbox = container.querySelector('#pool-checkbox-rage') as HTMLInputElement;
    expect(rageCheckbox).not.toBeNull();

    // Uncheck it (it starts checked because include defaults to true when suggestedMax > 0)
    fireEvent.click(rageCheckbox);

    // Confirm
    const confirmBtn = container.querySelector('#confirm-level-up-btn') as HTMLButtonElement;
    fireEvent.click(confirmBtn);

    expect(onConfirmMock).toHaveBeenCalled();
    const call = onConfirmMock.mock.calls[0][0];
    const pools = JSON.parse(call.resourcePools);

    // Rage should NOT be in the payload because the GM unchecked it
    const ragePool = pools.find((p: any) => p.name === 'Rage');
    expect(ragePool).toBeUndefined();
  });

  it('existing pool is included in resourcePools payload when include is checked', () => {
    vi.mocked(getResourcePoolSuggestions).mockReturnValueOnce([{
      name: 'Rage',
      suggestedMax: 3,
      reset: 'long',
      isNew: false,
      isAutoDerived: true,
    }] as any);

    const onConfirmMock = vi.fn();
    const charWithPools = {
      ...defaultProps.character,
      class: 'Barbarian',
      level: 4,
      resourcePools: JSON.stringify([{
        name: 'Rage',
        current: 2,
        max: 2,
        reset: 'long',
      }]),
    };

    const { container } = render(
      <LevelUpDialog
        {...defaultProps}
        character={charWithPools}
        isOpen={true}
        onConfirm={onConfirmMock}
      />
    );

    const confirmBtn = container.querySelector('#confirm-level-up-btn') as HTMLButtonElement;
    fireEvent.click(confirmBtn);

    expect(onConfirmMock).toHaveBeenCalled();
    const call = onConfirmMock.mock.calls[0][0];
    const pools = JSON.parse(call.resourcePools);

    expect(pools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Rage',
          max: 3,
        })
      ])
    );
  });

  describe('Jack of All Trades auto-check', () => {
    it('auto-checks jackOfAllTrades when a Bard levels from 1 to 2', () => {
      const onConfirmMock = vi.fn();
      const bardChar: Character = {
        ...mockCharacter,
        class: 'Bard',
        level: 1,
        proficiencies: JSON.stringify({
          proficiencyBonus: 2,
          jackOfAllTrades: false,
          savingThrows: [],
          skills: {},
          passiveBonuses: { perception: 0, insight: 0, investigation: 0 }
        })
      };

      const { container } = render(
        <LevelUpDialog
          {...defaultProps}
          character={bardChar}
          isOpen={true}
          onConfirm={onConfirmMock}
        />
      );

      // Verify checkbox is rendered and checked by the auto-check logic
      const checkbox = screen.getByRole('checkbox', { name: /Jack of All Trades/i }) as HTMLInputElement;
      expect(checkbox).toBeChecked();

      const confirmBtn = container.querySelector('#confirm-level-up-btn') as HTMLButtonElement;
      fireEvent.click(confirmBtn);

      expect(onConfirmMock).toHaveBeenCalledTimes(1);
      const call = onConfirmMock.mock.calls[0][0];
      const profs = JSON.parse(call.proficiencies);
      expect(profs.jackOfAllTrades).toBe(true);
    });

    it('does NOT auto-set jackOfAllTrades when a non-Bard class levels from 1 to 2', () => {
      const onConfirmMock = vi.fn();
      const nonBardChar: Character = {
        ...mockCharacter,
        class: 'Fighter',
        level: 1,
        proficiencies: JSON.stringify({
          proficiencyBonus: 2,
          jackOfAllTrades: false,
          savingThrows: [],
          skills: {},
          passiveBonuses: { perception: 0, insight: 0, investigation: 0 }
        })
      };

      const { container } = render(
        <LevelUpDialog
          {...defaultProps}
          character={nonBardChar}
          isOpen={true}
          onConfirm={onConfirmMock}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /Jack of All Trades/i }) as HTMLInputElement;
      expect(checkbox).not.toBeChecked();

      const confirmBtn = container.querySelector('#confirm-level-up-btn') as HTMLButtonElement;
      fireEvent.click(confirmBtn);

      expect(onConfirmMock).toHaveBeenCalledTimes(1);
      const call = onConfirmMock.mock.calls[0][0];
      const profs = JSON.parse(call.proficiencies);
      expect(profs.jackOfAllTrades).toBe(false);
    });

    it('does NOT auto-set jackOfAllTrades when a Bard levels from 2 to 3', () => {
      const onConfirmMock = vi.fn();
      const bardChar: Character = {
        ...mockCharacter,
        class: 'Bard',
        level: 2,
        proficiencies: JSON.stringify({
          proficiencyBonus: 2,
          jackOfAllTrades: false,
          savingThrows: [],
          skills: {},
          passiveBonuses: { perception: 0, insight: 0, investigation: 0 }
        })
      };

      const { container } = render(
        <LevelUpDialog
          {...defaultProps}
          character={bardChar}
          isOpen={true}
          onConfirm={onConfirmMock}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /Jack of All Trades/i }) as HTMLInputElement;
      expect(checkbox).not.toBeChecked();

      const confirmBtn = container.querySelector('#confirm-level-up-btn') as HTMLButtonElement;
      fireEvent.click(confirmBtn);

      expect(onConfirmMock).toHaveBeenCalledTimes(1);
      const call = onConfirmMock.mock.calls[0][0];
      const profs = JSON.parse(call.proficiencies);
      expect(profs.jackOfAllTrades).toBe(false);
    });

    it('reflects jackOfAllTrades: false if the GM manually unchecks the box after the auto-check fires', () => {
      const onConfirmMock = vi.fn();
      const bardChar: Character = {
        ...mockCharacter,
        class: 'Bard',
        level: 1,
        proficiencies: JSON.stringify({
          proficiencyBonus: 2,
          jackOfAllTrades: false,
          savingThrows: [],
          skills: {},
          passiveBonuses: { perception: 0, insight: 0, investigation: 0 }
        })
      };

      const { container } = render(
        <LevelUpDialog
          {...defaultProps}
          character={bardChar}
          isOpen={true}
          onConfirm={onConfirmMock}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /Jack of All Trades/i }) as HTMLInputElement;
      expect(checkbox).toBeChecked();

      // Manually uncheck
      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();

      const confirmBtn = container.querySelector('#confirm-level-up-btn') as HTMLButtonElement;
      fireEvent.click(confirmBtn);

      expect(onConfirmMock).toHaveBeenCalledTimes(1);
      const call = onConfirmMock.mock.calls[0][0];
      const profs = JSON.parse(call.proficiencies);
      expect(profs.jackOfAllTrades).toBe(false);
    });

    it('auto-checks jackOfAllTrades when multiclassing into Bard and reaching Bard level 2', () => {
      const onConfirmMock = vi.fn();
      const fighterChar: Character = {
        ...mockCharacter,
        class: 'Fighter',
        level: 1,
        proficiencies: JSON.stringify({
          proficiencyBonus: 2,
          jackOfAllTrades: false,
          savingThrows: [],
          skills: {},
          passiveBonuses: { perception: 0, insight: 0, investigation: 0 }
        })
      };

      const { container } = render(
        <LevelUpDialog
          {...defaultProps}
          character={fighterChar}
          isOpen={true}
          onConfirm={onConfirmMock}
        />
      );

      // Select multiclass radio button
      const multiclassRadio = container.querySelector('#multiclass-radio-btn') as HTMLInputElement;
      expect(multiclassRadio).not.toBeNull();
      fireEvent.click(multiclassRadio);

      // Set new class name to Bard
      const classNameInput = container.querySelector('#new-class-name') as HTMLInputElement;
      expect(classNameInput).not.toBeNull();
      fireEvent.change(classNameInput, { target: { value: 'Bard' } });

      // Change level to 4 (distributes Fighter 2, Bard 2)
      const levelInput = container.querySelector('#new-level-input') as HTMLInputElement;
      expect(levelInput).not.toBeNull();
      fireEvent.change(levelInput, { target: { value: '4' } });

      // Checkbox for Jack of All Trades should now be checked
      const checkbox = screen.getByRole('checkbox', { name: /Jack of All Trades/i }) as HTMLInputElement;
      expect(checkbox).toBeChecked();

      const confirmBtn = container.querySelector('#confirm-level-up-btn') as HTMLButtonElement;
      fireEvent.click(confirmBtn);

      expect(onConfirmMock).toHaveBeenCalledTimes(1);
      const call = onConfirmMock.mock.calls[0][0];
      const profs = JSON.parse(call.proficiencies);
      expect(profs.jackOfAllTrades).toBe(true);
    });

    it('does NOT auto-check jackOfAllTrades when multiclassing into Bard but only reaching Bard level 1', () => {
      const onConfirmMock = vi.fn();
      const fighterChar: Character = {
        ...mockCharacter,
        class: 'Fighter',
        level: 1,
        proficiencies: JSON.stringify({
          proficiencyBonus: 2,
          jackOfAllTrades: false,
          savingThrows: [],
          skills: {},
          passiveBonuses: { perception: 0, insight: 0, investigation: 0 }
        })
      };

      const { container } = render(
        <LevelUpDialog
          {...defaultProps}
          character={fighterChar}
          isOpen={true}
          onConfirm={onConfirmMock}
        />
      );

      // Select multiclass radio button
      const multiclassRadio = container.querySelector('#multiclass-radio-btn') as HTMLInputElement;
      expect(multiclassRadio).not.toBeNull();
      fireEvent.click(multiclassRadio);

      // Set new class name to Bard
      const classNameInput = container.querySelector('#new-class-name') as HTMLInputElement;
      expect(classNameInput).not.toBeNull();
      fireEvent.change(classNameInput, { target: { value: 'Bard' } });

      // Change level to 3 (distributes Fighter 2, Bard 1)
      const levelInput = container.querySelector('#new-level-input') as HTMLInputElement;
      expect(levelInput).not.toBeNull();
      fireEvent.change(levelInput, { target: { value: '3' } });

      // Checkbox for Jack of All Trades should NOT be checked
      const checkbox = screen.getByRole('checkbox', { name: /Jack of All Trades/i }) as HTMLInputElement;
      expect(checkbox).not.toBeChecked();

      const confirmBtn = container.querySelector('#confirm-level-up-btn') as HTMLButtonElement;
      fireEvent.click(confirmBtn);

      expect(onConfirmMock).toHaveBeenCalledTimes(1);
      const call = onConfirmMock.mock.calls[0][0];
      const profs = JSON.parse(call.proficiencies);
      expect(profs.jackOfAllTrades).toBe(false);
    });
  });
});
