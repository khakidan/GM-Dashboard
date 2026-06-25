import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, fireEvent, cleanup, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { ActiveEncounterTab } from '../index';
import { useDashboardStore } from '../../../hooks/useAppState';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../services/dbOperations', () => ({
  addNpcDB: vi.fn(),
  addEncounterCombatantDB: vi.fn(),
  updateInitiativeDB: vi.fn(),
  updateDeathSavesDB: vi.fn(),
  updateEncounterStateDB: vi.fn(),
}));

describe('KeyboardShortcuts', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const baseProps = { onBack: vi.fn() };

  beforeEach(() => {
    useDashboardStore.setState({
      campaignName: 'Shortcuts test',
      hasInitialSynced: true,
      encounters: [{ id: 'enc-1', name: 'Keyboard Encounter' }] as any,
      combatState: {
        activeEncounterId: 'enc-1',
        round: 1,
        activeTurnId: 'combat-1',
        combatants: [
          { id: 'combat-1', name: 'Alyn', type: 'pc', ac: 18, maxHp: 50, currentHp: 50, initiative: 20, notes: 'Alyn notes' },
        ] as any[],
        selectedIds: [],
        syncingIds: [],
        concentrationLinks: {},
        isSelectionMode: false,
        expandedIds: [],
      } as any
    });
  });

  it('pressing H does not crash', () => {
    render(
      <MemoryRouter>
        <ActiveEncounterTab {...baseProps} />
      </MemoryRouter>
    );
    act(() => { fireEvent.keyDown(document, { key: 'h' }); });
  });

  it('pressing S does not crash', () => {
    render(
      <MemoryRouter>
        <ActiveEncounterTab {...baseProps} />
      </MemoryRouter>
    );
    act(() => { fireEvent.keyDown(document, { key: 's' }); });
  });

  it('pressing Escape does not crash', () => {
    render(
      <MemoryRouter>
        <ActiveEncounterTab {...baseProps} />
      </MemoryRouter>
    );
    act(() => { fireEvent.keyDown(document, { key: 'Escape' }); });
  });
});
