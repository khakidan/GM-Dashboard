import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDashboardShortcuts } from '../useDashboardShortcuts';

describe('useDashboardShortcuts', () => {
  it('toggles audio panel on M key', () => {
    const setIsAudioPanelOpen = vi.fn();
    const setIsPaletteOpen = vi.fn();
    const audioEngine = { playAmbient: vi.fn() } as any;
    const moodPresets = { activateMood: vi.fn() } as any;

    renderHook(() => useDashboardShortcuts({ setIsAudioPanelOpen, setIsPaletteOpen, audioEngine, moodPresets }));

    const event = new KeyboardEvent('keydown', { key: 'm' });
    window.dispatchEvent(event);

    expect(setIsAudioPanelOpen).toHaveBeenCalled();
  });
});
