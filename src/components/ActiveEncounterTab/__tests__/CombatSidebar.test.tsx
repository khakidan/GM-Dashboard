import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CombatSidebar } from '../CombatSidebar';
import type { Combatant, NPC, Character } from '../../../types';

describe('CombatSidebar', () => {
  afterEach(() => cleanup());
  const npcs: NPC[] = [{ id: 'n1', name: 'Goblin', ac: 15, maxHp: 7, currentHp: 7, tempHp: 0, conditions: '', notes: '' }];
  const characters: Character[] = [{ id: 'p1', playerName: 'P1', characterName: 'Char1', ac: 16, maxHp: 20, currentHp: 20, tempHp: 0, conditions: '', passivePerception: 12, isActive: true, level: 1, statusId: 1, statusName: 'Active', notes: '' }];
  const combatants: Combatant[] = [];

  const defaultProps = {
    isSidebarOpen: true,
    npcs,
    characters,
    combatants,
    activeTurnId: null,
    onAddPreset: vi.fn(),
    onAddNpc: vi.fn(),
    onCustomAction: vi.fn(),
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
    
    const submitBtn = screen.getByRole('button', { name: '+ Add to Combat' });
    fireEvent.click(submitBtn);
    expect(onAddNpc).not.toHaveBeenCalled();
    
    // Fill in values
    const nameInput = screen.getByPlaceholderText('e.g. Goblin Archer');
    const hpLabelBase = screen.getByText('HP', { selector: 'label' });
    // Next input sibling or by container
    const hpInput = hpLabelBase.parentElement?.querySelector('input[type="number"]') as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'Test Npc' } });
    fireEvent.change(hpInput, { target: { value: '20' } });
    fireEvent.click(submitBtn);

    expect(onAddNpc).toHaveBeenCalledWith('Test Npc', 20, '', '');
  });

  it('While isAddingNpc is true the submit button shows a loading state', async () => {
    // Setup a delayed promise
    let resolveAdd: any;
    const onAddNpc = vi.fn(() => new Promise<void>(res => { resolveAdd = res; }));
    
    render(<CombatSidebar {...defaultProps} onAddNpc={onAddNpc} />);
    
    const nameInput = screen.getByPlaceholderText('e.g. Goblin Archer');
    const hpLabelBase = screen.getByText('HP', { selector: 'label' });
    const hpInput = hpLabelBase.parentElement?.querySelector('input[type="number"]') as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'Test Npc' } });
    fireEvent.change(hpInput, { target: { value: '20' } });
    
    const submitBtn = screen.getByRole('button', { name: '+ Add to Combat' });
    fireEvent.click(submitBtn);

    expect(screen.getByRole('button', { name: 'Adding...' })).toBeDefined();
    
    resolveAdd();
  });
});
