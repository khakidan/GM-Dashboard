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

describe('CommandPalette', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockActiveEncounterId = null;
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <CommandPalette isOpen={false} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders when isOpen is true', () => {
    render(
      <CommandPalette isOpen={true} onClose={() => {}} />
    );
    expect(screen.getByPlaceholderText(/Type a command or search.../i)).toBeDefined();
    expect(screen.getByText('Party Roster')).toBeDefined();
    expect(screen.getByText('Encounters')).toBeDefined();
  });

  it('Next Turn is not visible when no encounter is active', () => {
    mockActiveEncounterId = null;
    render(
      <CommandPalette isOpen={true} onClose={() => {}} />
    );
    expect(screen.queryByText('Next Turn')).toBeNull();
  });

  it('Next Turn is visible when encounter is active', () => {
    mockActiveEncounterId = 'encounter-123';
    render(
      <CommandPalette isOpen={true} onClose={() => {}} />
    );
    expect(screen.getByText('Next Turn')).toBeDefined();
  });

  it('allows matching typing in the search input', () => {
    render(
      <CommandPalette isOpen={true} onClose={() => {}} />
    );
    const input = screen.getByPlaceholderText(/Type a command or search.../i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Party' } });
    expect(input.value).toBe('Party');
  });

  it('calls associated action handler (e.g. Navigating on select)', () => {
    const mockOnClose = vi.fn();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    
    render(
      <CommandPalette isOpen={true} onClose={mockOnClose} />
    );
    const partyItem = screen.getByText('Party Roster');
    fireEvent.click(partyItem);
    
    expect(dispatchSpy).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders command items without dark background classes, using the warm amber theme', () => {
    render(
      <CommandPalette isOpen={true} onClose={() => {}} />
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

  describe('Mood-based preset commands', () => {
    it('shows the five mood commands in the Audio group', () => {
      const assignments = {
        sweet: ['track-1'],
        adventuring: [],
        tense: [],
        scary: [],
        combat: []
      };
      
      render(
        <CommandPalette 
          isOpen={true} 
          onClose={() => {}} 
          assignments={assignments}
        />
      );

      expect(screen.getByText(/Sweet Music/i)).toBeDefined();
      expect(screen.getByText(/Adventuring Music/i)).toBeDefined();
      expect(screen.getByText(/Tense Music/i)).toBeDefined();
      expect(screen.getByText(/Scary Music/i)).toBeDefined();
      expect(screen.getByText(/Combat Music/i)).toBeDefined();
    });

    it('shows track counts or empty status descriptions', () => {
      const assignments = {
        sweet: ['track-1', 'track-2'],
        adventuring: [],
        tense: [],
        scary: [],
        combat: []
      };

      render(
        <CommandPalette 
          isOpen={true} 
          onClose={() => {}} 
          assignments={assignments}
        />
      );

      expect(screen.getByText('2 tracks')).toBeDefined();
      expect(screen.queryAllByText('No tracks assigned').length).toBe(4);
    });

    it('displays active mood indicator when mood is active', () => {
      render(
        <CommandPalette 
          isOpen={true} 
          onClose={() => {}} 
          activeMood="sweet"
        />
      );

      expect(screen.getByText(/● Sweet Music/i)).toBeDefined();
      expect(screen.queryByText(/● Adventuring Music/i)).toBeNull();
    });

    it('calls activateMood on select', () => {
      const mockActivateMood = vi.fn();
      const mockPlayAmbient = vi.fn();
      const mockOnClose = vi.fn();

      render(
        <CommandPalette 
          isOpen={true} 
          onClose={mockOnClose} 
          activateMood={mockActivateMood}
          playAmbient={mockPlayAmbient}
        />
      );

      const sweetCommand = screen.getByText(/Sweet Music/i);
      fireEvent.click(sweetCommand);

      expect(mockActivateMood).toHaveBeenCalledWith('sweet', mockPlayAmbient);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
