import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SettingsPage } from '../SettingsPage';
import { useAppState } from '../../hooks/useAppState';
import { ThemeProvider } from '../../context/ThemeContext';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

// Mock useAppState hook
const mockUpdateState = vi.fn();
vi.mock('../../hooks/useAppState', () => ({
  useAppState: () => ({
    state: {
      campaignName: 'Test Campaign',
      characters: [],
      encounters: [],
      npcs: [],
      encounterCombatants: [],
      difficulties: {},
      statuses: {},
      combatState: {
        activeEncounterId: null,
        combatants: [],
        activeTurnId: null,
        round: 1,
        deathEvent: null
      }
    },
    updateState: mockUpdateState,
  }),
  getSnapshot: () => ({
    campaignName: 'Test Campaign',
    characters: [],
    encounters: [],
    npcs: [],
    encounterCombatants: [],
    difficulties: {},
    statuses: {},
    combatState: {
      activeEncounterId: null,
      combatants: [],
      activeTurnId: null,
      round: 1,
      deathEvent: null
    }
  })
}));

describe('SettingsModal / SettingsPage Test Button', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders "Test Death Animation" button inside "GM Tools & Testing" section', () => {
    render(
      <ThemeProvider>
        <SettingsPage
          isGoogleConnected={false}
          handleSignIn={vi.fn()}
          handleSignOut={vi.fn()}
          setIsGoogleConnected={vi.fn()}
          handleSyncWithSheets={vi.fn()}
          addLog={vi.fn()}
        />
      </ThemeProvider>
    );

    // Assert that section header "GM Tools & Testing" is present
    expect(screen.getByText('GM Tools & Testing')).toBeDefined();

    // Assert that button "Test Death Animation" is present
    const btn = screen.getByRole('button', { name: /Test Death Animation/i });
    expect(btn).toBeDefined();
  });

  it('clicking the button calls updateState and updates combatState.deathEvent to a non-null object with characterName', () => {
    render(
      <ThemeProvider>
        <SettingsPage
          isGoogleConnected={false}
          handleSignIn={vi.fn()}
          handleSignOut={vi.fn()}
          setIsGoogleConnected={vi.fn()}
          handleSyncWithSheets={vi.fn()}
          addLog={vi.fn()}
        />
      </ThemeProvider>
    );

    const btn = screen.getByRole('button', { name: /Test Death Animation/i });
    fireEvent.click(btn);

    // Expect updateState to have been called
    expect(mockUpdateState).toHaveBeenCalled();

    // Assert that the state update function modifies deathEvent correctly
    const updateFn = mockUpdateState.mock.calls[0][0];
    const dummyState = {
      campaignName: 'Test Campaign',
      characters: [],
      encounters: [],
      npcs: [],
      encounterCombatants: [],
      difficulties: {},
      statuses: {},
      combatState: {
        activeEncounterId: null,
        combatants: [],
        activeTurnId: null,
        round: 1,
        deathEvent: null
      }
    };

    const nextState = updateFn(dummyState);
    expect(nextState.combatState.deathEvent).not.toBeNull();
    expect(nextState.combatState.deathEvent).toBeDefined();
    expect(nextState.combatState.deathEvent.characterName).toBe('Aldric the Brave');
  });

  it('clicking the button shows a toast confirming the test was triggered', () => {
    render(
      <ThemeProvider>
        <SettingsPage
          isGoogleConnected={false}
          handleSignIn={vi.fn()}
          handleSignOut={vi.fn()}
          setIsGoogleConnected={vi.fn()}
          handleSyncWithSheets={vi.fn()}
          addLog={vi.fn()}
        />
      </ThemeProvider>
    );

    const btn = screen.getByRole('button', { name: /Test Death Animation/i });
    fireEvent.click(btn);

    // Expect toast notification to have been fired
    expect(toast).toHaveBeenCalledWith('Death animation triggered', expect.any(Object));
  });
});
