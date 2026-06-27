import { useEffect } from 'react';
import { Combatant } from '../../../types';

export interface UseEncounterKeyboardOptions {
  nextTurn: () => void;
  rollInitForNPCs: () => void;
  setIsToolsModalOpen: (updater: (prev: boolean) => boolean) => void;
  toggleMultiTargetMode: () => void;
  exitSelectionMode: () => void;
  handleCallInitiative: () => void;
  setHpMode: (mode: 'damage' | 'heal') => void;
  combatants: Combatant[];
  activeTurnId: string | null;
  initiativeEventExists: boolean;
  setIsCheatSheetOpen: (updater: (prev: boolean) => boolean) => void;
  setExpandedIds: (updater: (prev: Set<string>) => Set<string>) => void;
}

export function useEncounterKeyboard({
  nextTurn,
  rollInitForNPCs,
  setIsToolsModalOpen,
  toggleMultiTargetMode,
  exitSelectionMode,
  handleCallInitiative,
  setHpMode,
  combatants,
  activeTurnId,
  initiativeEventExists,
  setIsCheatSheetOpen,
  setExpandedIds,
}: UseEncounterKeyboardOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for modifier keys or if target is an input
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement).tagName) ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }

      const keyLower = event.key.toLowerCase();

      // ? triggers toggle of keyboard shortcuts cheat sheet overlay
      if (event.key === '?' || (event.key === '/' && event.shiftKey)) {
        event.preventDefault();
        setIsCheatSheetOpen(prev => !prev);
        return;
      }

      switch (keyLower) {
        case 'n':
          nextTurn();
          break;
        case 'r':
          rollInitForNPCs();
          break;
        case 't':
          setIsToolsModalOpen(prev => !prev);
          break;
        case 's':
          toggleMultiTargetMode();
          break;
        case 'b':
          if (typeof window !== 'undefined' && window.open) {
            window.open('/#/player-view', '_blank');
          }
          break;
        case 'c':
          if (!initiativeEventExists) {
            handleCallInitiative();
          }
          break;
        case 'h':
          setHpMode('heal');
          if (activeTurnId) {
            setTimeout(() => {
              const el = document.getElementById(`heal-input-${activeTurnId}`);
              if (el) {
                (el as HTMLInputElement).focus();
                (el as HTMLInputElement).select();
              }
            }, 50);
          }
          break;
        case 'd':
          setHpMode('damage');
          if (activeTurnId) {
            setTimeout(() => {
              const el = document.getElementById(`damage-input-${activeTurnId}`);
              if (el) {
                (el as HTMLInputElement).focus();
                (el as HTMLInputElement).select();
              }
            }, 50);
          }
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9': {
          const index = parseInt(event.key, 10) - 1;
          const combatantsList = combatants;
          if (combatantsList && index < combatantsList.length) {
            const targetCombatant = combatantsList[index];
            if (targetCombatant) {
              setExpandedIds(prev => {
                const copy = new Set(prev);
                copy.add(targetCombatant.id);
                return copy;
              });
              setTimeout(() => {
                const cardEl = document.getElementById(`combatant-card-${targetCombatant.id}`);
                if (cardEl) {
                  cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
              }, 50);
            }
          }
          break;
        }
        case 'escape': {
          setExpandedIds(() => new Set());
          setIsToolsModalOpen(() => false);
          setIsCheatSheetOpen(() => false);
          exitSelectionMode();
          break;
        }
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    combatants,
    activeTurnId,
    initiativeEventExists,
    nextTurn,
    rollInitForNPCs,
    toggleMultiTargetMode,
    handleCallInitiative,
    setIsToolsModalOpen,
    setIsCheatSheetOpen,
    setExpandedIds,
    setHpMode,
  ]);
}
