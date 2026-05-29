import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CasterAttributionDialog } from '../CasterAttributionDialog';
import { Combatant } from '../../../types';

describe('CasterAttributionDialog', () => {
  afterEach(cleanup);

  const mockCombatants: Combatant[] = [
    { id: 'c1', name: 'Gandalf', type: 'pc', ac: 15, maxHp: 50, currentHp: 50, initiative: 12 } as any,
    { id: 'c2', name: 'Goblin', type: 'npc', ac: 12, maxHp: 15, currentHp: 15, initiative: 10 } as any,
  ];

  const defaultProps = {
    isOpen: true,
    effectName: 'Hasted',
    targetName: 'Bilbo',
    combatants: mockCombatants,
    onSelect: vi.fn(),
    onDismiss: vi.fn(),
  };

  it('renders list of combatant names when open', () => {
    render(<CasterAttributionDialog {...defaultProps} />);
    
    expect(screen.getByText('Who is concentrating on Hasted?')).toBeDefined();
    expect(screen.getByText('Bilbo')).toBeDefined();
    expect(screen.getByText('Gandalf')).toBeDefined();
    expect(screen.getByText('Goblin')).toBeDefined();
    expect(screen.getByText('PC')).toBeDefined();
    expect(screen.getByText('NPC')).toBeDefined();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<CasterAttributionDialog {...defaultProps} isOpen={false} />);
    expect(container.textContent).toBe('');
  });

  it('clicking a combatant calls onSelect with correct id', () => {
    const onSelect = vi.fn();
    render(<CasterAttributionDialog {...defaultProps} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Gandalf'));
    expect(onSelect).toHaveBeenCalledWith('c1');
  });

  it('dismiss button calls onDismiss', () => {
    const onDismiss = vi.fn();
    render(<CasterAttributionDialog {...defaultProps} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByText('Dismiss (already applied)'));
    expect(onDismiss).toHaveBeenCalled();
  });
});
