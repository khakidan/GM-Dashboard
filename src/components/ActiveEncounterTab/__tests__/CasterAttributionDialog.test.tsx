import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CasterAttributionDialog } from '../CasterAttributionDialog';
import { Combatant } from '../../../types';

describe('CasterAttributionDialog', () => {
  afterEach(cleanup);

  const mockCombatants: Combatant[] = [
    { id: 'c1', name: 'Gandalf', type: 'pc', ac: 15, maxHp: 50, currentHp: 50, initiative: 12 } as any,
  ];

  const defaultProps = {
    isOpen: true,
    effectName: 'Hasted',
    targetName: 'Bilbo',
    combatants: mockCombatants,
    onSelect: vi.fn(),
    onDismiss: vi.fn(),
  };

  it('renders the list of combatant names and calls onSelect with the correct id when clicked', () => {
    const onSelect = vi.fn();
    render(<CasterAttributionDialog {...defaultProps} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Gandalf'));
    expect(onSelect).toHaveBeenCalledWith('c1');
  });
});
