import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NewPlayerDialog } from '../NewPlayerDialog';

vi.mock('../../ui/IrvMultiSelect', () => ({
  IrvMultiSelect: ({ label, value, onChange }: any) => {
    // Determine which ID to use based on label
    const idMap: Record<string, string> = {
      'Resistances': 'new-character-resistances',
      'Immunities': 'new-character-immunities',
      'Vulnerabilities': 'new-character-vulnerabilities'
    };
    return (
      <div>
        <label>{label}</label>
        <input 
          id={idMap[label]}
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
        />
      </div>
    );
  }
}));

describe('NewPlayerDialog', () => {
  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  it('renders all required fields', () => {
    const { container } = render(<NewPlayerDialog {...defaultProps} />);
    
    expect(screen.getByText('Add New Player Character')).toBeDefined();
    
    expect(container.querySelector('#new-player-name')).toBeDefined();
    expect(container.querySelector('#new-character-name')).toBeDefined();
    expect(container.querySelector('#new-character-level')).toBeDefined();
    expect(container.querySelector('#new-character-ac')).toBeDefined();
    expect(container.querySelector('#new-character-maxhp')).toBeDefined();
    expect(container.querySelector('#new-character-passive')).toBeDefined();
    expect(container.querySelector('#new-character-status')).toBeDefined();
    expect(container.querySelector('#new-character-notes')).toBeDefined();
    expect(container.querySelector('#new-character-resistances')).toBeDefined();
    expect(container.querySelector('#new-character-immunities')).toBeDefined();
    expect(container.querySelector('#new-character-vulnerabilities')).toBeDefined();
  });

  it('Confirm button is disabled when required fields are empty', () => {
    const { container } = render(<NewPlayerDialog {...defaultProps} />);
    const confirmBtn = container.querySelector('#confirm-add-character-btn') as HTMLButtonElement;
    
    // Default maxHp is 10, but names are empty
    expect(confirmBtn.disabled).toBe(true);

    // Fill names
    fireEvent.change(container.querySelector('#new-player-name')!, { target: { value: 'Matt' } });
    fireEvent.change(container.querySelector('#new-character-name')!, { target: { value: 'Caleb' } });
    
    // Now it should be enabled
    expect(confirmBtn.disabled).toBe(false);

    // Clear one
    fireEvent.change(container.querySelector('#new-player-name')!, { target: { value: '' } });
    expect(confirmBtn.disabled).toBe(true);
  });

  it('Confirm button calls onConfirm with correct data when all fields are filled', () => {
    const onConfirmMock = vi.fn();
    const { container } = render(<NewPlayerDialog {...defaultProps} onConfirm={onConfirmMock} />);
    
    fireEvent.change(container.querySelector('#new-player-name')!, { target: { value: 'Matt' } });
    fireEvent.change(container.querySelector('#new-character-name')!, { target: { value: 'Caleb' } });
    fireEvent.change(container.querySelector('#new-character-level')!, { target: { value: '3' } });
    fireEvent.change(container.querySelector('#new-character-ac')!, { target: { value: '15' } });
    fireEvent.change(container.querySelector('#new-character-maxhp')!, { target: { value: '25' } });
    fireEvent.change(container.querySelector('#new-character-passive')!, { target: { value: '12' } });
    fireEvent.change(container.querySelector('#new-character-status')!, { target: { value: '2' } }); // Inactive
    fireEvent.change(container.querySelector('#new-character-resistances')!, { target: { value: 'Fire' } });
    fireEvent.change(container.querySelector('#new-character-immunities')!, { target: { value: 'Poison' } });
    fireEvent.change(container.querySelector('#new-character-vulnerabilities')!, { target: { value: 'Cold' } });
    fireEvent.change(container.querySelector('#new-character-notes')!, { target: { value: 'A wizard.' } });

    fireEvent.click(container.querySelector('#confirm-add-character-btn')!);

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    expect(onConfirmMock).toHaveBeenCalledWith({
      playerName: 'Matt',
      characterName: 'Caleb',
      level: 3,
      ac: 15,
      maxHp: 25,
      currentHp: 25, // currentHp equals maxHp
      tempHp: 0,     // tempHp is 0
      passivePerception: 12,
      statusId: 2,
      statusName: 'Inactive',
      notes: 'A wizard.',
      resistances: 'Fire',
      immunities: 'Poison',
      vulnerabilities: 'Cold',
      conditions: '',
      isActive: false,
    });
  });

  it('Cancel button calls onClose without calling onConfirm', () => {
    const onCloseMock = vi.fn();
    const onConfirmMock = vi.fn();
    const { container } = render(
      <NewPlayerDialog {...defaultProps} onClose={onCloseMock} onConfirm={onConfirmMock} />
    );

    fireEvent.click(container.querySelector('#cancel-new-character-btn')!);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
    expect(onConfirmMock).not.toHaveBeenCalled();
  });

  it('Optional fields submit as empty strings when left blank', () => {
    const onConfirmMock = vi.fn();
    const { container } = render(<NewPlayerDialog {...defaultProps} onConfirm={onConfirmMock} />);
    
    fireEvent.change(container.querySelector('#new-player-name')!, { target: { value: 'Matt' } });
    fireEvent.change(container.querySelector('#new-character-name')!, { target: { value: 'Caleb' } });
    // Keep maxHp default 10
    
    fireEvent.click(container.querySelector('#confirm-add-character-btn')!);

    expect(onConfirmMock).toHaveBeenCalledWith(expect.objectContaining({
      notes: '',
      resistances: '',
      immunities: '',
      vulnerabilities: '',
    }));
  });

  it('currentHp in the payload equals the entered maxHp and tempHp is 0', () => {
    const onConfirmMock = vi.fn();
    const { container } = render(<NewPlayerDialog {...defaultProps} onConfirm={onConfirmMock} />);
    
    fireEvent.change(container.querySelector('#new-player-name')!, { target: { value: 'Matt' } });
    fireEvent.change(container.querySelector('#new-character-name')!, { target: { value: 'Caleb' } });
    fireEvent.change(container.querySelector('#new-character-maxhp')!, { target: { value: '50' } });
    
    fireEvent.click(container.querySelector('#confirm-add-character-btn')!);

    expect(onConfirmMock).toHaveBeenCalledWith(expect.objectContaining({
      maxHp: 50,
      currentHp: 50,
      tempHp: 0
    }));
  });
});
