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

  it('renders without crashing', () => {
    const { container } = render(<CharacterCardExpanded {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('calls onUpdate mock when class value changes', () => {
    const onUpdateMock = vi.fn();
    render(<CharacterCardExpanded {...defaultProps} onUpdate={onUpdateMock} />);
    const classInput = screen.getByPlaceholderText('e.g. Barbarian or Barbarian / Fighter') as HTMLInputElement;
    
    fireEvent.change(classInput, { target: { value: 'Paladin / Fighter' } });
    expect(classInput.value).toBe('Paladin / Fighter');

    fireEvent.blur(classInput);
    expect(onUpdateMock).toHaveBeenCalledWith({ class: 'Paladin / Fighter' });
  });

  it("when 'raging' is added to a character who has a 'Rage' resource pool, onUpdate is called with decremented resourcePools", () => {
    const onUpdateMock = vi.fn();
    const characterWithRage = {
      ...defaultCharacter,
      resourcePools: JSON.stringify([
        { name: 'Rage', current: 3, max: 3, reset: 'long' }
      ]),
    };

    render(
      <CharacterCardExpanded
        {...defaultProps}
        character={characterWithRage}
        onUpdate={onUpdateMock}
      />
    );

    const input = screen.getByPlaceholderText('Add condition or effect...');
    fireEvent.change(input, { target: { value: 'raging' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(onUpdateMock).toHaveBeenCalledWith(expect.objectContaining({
      resourcePools: JSON.stringify([
        { name: 'Rage', current: 2, max: 3, reset: 'long' }
      ]),
    }));
  });

  it("when 'raging' is added to a character with no 'Rage' resource pool, onUpdate is NOT called for resourcePools", () => {
    const onUpdateMock = vi.fn();
    const characterNoRage = {
      ...defaultCharacter,
      resourcePools: JSON.stringify([
        { name: 'Ki', current: 2, max: 4, reset: 'short' }
      ]),
    };

    render(
      <CharacterCardExpanded
        {...defaultProps}
        character={characterNoRage}
        onUpdate={onUpdateMock}
      />
    );

    const input = screen.getByPlaceholderText('Add condition or effect...');
    fireEvent.change(input, { target: { value: 'raging' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    onUpdateMock.mock.calls.forEach(([args]) => {
      expect(args.resourcePools).toBeUndefined();
    });
  });

  it("when 'blinded' is added, onUpdate is NOT called for resourcePools", () => {
    const onUpdateMock = vi.fn();
    const characterWithRage = {
      ...defaultCharacter,
      resourcePools: JSON.stringify([
        { name: 'Rage', current: 3, max: 3, reset: 'long' }
      ]),
    };

    render(
      <CharacterCardExpanded
        {...defaultProps}
        character={characterWithRage}
        onUpdate={onUpdateMock}
      />
    );

    const input = screen.getByPlaceholderText('Add condition or effect...');
    fireEvent.change(input, { target: { value: 'blinded' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    onUpdateMock.mock.calls.forEach(([args]) => {
      expect(args.resourcePools).toBeUndefined();
    });
  });

  it("when 'raging' is added and Rage pool is already at 0, onUpdate is NOT called for resourcePools", () => {
    const onUpdateMock = vi.fn();
    const characterRageZero = {
      ...defaultCharacter,
      resourcePools: JSON.stringify([
        { name: 'Rage', current: 0, max: 3, reset: 'long' }
      ]),
    };

    render(
      <CharacterCardExpanded
        {...defaultProps}
        character={characterRageZero}
        onUpdate={onUpdateMock}
      />
    );

    const input = screen.getByPlaceholderText('Add condition or effect...');
    fireEvent.change(input, { target: { value: 'raging' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    onUpdateMock.mock.calls.forEach(([args]) => {
      expect(args.resourcePools).toBeUndefined();
    });
  });

  it('StatBlock renders in the expanded character card when the character has abilityScores data', () => {
    const characterWithStats = {
      ...defaultCharacter,
      abilityScores: JSON.stringify({ STR: 18, DEX: 14, CON: 16, INT: 10, WIS: 12, CHA: 8 }),
      proficiencies: JSON.stringify({
        proficiencyBonus: 3,
        jackOfAllTrades: false,
        savingThrows: ['STR', 'CON'],
        skills: { Athletics: 'proficient' },
        passiveBonuses: { perception: 0, insight: 0, investigation: 0 },
      }),
    };

    const { container } = render(
      <CharacterCardExpanded
        {...defaultProps}
        character={characterWithStats}
      />
    );

    const strInput = container.querySelector('#ability-score-str') as HTMLInputElement;
    expect(strInput).toBeDefined();
    expect(strInput?.value).toBe('18');
  });

  it('Changing an ability score via StatBlock calls handleUpdate with both abilityScores and proficiencies in the payload', () => {
    const onUpdateMock = vi.fn();
    const characterWithStats = {
      ...defaultCharacter,
      abilityScores: JSON.stringify({ STR: 18, DEX: 14, CON: 16, INT: 10, WIS: 12, CHA: 8 }),
      proficiencies: JSON.stringify({
        proficiencyBonus: 3,
        jackOfAllTrades: false,
        savingThrows: ['STR', 'CON'],
        skills: { Athletics: 'proficient' },
        passiveBonuses: { perception: 0, insight: 0, investigation: 0 },
      }),
    };

    const { container } = render(
      <CharacterCardExpanded
        {...defaultProps}
        character={characterWithStats}
        onUpdate={onUpdateMock}
      />
    );

    const strInput = container.querySelector('#ability-score-str') as HTMLInputElement;
    expect(strInput).toBeDefined();
    
    fireEvent.change(strInput!, { target: { value: '20' } });
    fireEvent.blur(strInput!);

    expect(onUpdateMock).toHaveBeenCalledWith(expect.objectContaining({
      abilityScores: expect.stringContaining('"STR":20'),
      proficiencies: expect.any(String),
    }));
  });
});
