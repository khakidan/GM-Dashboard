import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { CombatantCard } from '../CombatantCard';
import { useDashboardStore } from '../../../hooks/dashboardStore';
import { makeCombatant } from '../../../test-utils/fixtures/combatantFixtures';

vi.mock('../../../services/dbOperations', () => ({
  updateCharacterDB: vi.fn(),
  updateNpcInstanceConditionsDB: vi.fn(),
  updateInitiativeDB: vi.fn(),
  updateDeathSavesDB: vi.fn(),
  updateEncounterStateDB: vi.fn(),
}));

describe('CombatantCard — combatStarted behavior', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const combatant = makeCombatant({ id: 'c1', name: 'Aria', type: 'pc' });

  const defaultProps = {
    c: combatant,
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
  };

  beforeEach(() => {
    useDashboardStore.setState({
      combatState: {
        activeTurnId: 'c1',
        combatants: [combatant],
        selectedIds: [],
        isSelectionMode: false,
        syncingIds: [],
        expandedIds: [],
      } as any
    });
  });

  it('TEST 3.1 — Active turn indicator is hidden before combatStarted is true', () => {
    render(<CombatantCard {...defaultProps} />);
    
    // The "Active" badge should NOT be present
    expect(screen.queryByText(/Active/i)).not.toBeInTheDocument();
    
    // The card should NOT have the active turn highlight classes
    const card = document.getElementById(`combatant-card-${combatant.id}`);
    expect(card).not.toHaveClass('border-2');
    expect(card).not.toHaveClass('border-[#2563eb]');
  });

  it('TEST 3.2 — Active turn indicator is visible after combatStarted is true', () => {
    render(<CombatantCard {...defaultProps} combatStarted={true} />);
    
    // The "Active" badge SHOULD be present
    expect(screen.getByText(/Active/i)).toBeInTheDocument();
    
    // The card SHOULD have the active turn highlight classes
    const card = document.getElementById(`combatant-card-${combatant.id}`);
    expect(card).toHaveClass('border-2');
    expect(card).toHaveClass('border-[#2563eb]');
  });
});
