import { useEffect } from 'react';
import { useAudioEngine } from './useAudioEngine';
import { useMoodPresets } from './useMoodPresets';

interface UseDashboardShortcutsProps {
  setIsAudioPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  audioEngine: ReturnType<typeof useAudioEngine>;
  moodPresets: ReturnType<typeof useMoodPresets>;
}

export function useDashboardShortcuts({
  setIsAudioPanelOpen,
  setIsPaletteOpen,
  audioEngine,
  moodPresets,
}: UseDashboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsAudioPanelOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsAudioPanelOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsPaletteOpen(true);
        return;
      }

      // Check if user is typing in forms
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      // Alt + 1-5 for Mood Presets matching Sweet, Adventuring, Tense, Scary, Combat
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === '1') {
          e.preventDefault();
          moodPresets.activateMood('sweet', audioEngine.playAmbient);
        } else if (e.key === '2') {
          e.preventDefault();
          moodPresets.activateMood('adventuring', audioEngine.playAmbient);
        } else if (e.key === '3') {
          e.preventDefault();
          moodPresets.activateMood('tense', audioEngine.playAmbient);
        } else if (e.key === '4') {
          e.preventDefault();
          moodPresets.activateMood('scary', audioEngine.playAmbient);
        } else if (e.key === '5') {
          e.preventDefault();
          moodPresets.activateMood('combat', audioEngine.playAmbient);
        }
      }
    };
    const handleOpenPalette = () => {
      setIsPaletteOpen(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleOpenPalette);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleOpenPalette);
    };
  }, [moodPresets, audioEngine.playAmbient, setIsPaletteOpen]);
}
