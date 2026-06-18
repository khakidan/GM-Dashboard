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
  };

  const defaultProps = {
    character: defaultCharacter,
    isSyncing: false,
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
  };

  it('renders the class input field with its value', () => {
    render(<CharacterCardExpanded {...defaultProps} />);
    const classInput = screen.getByPlaceholderText('e.g. Barbarian or Barbarian / Fighter') as HTMLInputElement;
    expect(classInput).toBeDefined();
    expect(classInput.value).toBe('Paladin');
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
});
