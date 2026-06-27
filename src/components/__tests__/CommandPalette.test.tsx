import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CommandPalette } from '../CommandPalette';
import { useAppState } from '../../hooks/useAppState';
import { useParty } from '../PartyTab/hooks/useParty';

vi.mock('../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
}));

vi.mock('../PartyTab/hooks/useParty', () => ({
  useParty: vi.fn(),
}));

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock global ResizeObserver using a proper ES6 class constructor
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    // Mock HTML Element scrollIntoView for jsdom environment
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    vi.mocked(useAppState).mockReturnValue({
      state: {
        characters: [],
        combatState: {
          activeEncounterId: 'enc_1',
          combatants: [],
          activeTurnId: 'c1',
          round: 1,
          concentrationLinks: {},
        },
      } as any,
      updateState: vi.fn(),
    } as any);

    vi.mocked(useParty).mockReturnValue({
      handleLongRest: vi.fn(),
    } as any);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    ambientFiles: [],
    onPlayAmbient: vi.fn(),
    currentAmbientId: null,
    activeMood: null,
    assignments: {
      mood_calm: null,
      mood_tense: null,
      mood_epic: null,
      mood_creepy: null,
      mood_mysterious: null,
    } as any,
    activateMood: vi.fn(),
  };

  it('renders without crashing and shows the search input', () => {
    render(<CommandPalette {...defaultProps} />);

    // The search input should be visible
    expect(
      screen.getByPlaceholderText('Type a command or search...')
    ).toBeInTheDocument();
  });

  it('long rest command calls handleLongRest with active character ids', async () => {
    const handleLongRestMock = vi.fn().mockResolvedValue(undefined);

    // Mock useParty to return our spy
    vi.mocked(useParty).mockReturnValue({
      handleLongRest: handleLongRestMock,
    } as any);

    // Mock useAppState with active and inactive characters
    vi.mocked(useAppState).mockReturnValue({
      state: {
        characters: [
          { id: 'char-1', isActive: true },
          { id: 'char-2', isActive: false },
          { id: 'char-3', isActive: true },
        ],
        combatState: {
          activeEncounterId: 'enc_1',
          combatants: [],
          activeTurnId: 'c1',
          round: 1,
          concentrationLinks: {},
        },
      } as any,
      updateState: vi.fn(),
    } as any);

    // Mock window.confirm to return true
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<CommandPalette {...defaultProps} />);

    // Find and click the Long Rest command
    const longRestItem = screen.getByText('Long Rest');
    fireEvent.click(longRestItem);

    // Assert handleLongRest was called with only the active character IDs
    expect(handleLongRestMock).toHaveBeenCalledWith(['char-1', 'char-3']);
  });
});
