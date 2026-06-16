import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { GMDashboard } from '../GMDashboard';
import { STORAGE_KEYS } from '../../lib/constants';

vi.mock('../GMTabContent', () => ({
  GMTabContent: ({ activeTab }: { activeTab: string }) => <div data-testid="gm-tab-content">{activeTab}</div>
}));

vi.mock('../GMDashboardSidebar', () => ({
  GMDashboardSidebar: () => <div data-testid="sidebar" />
}));

vi.mock('../../hooks/useAppState', () => ({
  useAppState: () => ({
    state: {
      hasInitialSynced: true,
      combatState: {
        activeEncounterId: null
      }
    }
  })
}));

vi.mock('../../hooks/useSheetSync', () => ({
  useSheetSync: () => ({
    handleSyncWithSheets: vi.fn(),
    isSyncing: false,
    setIsSyncing: vi.fn(),
    syncError: null,
    setSyncError: vi.fn(),
    syncLogs: [],
    addLog: vi.fn()
  })
}));

vi.mock('../../hooks/useGoogleAuth', () => ({
  useGoogleAuth: () => ({
    isGoogleConnected: true,
    setIsGoogleConnected: vi.fn(),
    handleSignIn: vi.fn(),
    handleSignOut: vi.fn()
  })
}));

vi.mock('../../hooks/useEncounterLifecycle', () => ({
  useEncounterLifecycle: () => ({
    startEncounter: vi.fn(),
    clearEncounter: vi.fn()
  })
}));

vi.mock('../../hooks/useEncounterResume', () => ({
  useEncounterResume: vi.fn()
}));

vi.mock('../../hooks/useAudioEngine', () => ({
  useAudioEngine: () => ({
    currentAmbientId: null,
    isAmbientPlaying: false,
    ambientVolume: 0.5,
    effectVolume: 0.5,
    storedFiles: [],
    playAmbient: vi.fn(),
    stopAmbient: vi.fn(),
    setAmbientVolume: vi.fn(),
    playEffect: vi.fn(),
    setEffectVolume: vi.fn(),
    addFiles: vi.fn(),
    removeFile: vi.fn(),
  })
}));

vi.mock('../../components/CommandPalette', () => ({
  CommandPalette: () => <div data-testid="command-palette" />
}));

const LAST_TAB_KEY = STORAGE_KEYS.lastActiveTab;

describe('GMDashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('When localStorage contains a valid tab value, that tab is used as the initial active tab', () => {
    localStorage.setItem(LAST_TAB_KEY, 'encounters');
    const { getByTestId } = render(<GMDashboard />);
    expect(getByTestId('gm-tab-content').textContent).toBe('encounters');
  });

  it('When localStorage contains an invalid value, the app defaults to party without throwing', () => {
    localStorage.setItem(LAST_TAB_KEY, 'hacked_value');
    const { getByTestId } = render(<GMDashboard />);
    expect(getByTestId('gm-tab-content').textContent).toBe('party');
  });

  it('When localStorage is empty, the app defaults to party', () => {
    const { getByTestId } = render(<GMDashboard />);
    expect(getByTestId('gm-tab-content').textContent).toBe('party');
  });
});

