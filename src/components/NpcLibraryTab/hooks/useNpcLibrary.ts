import { useState } from 'react';
import { useAppState } from '../../../hooks/useAppState';
import { resetNpcHpDB } from '../../../services/dbOperations';
import { toast } from 'sonner';

export function useNpcLibrary() {
  const { state, updateState } = useAppState();
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleResetNpcHp = async (npcId: string, maxHp: number) => {
    setGlobalError(null);
    const previousState = state;
    
    // 1. Update the NPC in local state optimistically
    updateState(prev => ({
      ...prev,
      npcs: prev.npcs.map(n => n.id === npcId ? { ...n, currentHp: maxHp } : n)
    }));

    setSyncingId(npcId);

    try {
      await resetNpcHpDB(npcId, maxHp);
      toast.success('NPC HP reset successfully!');
    } catch (err: unknown) {
      console.error("Failed to reset NPC HP", err);
      // Rollback
      updateState(previousState);
      const errorObj = err as Record<string, unknown> | null;
      if (errorObj?.message === "UNAUTHENTICATED" || errorObj?.error === "UNAUTHENTICATED") {
        alert("Your session has expired. Please sign in again.");
        window.location.reload();
      } else {
        setGlobalError("Failed to reset NPC HP.");
        toast.error("Failed to reset NPC HP.");
      }
    } finally {
      setSyncingId(null);
    }
  };

  return {
    state,
    syncingId,
    globalError,
    handleResetNpcHp,
  };
}
