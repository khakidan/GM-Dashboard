import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { CombatantCard } from '../CombatantCard';
import type { Combatant } from '../../../types';
import { makeCombatant } from '../../../test-utils/fixtures/combatantFixtures';

vi.mock('../../../services/dbOperations', () => ({
  updateCharacterDB: vi.fn(),
  updateNpcInstanceConditionsDB: vi.fn(),
  updateInitiativeDB: vi.fn(),
  updateDeathSavesDB: vi.fn(),
  updateEncounterStateDB: vi.fn(),
}));

describe('CombatantCard', () => {
  afterEach(() => cleanup());

  const defaultProps = {
    c: makeCombatant({ id: 'pc1', type: 'pc', name: 'PC' }),
    isExpanded: false,
    damageInput: '',
    healInput: '',
    currentRound: 1,
    combatStarted: false,
    onDamageInputChange: vi.fn(),
    onHealInputChange: vi.fn(),
    onHealthSubmit: vi.fn(),
    onToggleExpand: vi.fn(),
    onUpdateCombatant: vi.fn(),
    onRemoveCombatant: vi.fn(),
    onToggleSelect: vi.fn(),
  };

  it('renders without crashing for a PC combatant', () => {
    const { container } = render(<CombatantCard {...defaultProps} />);
    expect(screen.getByText('PC')).toBeInTheDocument();
  });

  it('renders without crashing for an NPC combatant', () => {
    const props = { ...defaultProps, c: makeCombatant({ id: 'npc1', type: 'npc', name: 'NPC' }) };
    const { container } = render(<CombatantCard {...props} />);
    expect(screen.getByText('NPC')).toBeInTheDocument();
  });

  it('clicking DMG button calls onHealthSubmit with isDamage: true', () => {
    const onHealthSubmit = vi.fn();
    render(<CombatantCard {...defaultProps} damageInput="10" onHealthSubmit={onHealthSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /DMG/i }));
    expect(onHealthSubmit).toHaveBeenCalledWith(true, expect.any(Object));
  });

  it('clicking HEAL button calls onHealthSubmit with isDamage: false', () => {
    const onHealthSubmit = vi.fn();
    render(<CombatantCard {...defaultProps} healInput="5" onHealthSubmit={onHealthSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /HEAL/i }));
    expect(onHealthSubmit).toHaveBeenCalledWith(false, expect.any(Object));
  });
});
