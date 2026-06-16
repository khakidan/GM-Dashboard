// src/components/__tests__/Soundboard.test.tsx

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { Soundboard } from '../Soundboard';
import { StoredAudioFile } from '../../lib/audioFileStore';
import { STORAGE_KEYS } from '../../lib/constants';

const mockStoredFiles: StoredAudioFile[] = [
  {
    id: 'fx-1',
    name: 'Dragon Roar',
    fileName: 'dragon_roar.mp3',
    blob: new Blob([''], { type: 'audio/mp3' }),
    category: 'effect',
    addedAt: 100,
  }
];

const defaultProps = {
  storedFiles: mockStoredFiles,
  playEffect: vi.fn(),
  onSwitchTab: vi.fn(),
};

describe('Soundboard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders 12 slots', () => {
    render(<Soundboard {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    // Header doesn't have an action button by default except slots. Let's make sure we have 12 grid slots
    // Buttons inside the 3x4 grid:
    const slots = buttons.filter(b => b.id && b.id.startsWith('soundboard-btn-'));
    expect(slots.length).toBe(12);
  });

  it('empty slots show the add state', () => {
    render(<Soundboard {...defaultProps} />);
    const addSoundTexts = screen.getAllByText('Add Sound');
    expect(addSoundTexts.length).toBe(12);
  });

  it('assigned slots show the button label', () => {
    const layout = [
      { slotIndex: 2, fileId: 'fx-1', label: 'Dragon Roar' }
    ];
    localStorage.setItem(STORAGE_KEYS.soundboardLayout, JSON.stringify(layout));

    render(<Soundboard {...defaultProps} />);
    
    expect(screen.getByText('Dragon Roar')).toBeDefined();
    // Only 11 slots are empty now
    const addSoundTexts = screen.getAllByText('Add Sound');
    expect(addSoundTexts.length).toBe(11);
  });

  it('clicking an assigned slot calls playEffect with the correct fileId', () => {
    const playEffectMock = vi.fn();
    const layout = [
      { slotIndex: 5, fileId: 'fx-1', label: 'Dragon Roar' }
    ];
    localStorage.setItem(STORAGE_KEYS.soundboardLayout, JSON.stringify(layout));

    render(<Soundboard {...defaultProps} playEffect={playEffectMock} />);
    
    const roarBtn = screen.getByText('Dragon Roar');
    fireEvent.click(roarBtn);
    
    expect(playEffectMock).toHaveBeenCalledWith('fx-1');
  });

  it('soundboard layout is loaded from localStorage on mount', () => {
    const layout = [
      { slotIndex: 0, fileId: 'fx-1', label: 'Roar' },
      { slotIndex: 1, fileId: 'fx-1', label: 'Splash' }
    ];
    localStorage.setItem(STORAGE_KEYS.soundboardLayout, JSON.stringify(layout));

    render(<Soundboard {...defaultProps} />);
    
    expect(screen.getByText('Roar')).toBeDefined();
    expect(screen.getByText('Splash')).toBeDefined();
  });
});
