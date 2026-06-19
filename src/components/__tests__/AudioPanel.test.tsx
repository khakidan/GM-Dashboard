import '@testing-library/jest-dom/vitest';
// src/components/__tests__/AudioPanel.test.tsx

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { AudioPanel } from '../AudioPanel';
import { StoredAudioFile } from '../../lib/audioFileStore';

const mockStoredFiles: StoredAudioFile[] = [
  {
    id: 'f-1',
    name: 'Witch Mountain',
    fileName: 'Witch_Mountain.mp3',
    blob: new Blob([''], { type: 'audio/mp3' }),
    category: 'ambient',
    addedAt: 12345,
  },
  {
    id: 'f-2',
    name: 'Sword Slash',
    fileName: 'Sword_Slash.mp3',
    blob: new Blob([''], { type: 'audio/mp3' }),
    category: 'effect',
    addedAt: 67890,
  }
];

const defaultProps = {
  currentAmbientId: null,
  isAmbientPlaying: false,
  ambientVolume: 0.5,
  effectVolume: 0.5,
  storedFiles: mockStoredFiles,
  playAmbient: vi.fn(),
  stopAmbient: vi.fn(),
  setAmbientVolume: vi.fn(),
  playEffect: vi.fn(),
  setEffectVolume: vi.fn(),
  addFiles: vi.fn(),
  removeFile: vi.fn(),
  activeMood: null,
  setActiveMood: vi.fn(),
  assignments: {
    sweet: '',
    adventuring: '',
    tense: '',
    scary: '',
    combat: '',
  },
  assignTrackToMood: vi.fn(),
  unassignTrack: vi.fn(),
  getMoodForTrack: vi.fn(() => null),
  activateMood: vi.fn(),
  clearAllFiles: vi.fn(),
  resetAllMoods: vi.fn(),
};

describe('AudioPanel', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('AudioPanel does not render when isOpen is false', () => {
    const { container } = render(<AudioPanel {...defaultProps} isOpen={false} />);
    expect(container.textContent).toBe('');
    expect(screen.queryByText('Ambient')).toBeNull();
  });

  it('AudioPanel renders as a modal when isOpen is true', () => {
    render(<AudioPanel {...defaultProps} isOpen={true} />);
    // The three tabs (Ambient, Soundboard, Library) are all present
    expect(screen.getByText('Ambient')).toBeInTheDocument();
    expect(screen.getByText('Soundboard')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();

    // The modal does not have position fixed top-right (no audio-panel-container style)
    const modalContent = document.getElementById('audio-panel-expanded-content');
    expect(modalContent?.className).not.toContain('top-right');
  });

  it('Clicking the backdrop calls onClose', () => {
    const onClose = vi.fn();
    render(<AudioPanel {...defaultProps} isOpen={true} onClose={onClose} />);
    
    // Backdrop is the first element with fixed inset-0
    const backdrop = document.querySelector('.bg-black\\/50') || screen.getByText('Audio Panel').parentElement?.parentElement?.firstChild;
    if (backdrop) fireEvent.click(backdrop as Element);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('Clicking the X button calls onClose', () => {
    const onClose = vi.fn();
    render(<AudioPanel {...defaultProps} isOpen={true} onClose={onClose} />);
    
    const closeBtn = screen.getByTitle('Close (Esc)');
    fireEvent.click(closeBtn);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('Pressing Escape calls onClose', () => {
    const onClose = vi.fn();
    render(<AudioPanel {...defaultProps} isOpen={true} onClose={onClose} />);
    
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
