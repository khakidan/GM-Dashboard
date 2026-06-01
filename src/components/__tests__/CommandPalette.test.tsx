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
});
