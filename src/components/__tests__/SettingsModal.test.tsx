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

  it('renders "Test Damage Animation" button inside "GM Tools & Testing" section', () => {
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

    const btn = screen.getByRole('button', { name: /Test Damage Animation/i });
    expect(btn).toBeDefined();
  });

  it('clicking the Test Damage Animation button calls updateState and updates combatState.damageEvent correctly', () => {
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

    const btn = screen.getByRole('button', { name: /Test Damage Animation/i });
    fireEvent.click(btn);

    expect(mockUpdateState).toHaveBeenCalled();
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
        deathEvent: null,
        damageEvent: null,
      }
    };

    const nextState = updateFn(dummyState);
    expect(nextState.combatState.damageEvent).not.toBeNull();
    expect(nextState.combatState.damageEvent).toBeDefined();
    expect(nextState.combatState.damageEvent.combatantNames).toEqual(['Thorin Ironforge']);
    expect(nextState.combatState.damageEvent.damageAmount).toBe(47);
  });

  it('clicking the Test Damage Animation button shows a toast confirming the test was triggered', () => {
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

    const btn = screen.getByRole('button', { name: /Test Damage Animation/i });
    fireEvent.click(btn);

    expect(toast).toHaveBeenCalledWith('Damage animation triggered — check the Player View.', expect.any(Object));
  });

  it('renders "Test Heal Animation" button inside "GM Tools & Testing" section', () => {
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

    const btn = screen.getByRole('button', { name: /Test Heal Animation/i });
    expect(btn).toBeDefined();
  });

  it('clicking the Test Heal Animation button calls updateState and updates combatState.healEvent correctly', () => {
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

    const btn = screen.getByRole('button', { name: /Test Heal Animation/i });
    fireEvent.click(btn);

    expect(mockUpdateState).toHaveBeenCalled();
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
        deathEvent: null,
        damageEvent: null,
        healEvent: null,
      }
    };

    const nextState = updateFn(dummyState);
    expect(nextState.combatState.healEvent).not.toBeNull();
    expect(nextState.combatState.healEvent).toBeDefined();
    expect(nextState.combatState.healEvent.combatantNames).toEqual(['Seraphina Brightwell']);
    expect(nextState.combatState.healEvent.healAmount).toBe(34);
  });

  it('clicking the Test Heal Animation button shows a toast confirming the test was triggered', () => {
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

    const btn = screen.getByRole('button', { name: /Test Heal Animation/i });
    fireEvent.click(btn);

    expect(toast).toHaveBeenCalledWith('Heal animation triggered — check the Player View.', expect.any(Object));
  });

  it('renders "Test Unconscious Animation" button inside "GM Tools & Testing" section', () => {
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

    const btn = screen.getByRole('button', { name: /Test Unconscious Animation/i });
    expect(btn).toBeDefined();
  });

  it('clicking the Test Unconscious Animation button calls updateState and updates combatState.unconsciousEvent correctly', () => {
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

    const btn = screen.getByRole('button', { name: /Test Unconscious Animation/i });
    fireEvent.click(btn);

    expect(mockUpdateState).toHaveBeenCalled();
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
        deathEvent: null,
        damageEvent: null,
        healEvent: null,
        unconsciousEvent: null,
      }
    };

    const nextState = updateFn(dummyState);
    expect(nextState.combatState.unconsciousEvent).not.toBeNull();
    expect(nextState.combatState.unconsciousEvent).toBeDefined();
    expect(nextState.combatState.unconsciousEvent.characterName).toBe('Gareth of Stonehaven');
  });

  it('clicking the Test Unconscious Animation button shows a toast confirming the test was triggered', () => {
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

    const btn = screen.getByRole('button', { name: /Test Unconscious Animation/i });
    fireEvent.click(btn);

    expect(toast).toHaveBeenCalledWith('Unconscious animation triggered — check the Player View.', expect.any(Object));
  });
});
