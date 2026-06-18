import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { MOODS, MoodId, STORAGE_KEYS } from '../lib/constants';

const defaultAssignments: Record<MoodId, string[]> = {
  sweet: [],
  adventuring: [],
  tense: [],
  scary: [],
  combat: [],
};

function loadFromLocalStorage(): Record<MoodId, string[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.moodPresets);
    if (stored) {
      const parsed = JSON.parse(stored);
      const loaded = { ...defaultAssignments };
      for (const m of MOODS) {
        if (Array.isArray(parsed[m.id])) {
          loaded[m.id] = parsed[m.id];
        }
      }
      return loaded;
    }
  } catch (e) {
    console.error('Failed to load mood presets from localStorage:', e);
  }
  return defaultAssignments;
}

export function useMoodPresets() {
  const [assignments, setAssignments] = useState<Record<MoodId, string[]>>(() =>
    loadFromLocalStorage()
  );

  const [activeMood, setActiveMood] = useState<MoodId | null>(null);

  // Synchronize to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.moodPresets, JSON.stringify(assignments));
    } catch (e) {
      console.error('Failed to save mood presets to localStorage:', e);
    }
  }, [assignments]);

  const assignTrackToMood = useCallback((fileId: string, moodId: MoodId) => {
    setAssignments((prev) => {
      const next: Record<MoodId, string[]> = { ...prev };
      // Remove from all other moods first
      for (const key of Object.keys(next) as MoodId[]) {
        next[key] = next[key].filter((id) => id !== fileId);
      }
      // Add to new mood if not already present
      if (!next[moodId].includes(fileId)) {
        next[moodId] = [...next[moodId], fileId];
      }
      return next;
    });
  }, []);

  const unassignTrack = useCallback((fileId: string) => {
    setAssignments((prev) => {
      const next: Record<MoodId, string[]> = { ...prev };
      for (const key of Object.keys(next) as MoodId[]) {
        next[key] = next[key].filter((id) => id !== fileId);
      }
      return next;
    });
  }, []);

  const getMoodForTrack = useCallback(
    (fileId: string): MoodId | null => {
      for (const key of Object.keys(assignments) as MoodId[]) {
        if (assignments[key].includes(fileId)) {
          return key;
        }
      }
      return null;
    },
    [assignments]
  );

  const activateMood = useCallback(
    (moodId: MoodId, playAmbient: (fileId: string) => void) => {
      const tracks = assignments[moodId];
      if (!tracks || tracks.length === 0) {
        const moodObj = MOODS.find((m) => m.id === moodId);
        const label = moodObj ? moodObj.label : moodId;
        toast(`No tracks assigned to ${label}. Open the Audio Library to assign one.`);
        return;
      }
      setActiveMood(moodId);
      playAmbient(tracks[0]);
    },
    [assignments]
  );

  return {
    assignments,
    activeMood,
    setActiveMood,
    assignTrackToMood,
    unassignTrack,
    getMoodForTrack,
    activateMood,
  };
}
