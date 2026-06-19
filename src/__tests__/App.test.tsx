import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import App from '../App';
import * as useAppStateModule from '../hooks/useAppState';

// Mock subcomponents to avoid heavy subcomponent sub-dependencies
vi.mock('../components/GMDashboard', () => ({
  GMDashboard: () => <div data-testid="gm-dashboard">Mock GM Dashboard</div>
}));
vi.mock('../components/PlayerView', () => ({
  PlayerView: () => <div data-testid="player-view">Mock Player View</div>
}));
vi.mock('../components/AuthRelay', () => ({
  AuthRelay: () => <div data-testid="auth-relay">Mock Auth Relay</div>
}));

// Mock checkAndCaptureToken so it authenticates instantly
vi.mock('../services/googleAuth', () => ({
  checkAndCaptureToken: vi.fn(() => Promise.resolve()),
}));

describe('App Level DeathOverlay Integration', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('When combatState.deathEvent is null, DeathOverlay is not present in the rendered App', async () => {
    vi.spyOn(useAppStateModule, 'useAppState').mockReturnValue({
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
          deathEvent: null,
        },
      } as any,
      updateState: vi.fn(),
      getSnapshot: vi.fn(),
    } as any);

    const { container } = render(<App />);
    
    // Wait for the authenticating state to pass (next tick)
    await new Promise((resolve) => setTimeout(resolve, 20));

    // DeathOverlay container (#death-overlay) should not exist
    const overlay = container.querySelector('#death-overlay');
    expect(overlay).toBeNull();
  });

  it('When combatState.deathEvent has a characterName, DeathOverlay is present in the rendered App', async () => {
    vi.spyOn(useAppStateModule, 'useAppState').mockReturnValue({
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
          deathEvent: { characterName: 'Boromir' },
        },
      } as any,
      updateState: vi.fn(),
      getSnapshot: vi.fn(),
    } as any);

    const { container } = render(<App />);
    
    // Wait for the authenticating state to pass
    await new Promise((resolve) => setTimeout(resolve, 20));

    // DeathOverlay container (#death-overlay) should exist
    const overlay = container.querySelector('#death-overlay');
    expect(overlay).not.toBeNull();
    
    // Character name Boromir is present
    expect(screen.getByText('Boromir')).toBeInTheDocument();
  });
});
