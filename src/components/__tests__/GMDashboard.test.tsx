import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
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

vi.mock('../../components/AudioPanel', () => ({
  AudioPanel: ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => (
    <div data-testid="audio-panel-mock">
      {isOpen ? 'isOpen: true' : 'isOpen: false'}
    </div>
  )
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

  it('The AUDIO button no longer has a dropdown chevron', () => {
    render(<GMDashboard />);
    const audioBtn = screen.getByText(/AUDIO/);
    // Explicitly check for absence of chevron character (▼ or ▲) or Lucide icons if applicable
    expect(audioBtn.innerHTML).not.toContain('▼');
    expect(audioBtn.innerHTML).not.toContain('Chevron');
  });

  it('Clicking AUDIO sets isAudioPanelOpen to true', () => {
    render(<GMDashboard />);
    
    expect(screen.queryByTestId('audio-panel-mock')).toBeNull();
    
    // Click button
    const audioBtn = screen.getByText(/AUDIO/);
    fireEvent.click(audioBtn);
    
    expect(screen.getByTestId('audio-panel-mock').textContent).toContain('isOpen: true');
  });

  it('Pressing M toggles isAudioPanelOpen', () => {
    render(<GMDashboard />);
    
    expect(screen.queryByTestId('audio-panel-mock')).toBeNull();
    
    // Press M
    fireEvent.keyDown(window, { key: 'm', code: 'KeyM' });
    expect(screen.getByTestId('audio-panel-mock').textContent).toContain('isOpen: true');
    
    // Press M again
    fireEvent.keyDown(window, { key: 'm', code: 'KeyM' });
    expect(screen.queryByTestId('audio-panel-mock')).toBeNull();
  });
});

