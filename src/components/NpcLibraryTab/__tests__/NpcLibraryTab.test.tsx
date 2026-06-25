import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NpcLibraryTab } from '../../NpcLibraryTab';
import { useAppState } from '../../../hooks/useAppState';

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
}));

describe('NpcLibraryTab', () => {
  afterEach(() => cleanup());

  it('renders without crashing', () => {
    vi.mocked(useAppState).mockReturnValue({
      state: { npcs: [], combatState: { combatants: [] } },
      updateState: vi.fn(),
    } as any);

    render(<NpcLibraryTab />);
    expect(screen.getByText(/NPC Library/i)).toBeInTheDocument();
  });
});
