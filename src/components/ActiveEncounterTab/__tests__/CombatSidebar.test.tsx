// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CombatSidebar } from '../CombatSidebar';
import type { Combatant, NPC, Character } from '../../../types';

vi.mock('../../ui/IrvMultiSelect', () => ({
  IrvMultiSelect: ({ label, value, onChange }: any) => (
    <div>
      <label>{label}</label>
      <input 
        data-testid={`mock-irv-${label}`}
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
      />
    </div>
  )
}));

describe('CombatSidebar', () => {
  afterEach(() => cleanup());
  const npcs: NPC[] = [{ id: 'n1', name: 'Goblin', ac: 15, maxHp: 7, currentHp: 7, tempHp: 0, conditions: '', notes: '' }];
  const characters: Character[] = [{ id: 'p1', playerName: 'P1', characterName: 'Char1', ac: 16, maxHp: 20, currentHp: 20, tempHp: 0, conditions: '', passivePerception: 12, isActive: true, level: 1, statusId: 1, statusName: 'Active', notes: '' }];
  const combatants: Combatant[] = [];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    npcs,
    characters,
    onAddPreset: vi.fn(),
    onAddNpc: vi.fn(),
  };

  it('The NPC and Player type toggle buttons are rendered', () => {
    render(<CombatSidebar {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'NPC' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Player' })).toBeDefined();
  });

  it('Switching to Player type hides the quantity input', () => {
    render(<CombatSidebar {...defaultProps} />);
    const playerBtn = screen.getByRole('button', { name: 'Player' });
    fireEvent.click(playerBtn);
    expect(screen.queryByText('Quantity')).toBeNull();
  });

  it('Switching to NPC type shows the quantity input', () => {
    render(<CombatSidebar {...defaultProps} />);
    const npcBtn = screen.getByRole('button', { name: 'NPC' });
    fireEvent.click(npcBtn);
    // NPC is default anyway, so it should be visible
    expect(screen.getByText('Quantity')).toBeDefined();
  });

  it('Submitting the preset form with no selection does not call onAddPreset', async () => {
    const onAddPreset = vi.fn();
    render(<CombatSidebar {...defaultProps} onAddPreset={onAddPreset} />);
    const addBtn = screen.getByRole('button', { name: '+ Add to Encounter' });
    fireEvent.click(addBtn);
    expect(onAddPreset).not.toHaveBeenCalled();
  });

  it('The Add New NPC form requires name and HP before submitting', async () => {
    const onAddNpc = vi.fn();
    render(<CombatSidebar {...defaultProps} onAddNpc={onAddNpc} />);
    
    const submitBtn = screen.getByRole('button', { name: '+ Add NPC' });
    fireEvent.click(submitBtn);
    expect(onAddNpc).not.toHaveBeenCalled();
    
    // Fill in values
    const nameInput = screen.getByPlaceholderText('e.g. Goblin Archer');
    const hpLabelBase = screen.getByText('HP', { selector: 'label' });
    const hpInput = hpLabelBase.parentElement?.querySelector('input[type="number"]') as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'Test Npc' } });
    fireEvent.change(hpInput, { target: { value: '20' } });
    fireEvent.click(submitBtn);

    expect(onAddNpc).toHaveBeenCalledWith('Test Npc', 20, '', '', '', '', '');
  });

  it('Submitting Add New NPC form handles IRV fields', async () => {
    const onAddNpc = vi.fn();
    render(<CombatSidebar {...defaultProps} onAddNpc={onAddNpc} />);
    
    const submitBtn = screen.getByRole('button', { name: '+ Add NPC' });
    
    fireEvent.change(screen.getByPlaceholderText('e.g. Goblin Archer'), { target: { value: 'Dragon' } });
    const hpLabelBase = screen.getByText('HP', { selector: 'label' });
    const hpInput = hpLabelBase.parentElement?.querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(hpInput, { target: { value: '100' } });
    
    // Use labels to find IRV fields
    const resInput = screen.getByTestId('mock-irv-Resistances');
    const immInput = screen.getByTestId('mock-irv-Immunities');
    const vulInput = screen.getByTestId('mock-irv-Vulnerabilities');

    fireEvent.change(resInput, { target: { value: 'fire' } });
    fireEvent.change(immInput, { target: { value: 'poison' } });
    fireEvent.change(vulInput, { target: { value: 'cold' } });

    fireEvent.click(submitBtn);

    expect(onAddNpc).toHaveBeenCalledWith('Dragon', 100, '', '', 'fire', 'poison', 'cold');
  });

  it('While isAddingNpc is true the submit button shows a loading state', async () => {
    let resolveAdd: any;
    const onAddNpc = vi.fn(() => new Promise<void>(res => { resolveAdd = res; }));
    
    render(<CombatSidebar {...defaultProps} onAddNpc={onAddNpc} />);
    
    fireEvent.change(screen.getByPlaceholderText('e.g. Goblin Archer'), { target: { value: 'Test Npc' } });
    const hpLabelBase = screen.getByText('HP', { selector: 'label' });
    const hpInput = hpLabelBase.parentElement?.querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(hpInput, { target: { value: '20' } });
    
    const submitBtn = screen.getByRole('button', { name: '+ Add NPC' });
    fireEvent.click(submitBtn);

    expect(screen.getByRole('button', { name: 'Adding...' })).toBeDefined();
    
    resolveAdd();
  });

  it('Clicking the close button calls onClose', () => {
    const onClose = vi.fn();
    render(<CombatSidebar {...defaultProps} onClose={onClose} />);
    const closeBtn = screen.getByTitle('Close');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
