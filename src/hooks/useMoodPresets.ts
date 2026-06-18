// src/hooks/useMoodPresets.ts

import { useState, useEffect } from 'react';
import { STORAGE_KEYS, MOODS, MoodId } from '../lib/constants';
import { toast } from 'sonner';

const DEFAULT_ASSIGNMENTS: Record<MoodId, string[]> = {
  sweet: [],
  adventuring: [],
  tense: [],
  scary: [],
  combat: []
};

function loadFromLocalStorage(): Record<MoodId, string[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.moodPresets);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure all moods exist in the loaded object
      const assignments = { ...DEFAULT_ASSIGNMENTS };
      for (const m of MOODS) {
        if (Array.isArray(parsed[m.id])) {
          assignments[m.id] = parsed[m.id];
        }
      }
      return assignments;
    }
  } catch (err) {
    console.error('Failed to load mood presets from localStorage', err);
  }
  return { ...DEFAULT_ASSIGNMENTS };
}

export function useMoodPresets() {
  const [assignments, setAssignments] = useState<Record<MoodId, string[]>>(() => loadFromLocalStorage());
  const [activeMood, setActiveMood] = useState<MoodId | null>(null);

  // Save to localStorage when assignments change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.moodPresets, JSON.stringify(assignments));
  }, [assignments]);

  const assignTrackToMood = (fileId: string, moodId: MoodId) => {
    setAssignments(prev => {
      const updated = { ...prev };
      // Remove fileId from any existing mood assignment
      for (const key of MOODS) {
        if (updated[key.id]) {
          updated[key.id] = updated[key.id].filter(id => id !== fileId);
        }
      }
      // Add to new mood assignment
      if (!updated[moodId]) {
        updated[moodId] = [];
      }
      if (!updated[moodId].includes(fileId)) {
        updated[moodId] = [...updated[moodId], fileId];
      }
      return updated;
    });
  };

  const unassignTrack = (fileId: string) => {
    setAssignments(prev => {
      const updated = { ...prev };
      for (const key of MOODS) {
        if (updated[key.id]) {
          updated[key.id] = updated[key.id].filter(id => id !== fileId);
        }
      }
      return updated;
    });
  };

  const getMoodForTrack = (fileId: string): MoodId | null => {
    for (const key of MOODS) {
      if (assignments[key.id]?.includes(fileId)) {
        return key.id;
      }
    }
    return null;
  };

  const activateMood = (moodId: MoodId, playAmbient: (fileId: string) => void) => {
    const tracks = assignments[moodId] || [];
    if (tracks.length === 0) {
      const moodLabel = MOODS.find(m => m.id === moodId)?.label || moodId;
      toast(`No tracks assigned to ${moodLabel}. Open the Audio Library to assign one.`);
      return;
    }
    // Activate a mood — plays its first assigned track via playAmbient
    const firstTrackId = tracks[0];
    playAmbient(firstTrackId);
    setActiveMood(moodId);
  };

  return {
    assignments,
    activeMood,
    setActiveMood, // expose to synchronize active mood visually when clicked
    assignTrackToMood,
    unassignTrack,
    getMoodForTrack,
    activateMood,
  };
}
