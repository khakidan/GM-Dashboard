import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { GMDashboard } from '../GMDashboard';
import { STORAGE_KEYS } from '../../lib/constants';

vi.mock('../GMTabContent', () => ({
  GMTabContent: ({ activeTab }: { activeTab: string }) => <div data-testid="gm-tab-content">{activeTab}</div>
}));

let mockActiveEncounterId: string | null = null;

vi.mock('../GMDashboardSidebar', () => ({
  GMDashboardSidebar: ({ onCloseCampaign }: { onCloseCampaign?: () => void }) => (
    <div data-testid="sidebar">
      <button data-testid="sidebar-all-campaigns-btn" onClick={onCloseCampaign}>All Campaigns</button>
    </div>
  )
}));

vi.mock('../../hooks/useAppState', () => ({
  useAppState: () => ({
    state: {
      hasInitialSynced: true,
      combatState: {
        activeEncounterId: mockActiveEncounterId
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
    mockActiveEncounterId = null;
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

  const mockCampaign = {
    id: 'camp-xyz',
    name: 'Tomb of Annihilation',
    spreadsheetId: 'sheet-toa',
    spreadsheetUrl: 'url-toa',
    createdAt: '2026-01-01',
    lastOpenedAt: '2026-01-01'
  };

  it('renders active campaign name in header if provided', () => {
    render(<GMDashboard campaign={mockCampaign} />);
    expect(screen.getByText('Tomb of Annihilation')).toBeInTheDocument();
    expect(screen.getByText('GM Dashboard')).toBeInTheDocument();
  });

  it('calls onCloseCampaign directly if no encounter is active when back button is clicked', () => {
    const onClose = vi.fn();
    render(<GMDashboard campaign={mockCampaign} onCloseCampaign={onClose} />);
    
    const backBtn = screen.getByTestId('sidebar-all-campaigns-btn');
    fireEvent.click(backBtn);
    
    expect(onClose).toHaveBeenCalled();
    expect(screen.queryByText('Leave Campaign?')).toBeNull();
  });

  it('shows leaving confirmation prompt when back button is clicked with active encounter', () => {
    mockActiveEncounterId = 'active-enc-123';
    const onClose = vi.fn();
    render(<GMDashboard campaign={mockCampaign} onCloseCampaign={onClose} />);
    
    const backBtn = screen.getByTestId('sidebar-all-campaigns-btn');
    fireEvent.click(backBtn);
    
    // onCloseCampaign should NOT be called directly
    expect(onClose).not.toHaveBeenCalled();
    
    // Leaving confirmation popup should be visible
    expect(screen.getByText('Leave Campaign?')).toBeInTheDocument();
    expect(screen.getByText('An encounter is in progress. Leave this campaign?')).toBeInTheDocument();
    
    // Click stay should dismiss but not trigger onCloseCampaign
    const stayBtn = screen.getByText('Stay');
    fireEvent.click(stayBtn);
    expect(screen.queryByText('Leave Campaign?')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    
    // Try again
    fireEvent.click(backBtn);
    expect(screen.getByText('Leave Campaign?')).toBeInTheDocument();
    
    // Click leave should call onCloseCampaign
    const leaveBtn = screen.getByText('Leave');
    fireEvent.click(leaveBtn);
    expect(onClose).toHaveBeenCalled();
  });
});

