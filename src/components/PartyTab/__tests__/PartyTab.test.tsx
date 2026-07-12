import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PartyTab } from '../../PartyTab';
import { useAppState } from '../../../hooks/useAppState';
import { useParty } from '../hooks/useParty';

vi.mock('../hooks/useParty', () => ({
  useParty: vi.fn(),
}));

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
}));

describe('PartyTab', () => {
  beforeEach(() => {
    vi.mocked(useParty).mockReturnValue({
      state: { characters: [] } as any,
      syncingId: null,
      isResting: false,
      isAddingPlayer: false,
      globalError: null,
      expandedIds: new Set(),
      toggleExpand: vi.fn(),
      handleCreateCharacter: vi.fn(),
      handleLongRest: vi.fn(),
      handleShortRest: vi.fn(),
      handleDeletePlayer: vi.fn(),
      handleUpdate: vi.fn(),
      levelUpCharacter: null,
      setLevelUpCharacter: vi.fn(),
      handleLevelUpConfirm: vi.fn(),
    } as any);

    vi.mocked(useAppState).mockReturnValue({
      state: { openDialog: null, statuses: { '1': 'Active', '2': 'Inactive', '3': 'Deceased' } } as any,
      updateState: vi.fn(),
      getSnapshot: vi.fn(),
    });
  });

  afterEach(() => cleanup());

  it('renders without crashing with an empty party', () => {
    render(<PartyTab />);
    expect(screen.getByText(/No characters found/i)).toBeInTheDocument();
  });
});
