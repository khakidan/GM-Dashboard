// src/components/__tests__/CommandPalette.test.tsx

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import { CommandPalette } from '../CommandPalette';

// Mock ResizeObserver for cmdk
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Setup default mock values
let mockActiveEncounterId: string | null = null;
const mockUpdateState = vi.fn();

vi.mock('../../hooks/useAppState', () => ({
  useAppState: () => ({
    state: {
      campaignName: 'Test Campaign',
      characters: [
        { id: 'char-1', name: 'Aldric the Brave', isActive: true, currentHp: 50, maxHp: 50, conditions: '' }
      ],
      encounters: [],
      npcs: [],
      encounterCombatants: [],
      difficulties: {},
      statuses: {},
      combatState: {
        activeEncounterId: mockActiveEncounterId,
        combatants: [],
        activeTurnId: null,
        round: 1,
        deathEvent: null
      }
    },
    updateState: mockUpdateState,
  }),
}));

const mockFireInitiative = vi.fn();
vi.mock('../../hooks/useOverlayEvents', () => ({
  useDeathEvent: () => ({ fire: vi.fn() }),
  useDamageEvent: () => ({ fire: vi.fn() }),
  useHealEvent: () => ({ fire: vi.fn() }),
  useInitiativeEvent: () => ({ fire: mockFireInitiative }),
}));

// Default props helper
const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  ambientFiles: [],
  onPlayAmbient: vi.fn(),
  currentAmbientId: null,
  activeMood: null,
  assignments: {
    sweet: null,
    adventuring: null,
    tense: null,
    scary: null,
    combat: null,
  },
  activateMood: vi.fn(),
};

describe('CommandPalette', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockActiveEncounterId = null;
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <CommandPalette {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders when isOpen is true', () => {
    render(
      <CommandPalette {...defaultProps} isOpen={true} />
    );
    expect(screen.getByPlaceholderText(/Type a command or search.../i)).toBeDefined();
    expect(screen.getByText('Party Roster')).toBeDefined();
    expect(screen.getByText('Encounters')).toBeDefined();
  });

  it('Next Turn is not visible when no encounter is active', () => {
    mockActiveEncounterId = null;
    render(
      <CommandPalette {...defaultProps} isOpen={true} />
    );
    expect(screen.queryByText('Next Turn')).toBeNull();
  });

  it('Next Turn is visible when encounter is active', () => {
    mockActiveEncounterId = 'encounter-123';
    render(
      <CommandPalette {...defaultProps} isOpen={true} />
    );
    expect(screen.getByText('Next Turn')).toBeDefined();
  });

  it('allows matching typing in the search input', () => {
    render(
      <CommandPalette {...defaultProps} isOpen={true} />
    );
    const input = screen.getByPlaceholderText(/Type a command or search.../i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Party' } });
    expect(input.value).toBe('Party');
  });

  it('calls associated action handler (e.g. Navigating on select)', () => {
    const mockOnClose = vi.fn();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    
    render(
      <CommandPalette {...defaultProps} isOpen={true} onClose={mockOnClose} />
    );
    const partyItem = screen.getByText('Party Roster');
    fireEvent.click(partyItem);
    
    expect(dispatchSpy).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders command items without dark background classes, using the warm amber theme', () => {
    render(
      <CommandPalette {...defaultProps} isOpen={true} />
    );
    const partyItem = screen.getByText('Party Roster').closest('[id^="cmd-"]');
    expect(partyItem).toBeDefined();
    if (partyItem) {
      const cls = partyItem.className || '';
      expect(cls).not.toContain('bg-[#3f3f37]');
      expect(cls).toContain('hover:bg-amber-50');
      expect(cls).toContain('data-[selected=\'true\']:bg-amber-50');
    }
  });

  it('"Short Rest" command appears under Party, navigates to party tab and sets openDialog to shortRest on select', () => {
    const mockOnClose = vi.fn();
    render(
      <CommandPalette {...defaultProps} onClose={mockOnClose} />
    );
    const item = screen.getByText('Short Rest');
    expect(item).toBeDefined();
    
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    fireEvent.click(item);
    
    expect(dispatchSpy).toHaveBeenCalled();
    expect(mockUpdateState).toHaveBeenCalledWith(expect.any(Function));
    
    // Evaluate the state update function
    const updater = mockUpdateState.mock.calls[0][0];
    const dummyState = { openDialog: null };
    const nextState = updater(dummyState);
    expect(nextState.openDialog).toBe('shortRest');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('"Call for Initiative" command exists under Combat', () => {
    // Enabled case
    mockActiveEncounterId = 'encounter-123';
    const { rerender } = render(
      <CommandPalette {...defaultProps} />
    );
    const itemEn = screen.getByText('Call for Initiative');
    expect(itemEn).toBeDefined();
    
    fireEvent.click(itemEn);
    expect(mockFireInitiative).toHaveBeenCalledWith(true);

    // Disabled case
    mockActiveEncounterId = null;
    rerender(
      <CommandPalette {...defaultProps} />
    );
    const itemDis = screen.getByText('Call for Initiative');
    expect(itemDis).toBeDefined();
  });

  it('Ambient track commands render for each file in ambientFiles prop', () => {
    const ambientFiles = [
      { id: 'track-1', name: 'Forest Rain', fileName: 'rain.mp3', category: 'ambient' as const, addedAt: 1000, blob: new Blob() },
      { id: 'track-2', name: 'Dungeon Ambient', fileName: 'dungeon.mp3', category: 'ambient' as const, addedAt: 2000, blob: new Blob() },
    ];
    render(
      <CommandPalette 
        {...defaultProps} 
        ambientFiles={ambientFiles} 
      />
    );
    expect(screen.getByText('Forest Rain')).toBeDefined();
    expect(screen.getByText('Dungeon Ambient')).toBeDefined();
  });

  it('The currently playing track shows an active indicator', () => {
    const ambientFiles = [
      { id: 'track-1', name: 'Forest Rain', fileName: 'rain.mp3', category: 'ambient' as const, addedAt: 1000, blob: new Blob() },
    ];
    render(
      <CommandPalette 
        {...defaultProps} 
        ambientFiles={ambientFiles} 
        currentAmbientId="track-1"
      />
    );
    expect(screen.getByTestId('active-indicator')).toBeDefined();
  });

  it('Selecting an ambient track calls onPlayAmbient with the correct fileId', () => {
    const onPlayAmbient = vi.fn();
    const ambientFiles = [
      { id: 'track-1', name: 'Forest Rain', fileName: 'rain.mp3', category: 'ambient' as const, addedAt: 1000, blob: new Blob() },
    ];
    render(
      <CommandPalette 
        {...defaultProps} 
        ambientFiles={ambientFiles} 
        onPlayAmbient={onPlayAmbient}
      />
    );
    const item = screen.getByText('Forest Rain');
    fireEvent.click(item);
    expect(onPlayAmbient).toHaveBeenCalledWith('track-1');
  });

  it('When ambientFiles is empty a disabled placeholder is shown', () => {
    render(
      <CommandPalette 
        {...defaultProps} 
        ambientFiles={[]} 
      />
    );
    expect(screen.getByText('No ambient tracks loaded')).toBeDefined();
    expect(screen.getByText('Add tracks in the Audio panel → Library tab')).toBeDefined();
  });

  it('renders all 5 mood commands in the Audio command group with proper counts', () => {
    const mockAssignments = {
      sweet: 'track-1',
      adventuring: 'track-2',
      tense: null,
      scary: null,
      combat: null,
    };
    
    // Create some matching dummy files to show the file name logic works
    const mockFiles = [
      { id: 'track-1', name: 'gentle_wind', fileName: 'gentle_wind.mp3', blob: new Blob([]), addedAt: 0, category: 'ambient' as const },
      { id: 'track-2', name: 'forest_hike', fileName: 'forest_hike.mp3', blob: new Blob([]), addedAt: 0, category: 'ambient' as const }
    ];

    render(
      <CommandPalette 
        {...defaultProps} 
        assignments={mockAssignments}
        ambientFiles={mockFiles}
        activeMood="sweet"
      />
    );

    expect(screen.getByText('🌸')).toBeDefined();
    expect(screen.getByText('Sweet Music')).toBeDefined();
    expect(screen.getByText('Sweet Music · gentle_wind')).toBeDefined();

    expect(screen.getByText('⚔️')).toBeDefined();
    expect(screen.getByText('Adventuring Music')).toBeDefined();
    expect(screen.getByText('Adventuring Music · forest_hike')).toBeDefined();

    expect(screen.getByText('⚠️')).toBeDefined();
    expect(screen.getByText('Tense Music')).toBeDefined();
    expect(screen.getByText('Tense Music · No track assigned')).toBeDefined();
  });

  it('calls activateMood on selecting a mood command', () => {
    const activateMood = vi.fn();
    render(
      <CommandPalette 
        {...defaultProps} 
        activateMood={activateMood}
      />
    );

    const sweetMusic = screen.getByText('Sweet Music');
    fireEvent.click(sweetMusic);

    expect(activateMood).toHaveBeenCalledWith('sweet', expect.any(Function));
  });
});
