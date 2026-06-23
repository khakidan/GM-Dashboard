import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ShortRestDialog } from '../ShortRestDialog';
import { Character } from '../../../types';
import { rollDice } from '../../../lib/diceRoller';

// Mock the dice roller
vi.mock('../../../lib/diceRoller', () => ({
  parseDiceNotation: vi.fn(() => ({})),
  rollDice: vi.fn(() => ({
    total: 8,
    groups: [],
    modifier: 0,
    notation: '1d12',
    timestamp: Date.now(),
  })),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ShortRestDialog', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockCharacters: Character[] = [
    {
      id: 'char-1',
      playerName: 'Matt',
      characterName: 'Caleb',
      level: 5,
      ac: 12,
      maxHp: 30,
      currentHp: 15, // Missing HP: 15
      tempHp: 0,
      tempHpMax: 0,
      passivePerception: 13,
      statusId: 1,
      statusName: 'Active',
      notes: '',
      conditions: '',
      isActive: true,
      class: 'Wizard',
      hitDiceConfig: '5d8',
      hitDiceUsed: '{"d8":1}',
      abilityScores: '{}',
      proficiencies: '{}',
    },
    {
      id: 'char-2',
      playerName: 'Marisha',
      characterName: 'Beau',
      level: 5,
      ac: 16,
      maxHp: 45,
      currentHp: 40, // Missing HP: 5
      tempHp: 0,
      tempHpMax: 0,
      passivePerception: 14,
      statusId: 1,
      statusName: 'Active',
      notes: '',
      conditions: '',
      isActive: true,
      class: 'Monk',
      hitDiceConfig: '5d10',
      hitDiceUsed: '{"d10":0}',
      abilityScores: '{}',
      proficiencies: '{}',
    },
  ];

  const defaultProps = {
    isOpen: true,
    characters: mockCharacters,
    onConfirm: vi.fn(),
    onClose: vi.fn(),
  };

  it('All active characters are shown', () => {
    render(<ShortRestDialog {...defaultProps} />);

    expect(screen.getByText('Caleb')).toBeInTheDocument();
    expect(screen.getByText('Beau')).toBeInTheDocument();
  });

  it('Unchecked characters are excluded from the onConfirm results', () => {
    const onConfirmMock = vi.fn();
    const { container } = render(<ShortRestDialog {...defaultProps} onConfirm={onConfirmMock} />);

    // Uncheck Beau (char-2)
    const checkbox2 = container.querySelector('#short-rest-checkbox-char-2') as HTMLInputElement;
    expect(checkbox2).toBeDefined();
    fireEvent.click(checkbox2);

    const applyBtn = container.querySelector('#short-rest-apply-btn') as HTMLButtonElement;
    fireEvent.click(applyBtn);

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    // Verified that only char-1 (Caleb) is in the payload because Beau was unchecked
    const payload = onConfirmMock.mock.calls[0][0];
    expect(payload).toHaveLength(1);
    expect(payload[0].characterId).toBe('char-1');
  });

  it("HP to recover input is capped at the character's missing HP", () => {
    const { container } = render(<ShortRestDialog {...defaultProps} />);

    // Caleb (char-1) is missing 15 HP (30 max - 15 current)
    const input1 = container.querySelector('#hp-recover-input-char-1') as HTMLInputElement;
    expect(input1).toBeDefined();

    // Set to a value above 15
    fireEvent.change(input1, { target: { value: '25' } });
    // Should clamp to 15!
    expect(input1.value).toBe('15');

    // Beau (char-2) is missing 5 HP (45 max - 40 current)
    const input2 = container.querySelector('#hp-recover-input-char-2') as HTMLInputElement;
    expect(input2).toBeDefined();

    // Set to 10
    fireEvent.change(input2, { target: { value: '10' } });
    // Should clamp to 5!
    expect(input2.value).toBe('5');
  });

  it('onConfirm is called with the correct hpToAdd and newHitDiceUsed values', () => {
    const onConfirmMock = vi.fn();
    const { container } = render(<ShortRestDialog {...defaultProps} onConfirm={onConfirmMock} />);

    // Input HP to recover
    const input1 = container.querySelector('#hp-recover-input-char-1') as HTMLInputElement;
    fireEvent.change(input1, { target: { value: '10' } });

    // Spend a d8 hit die for Caleb (char-1)
    const plusBtn = container.querySelector('#btn-plus-d8-char-1') as HTMLButtonElement;
    expect(plusBtn).toBeDefined();
    fireEvent.click(plusBtn);

    // Verify spent display count
    const spendSpan = container.querySelector('#spend-count-d8-char-1');
    expect(spendSpan?.textContent).toBe('1');

    // Apply rest
    const applyBtn = container.querySelector('#short-rest-apply-btn') as HTMLButtonElement;
    fireEvent.click(applyBtn);

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    const payload = onConfirmMock.mock.calls[0][0];
    const calebResult = payload.find((x: any) => x.characterId === 'char-1');
    
    expect(calebResult.hpToAdd).toBe(10);
    // Originally had "{"d8":1}" used. We spent 1 more, so newHitDiceUsed should be "{"d8":2}"
    expect(calebResult.newHitDiceUsed).toBe('{"d8":2}');
  });

  it('Rolling a die shows a result without auto-updating the HP field', () => {
    const { container } = render(<ShortRestDialog {...defaultProps} />);

    const rollBtn = container.querySelector('#btn-roll-d8-char-1') as HTMLButtonElement;
    expect(rollBtn).toBeDefined();

    const input1 = container.querySelector('#hp-recover-input-char-1') as HTMLInputElement;
    const initialValue = input1.value; // should be "0" or empty

    fireEvent.click(rollBtn);

    // Verify that rollDice was called
    expect(rollDice).toHaveBeenCalled();

    // HP input value should NOT change automatically
    expect(input1.value).toBe(initialValue);
  });

  it('spending 2 d8s during a short rest calls spendHitDice with the correct arguments and passes result', async () => {
    // Import everything and spy on spendHitDice
    const hitDiceMod = await import('../../../lib/hitDice');
    const spendSpy = vi.spyOn(hitDiceMod, 'spendHitDice');

    const onConfirmMock = vi.fn();
    const { container } = render(<ShortRestDialog {...defaultProps} onConfirm={onConfirmMock} />);

    // Caleb (char-1) has 5d8 config and 1d8 used.
    const plusBtn = container.querySelector('#btn-plus-d8-char-1') as HTMLButtonElement;
    expect(plusBtn).toBeDefined();

    // Spend 2 d8s
    fireEvent.click(plusBtn);
    fireEvent.click(plusBtn);

    const spendSpan = container.querySelector('#spend-count-d8-char-1');
    expect(spendSpan?.textContent).toBe('2');

    // Apply rest
    const applyBtn = container.querySelector('#short-rest-apply-btn') as HTMLButtonElement;
    fireEvent.click(applyBtn);

    // Verify spy was called correctly
    expect(spendSpy).toHaveBeenCalledWith('5d8', '{"d8":1}', 8, 2);

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    const payload = onConfirmMock.mock.calls[0][0];
    const calebResult = payload.find((x: any) => x.characterId === 'char-1');
    
    // {"d8":1} plus 2 spent = {"d8":3}
    expect(calebResult.newHitDiceUsed).toBe('{"d8":3}');

    spendSpy.mockRestore();
  });
});

