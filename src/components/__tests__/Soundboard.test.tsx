import '@testing-library/jest-dom/vitest';
// src/components/__tests__/Soundboard.test.tsx

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { Soundboard } from '../Soundboard';
import { StoredAudioFile } from '../../lib/audioFileStore';
import { STORAGE_KEYS, campaignKey } from '../../lib/constants';

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
  campaignId: 'abc',
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
    const slots = buttons.filter(b => b.id && b.id.startsWith('soundboard-btn-'));
    expect(slots.length).toBe(12);
  });

  it('empty slots show the add state', () => {
    render(<Soundboard {...defaultProps} />);
    const addSoundTexts = screen.getAllByText('Add Sound');
    expect(addSoundTexts.length).toBe(12);
  });

  it('namespaces soundboard layout between abc and xyz campaigns', () => {
    const layoutAbc = [{ slotIndex: 0, fileId: 'fx-1', label: 'Roar ABC' }];
    const layoutXyz = [{ slotIndex: 0, fileId: 'fx-1', label: 'Roar XYZ' }];

    localStorage.setItem(campaignKey(STORAGE_KEYS.soundboardLayout, 'abc'), JSON.stringify(layoutAbc));
    localStorage.setItem(campaignKey(STORAGE_KEYS.soundboardLayout, 'xyz'), JSON.stringify(layoutXyz));

    const { unmount } = render(<Soundboard {...defaultProps} campaignId="abc" />);
    expect(screen.getByText('Roar ABC')).toBeInTheDocument();
    unmount();

    render(<Soundboard {...defaultProps} campaignId="xyz" />);
    expect(screen.getByText('Roar XYZ')).toBeInTheDocument();
  });

  it('assigned slots show the button label', () => {
    const layout = [
      { slotIndex: 2, fileId: 'fx-1', label: 'Dragon Roar' }
    ];
    localStorage.setItem(campaignKey(STORAGE_KEYS.soundboardLayout, 'abc'), JSON.stringify(layout));

    render(<Soundboard {...defaultProps} />);
    
    expect(screen.getByText('Dragon Roar')).toBeInTheDocument();
    // Only 11 slots are empty now
    const addSoundTexts = screen.getAllByText('Add Sound');
    expect(addSoundTexts.length).toBe(11);
  });

  it('clicking an assigned slot calls playEffect with the correct fileId', () => {
    const playEffectMock = vi.fn();
    const layout = [
      { slotIndex: 5, fileId: 'fx-1', label: 'Dragon Roar' }
    ];
    localStorage.setItem(campaignKey(STORAGE_KEYS.soundboardLayout, 'abc'), JSON.stringify(layout));

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
    localStorage.setItem(campaignKey(STORAGE_KEYS.soundboardLayout, 'abc'), JSON.stringify(layout));

    render(<Soundboard {...defaultProps} />);
    
    expect(screen.getByText('Roar')).toBeInTheDocument();
    expect(screen.getByText('Splash')).toBeInTheDocument();
  });
});
