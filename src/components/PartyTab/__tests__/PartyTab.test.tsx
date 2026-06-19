import '@testing-library/jest-dom/vitest';
// src/components/PartyTab/__tests__/PartyTab.test.tsx

import React from 'react';
import { render, screen, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PartyTab } from '../../PartyTab';
import { useAppState } from '../../../hooks/useAppState';
import { useParty } from '../hooks/useParty';

// Mock useParty
vi.mock('../hooks/useParty', () => ({
  useParty: vi.fn(),
}));

// Mock useAppState
vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
}));

describe('PartyTab Dialog Integration', () => {
  let mockOpenDialog: string | null = null;
  const mockUpdateState = vi.fn((fn) => {
    if (typeof fn === 'function') {
      const res = fn({ openDialog: mockOpenDialog });
      mockOpenDialog = res.openDialog;
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockOpenDialog = null;

    vi.mocked(useParty).mockReturnValue({
      state: {
        characters: [
          { id: '1', characterName: 'Hero 1', ac: 15, maxHp: 20, currentHp: 20, tempHp: 0, conditions: '', notes: '' } as any
        ]
      } as any,
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
      state: {
        openDialog: mockOpenDialog,
      } as any,
      updateState: mockUpdateState,
      getSnapshot: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('When openDialog becomes "shortRest", the ShortRestDialog opens and openDialog becomes null', () => {
    mockOpenDialog = 'shortRest';
    
    vi.mocked(useAppState).mockReturnValue({
      state: {
        openDialog: mockOpenDialog,
      } as any,
      updateState: mockUpdateState,
      getSnapshot: vi.fn(),
    });

    const { rerender } = render(<PartyTab />);

    // Short Rest dialog header should be rendered
    expect(screen.getByRole('heading', { name: /Short Rest/i })).toBeInTheDocument();

    // The effect should have updated the state to consume/clear the openDialog field
    expect(mockUpdateState).toHaveBeenCalled();
    expect(mockOpenDialog).toBeNull();
  });
});
