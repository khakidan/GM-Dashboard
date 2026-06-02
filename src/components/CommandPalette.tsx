import { effectiveMaxHp, applyLongRestToConditions } from '../lib/conditions';
// src/components/CommandPalette.tsx

import React, { useEffect } from 'react';
import { Command } from 'cmdk';
import { useAppState } from '../hooks/useAppState';
import { toast } from 'sonner';
import { 
  Users, 
  Map, 
  Skull, 
  Swords, 
  ExternalLink, 
  Play, 
  Dices, 
  AlertCircle, 
  Settings, 
  Moon, 
  Zap, 
  Heart, 
  Sparkles 
} from 'lucide-react';
;
;
import { updateCharacterDB } from '../services/dbOperations';

const COMMAND_ITEM_CLASS = "w-full px-3 py-2.5 rounded-lg flex items-center justify-between text-xs font-semibold font-sans transition-all cursor-pointer text-stone-300 hover:bg-amber-50 hover:text-gray-900 border-l-2 border-transparent hover:border-amber-400 data-[selected='true']:bg-amber-50 data-[selected='true']:text-gray-900 data-[selected='true']:border-amber-400 data-[selected=true]:bg-amber-50 data-[selected=true]:text-gray-900 data-[selected=true]:border-amber-400";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const { state, updateState } = useAppState();

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const testDeathAnimation = () => {
    updateState(prev => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        deathEvent: { characterName: 'Aldric the Brave' }
      }
    }));
    setTimeout(() => {
      updateState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          deathEvent: null
        }
      }));
    }, 10500);
    toast('Death animation triggered', {
      description: 'Check the Player View to see the overlay.',
      duration: 3000,
    });
  };

  const testDamageAnimation = () => {
    updateState(prev => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        damageEvent: { combatantName: 'Thorin Ironforge', damageAmount: 47 }
      }
    }));
    setTimeout(() => {
      updateState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          damageEvent: null
        }
      }));
    }, 5500);
    toast('Damage animation triggered — check the Player View.', {
      duration: 3000,
    });
  };

  const testHealAnimation = () => {
    updateState(prev => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        healEvent: { combatantName: 'Seraphina Brightwell', healAmount: 34 }
      }
    }));
    setTimeout(() => {
      updateState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          healEvent: null
        }
      }));
    }, 5500);
    toast('Heal animation triggered — check the Player View.', {
      duration: 3000,
    });
  };

  const handleLongRest = async () => {
    if (!confirm("Are you sure you want the party to take a long rest? This will reset all Current HP to Max HP and clear all Temp HP.")) return;
    
    const previousState = { ...state };
    
    // 1. Update local state optimistically
    updateState(prev => {
      const updatedCharacters = prev.characters.map(c => {
        if (!c.isActive) return c;
        const { remaining, newExhaustionLevel } = applyLongRestToConditions(c.conditions || '');
        const updates: Partial<typeof c> = {
          currentHp: effectiveMaxHp(c.maxHp, c.tempHpMax),
          tempHp: 0,
        };
        if (remaining !== c.conditions) {
          updates.conditions = remaining;
        }
        const hadHpHalvingExhaustion = [4, 5, 6].some(
          n => (c.conditions || '').toLowerCase().includes(`exhaustion ${n}`)
        );
        const stillHasHpHalvingExhaustion = newExhaustionLevel !== null && newExhaustionLevel >= 4;
        if (hadHpHalvingExhaustion && !stillHasHpHalvingExhaustion) {
          updates.tempHpMax = 0;
          updates.currentHp = c.maxHp;
        }
        return { ...c, ...updates };
      });

      // Mirror the changes into any active PC combatants
      const updatedCombatants = (prev.combatState?.combatants || []).map(combatant => {
        if (combatant.type !== 'pc' || !combatant.characterId) {
          return combatant;
        }
        const updatedChar = updatedCharacters.find(c => c.id === combatant.characterId);
        if (!updatedChar) return combatant;
        return {
          ...combatant,
          currentHp: updatedChar.currentHp,
          tempHp: updatedChar.tempHp ?? 0,
          maxHp: updatedChar.maxHp,
          conditions: updatedChar.conditions || '',
          conditionTimers: {},
        };
      });

      return {
        ...prev,
        characters: updatedCharacters,
        combatState: {
          ...prev.combatState,
          combatants: updatedCombatants,
        },
      };
    });

    try {
      const preRestActivePCs = previousState.characters.filter(c => c.isActive);
      let anyExhaustionReduced = false;
      const removedEffects: string[] = [];

      const updatePromises = preRestActivePCs.map(char => {
        const { remaining, removed, exhaustionReduced, newExhaustionLevel } = applyLongRestToConditions(char.conditions || '');
        if (exhaustionReduced) anyExhaustionReduced = true;
        if (removed.length > 0) removedEffects.push(...removed);

        const updates: Partial<typeof char> = {
          currentHp: effectiveMaxHp(char.maxHp, char.tempHpMax),
          tempHp: 0,
        };
        if (remaining !== char.conditions) {
          updates.conditions = remaining;
        }
        const hadHpHalvingExhaustion = [4, 5, 6].some(
          n => (char.conditions || '').toLowerCase().includes(`exhaustion ${n}`)
        );
        const stillHasHpHalvingExhaustion = newExhaustionLevel !== null && newExhaustionLevel >= 4;
        if (hadHpHalvingExhaustion && !stillHasHpHalvingExhaustion) {
          updates.tempHpMax = 0;
          updates.currentHp = char.maxHp;
        }
        return updateCharacterDB(updates, char);
      });

      await Promise.all(updatePromises);

      const lines: string[] = [];
      if (anyExhaustionReduced) lines.push('Exhaustion reduced by 1 for affected characters.');
      if (removedEffects.length > 0) lines.push(`Effects cleared: ${[...new Set(removedEffects)].join(', ')}.`);

      toast.success('Long rest complete', {
        description: lines.length > 0 ? lines.join(' ') : 'All HP restored. No conditions were changed.',
        duration: 8000,
      });
    } catch (err) {
      console.error("Long rest from palette failed", err);
      updateState(previousState);
      toast.error("Failed to sync long rest to sheets.");
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      id="command-palette-backdrop"
      className="fixed inset-0 bg-[#1a1a14]/75 backdrop-blur-sm z-50 flex items-start justify-center pt-[12vh] px-4 font-sans select-none"
      onClick={onClose}
    >
      <div 
        id="command-palette-card"
        className="w-full max-w-xl bg-[#2c2c26] text-[#e5e1d8] rounded-2xl border border-[#3f3f37] overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <Command label="GM Command Palette" id="command-palette-command-wrapper" className="flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#3f3f37]">
            <Dices className="w-5 h-5 text-[#c5b358]" />
            <Command.Input
              id="command-palette-input"
              autoFocus
              placeholder="Type a command or search..."
              className="w-full bg-transparent outline-none border-none placeholder-stone-500 text-sm font-sans text-[#e5e1d8]"
            />
          </div>

          <Command.List id="command-palette-list" className="max-h-96 overflow-y-auto py-2 scrollbar-thin">
            <Command.Empty className="px-4 py-3 text-xs text-stone-500 font-medium font-sans">No commands found.</Command.Empty>

            <Command.Group heading="── Navigation ──" className="px-2 py-1.5 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:font-sans [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[#c5b358]/50">
              <Command.Item
                id="cmd-party-roster"
                onSelect={() => {
                  window.dispatchEvent(new CustomEvent('gm-change-tab', { detail: 'party' }));
                  onClose();
                }}
                className={COMMAND_ITEM_CLASS}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-[#c5b358]" />
                  <span>Party Roster</span>
                </div>
              </Command.Item>
              <Command.Item
                id="cmd-encounters"
                onSelect={() => {
                  window.dispatchEvent(new CustomEvent('gm-change-tab', { detail: 'encounters' }));
                  onClose();
                }}
                className={COMMAND_ITEM_CLASS}
              >
                <div className="flex items-center gap-3">
                  <Map className="w-4 h-4 text-[#c5b358]" />
                  <span>Encounters</span>
                </div>
              </Command.Item>
              <Command.Item
                id="cmd-npc-library"
                onSelect={() => {
                  window.dispatchEvent(new CustomEvent('gm-change-tab', { detail: 'npc-library' }));
                  onClose();
                }}
                className={COMMAND_ITEM_CLASS}
              >
                <div className="flex items-center gap-3">
                  <Skull className="w-4 h-4 text-[#c5b358]" />
                  <span>NPC Library</span>
                </div>
              </Command.Item>
              <Command.Item
                id="cmd-active-encounter"
                onSelect={() => {
                  window.dispatchEvent(new CustomEvent('gm-change-tab', { detail: 'combat' }));
                  onClose();
                }}
                className={COMMAND_ITEM_CLASS}
              >
                <div className="flex items-center gap-3">
                  <Swords className="w-4 h-4 text-[#c5b358]" />
                  <span>Active Encounter</span>
                </div>
              </Command.Item>
              <Command.Item
                id="cmd-player-view"
                onSelect={() => {
                  const url = window.location.origin + window.location.pathname + '#/player-view';
                  window.open(url, '_blank');
                  onClose();
                }}
                className={COMMAND_ITEM_CLASS}
              >
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-4 h-4 text-[#c5b358]" />
                  <span>Player View</span>
                </div>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="── Create ──" className="px-2 py-1.5 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:font-sans [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[#c5b358]/50">
              <Command.Item
                id="cmd-create-player"
                onSelect={() => {
                  window.dispatchEvent(new CustomEvent('gm-change-tab', { detail: 'party' }));
                  updateState(prev => ({ ...prev, openDialog: 'newPlayer' }));
                  onClose();
                }}
                className={COMMAND_ITEM_CLASS}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-[#c5b358]" />
                  <span>+ New Player</span>
                </div>
              </Command.Item>
              <Command.Item
                id="cmd-create-npc"
                onSelect={() => {
                  window.dispatchEvent(new CustomEvent('gm-change-tab', { detail: 'npc-library' }));
                  updateState(prev => ({ ...prev, openDialog: 'newNpc' }));
                  onClose();
                }}
                className={COMMAND_ITEM_CLASS}
              >
                <div className="flex items-center gap-3">
                  <Skull className="w-4 h-4 text-[#c5b358]" />
                  <span>+ New NPC</span>
                </div>
              </Command.Item>
              <Command.Item
                id="cmd-create-encounter"
                onSelect={() => {
                  window.dispatchEvent(new CustomEvent('gm-change-tab', { detail: 'encounters' }));
                  updateState(prev => ({ ...prev, openDialog: 'newEncounter' }));
                  onClose();
                }}
                className={COMMAND_ITEM_CLASS}
              >
                <div className="flex items-center gap-3">
                  <Map className="w-4 h-4 text-[#c5b358]" />
                  <span>+ New Encounter</span>
                </div>
              </Command.Item>
            </Command.Group>

            {state.combatState.activeEncounterId && (
              <Command.Group heading="── Combat ──" className="px-2 py-1.5 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:font-sans [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[#c5b358]/50">
                <Command.Item
                  id="cmd-next-turn"
                  onSelect={() => {
                    window.dispatchEvent(new CustomEvent('gm-cmd-next-turn'));
                    onClose();
                  }}
                  className={COMMAND_ITEM_CLASS}
                >
                  <div className="flex items-center gap-3">
                    <Play className="w-4 h-4 text-[#c5b358]" />
                    <span>Next Turn</span>
                  </div>
                  <kbd className="px-1.5 py-0.5 text-[10px] font-sans font-bold bg-[#1a1a14]/65 border border-[#3f3f37] rounded-md text-stone-400">N</kbd>
                </Command.Item>
                <Command.Item
                  id="cmd-roll-npc-initiative"
                  onSelect={() => {
                    window.dispatchEvent(new CustomEvent('gm-cmd-roll-npc-init'));
                    onClose();
                  }}
                  className={COMMAND_ITEM_CLASS}
                >
                  <div className="flex items-center gap-3">
                    <Dices className="w-4 h-4 text-[#c5b358]" />
                    <span>Roll NPC Initiative</span>
                  </div>
                </Command.Item>
                <Command.Item
                  id="cmd-call-for-initiative"
                  onSelect={() => {
                    window.dispatchEvent(new CustomEvent('gm-cmd-call-initiative'));
                    onClose();
                  }}
                  className={COMMAND_ITEM_CLASS}
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-[#c5b358]" />
                    <span>Call for Initiative</span>
                  </div>
                </Command.Item>
                <Command.Item
                  id="cmd-open-tools"
                  onSelect={() => {
                    window.dispatchEvent(new CustomEvent('gm-cmd-open-tools'));
                    onClose();
                  }}
                  className={COMMAND_ITEM_CLASS}
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-[#c5b358]" />
                    <span>Open Tools</span>
                  </div>
                </Command.Item>
              </Command.Group>
            )}

            <Command.Group heading="── Dice ──" className="px-2 py-1.5 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:font-sans [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[#c5b358]/50">
              {[4, 6, 8, 10, 12, 20, 100].map(sides => (
                <Command.Item
                  key={sides}
                  id={`cmd-roll-d${sides}`}
                  onSelect={() => {
                    const result = Math.floor(Math.random() * sides) + 1;
                    toast.success(`Rolled d${sides}`, {
                      description: `Result: ${result}`,
                      duration: 5000,
                    });
                    onClose();
                  }}
                  className={COMMAND_ITEM_CLASS}
                >
                  <div className="flex items-center gap-3">
                    <Dices className="w-4 h-4 text-[#c5b358]" />
                    <span>Roll d{sides}</span>
                  </div>
                </Command.Item>
              ))}
              <Command.Item
                id="cmd-roll-custom"
                onSelect={() => {
                  window.dispatchEvent(new CustomEvent('gm-cmd-focus-dice'));
                  onClose();
                }}
                className={COMMAND_ITEM_CLASS}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-[#c5b358]" />
                  <span>Roll Custom...</span>
                </div>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="── Party ──" className="px-2 py-1.5 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:font-sans [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[#c5b358]/50">
              <Command.Item
                id="cmd-long-rest"
                onSelect={() => {
                  handleLongRest();
                  onClose();
                }}
                className={COMMAND_ITEM_CLASS}
              >
                <div className="flex items-center gap-3">
                  <Moon className="w-4 h-4 text-[#c5b358]" />
                  <span>Long Rest</span>
                </div>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="── Settings ──" className="px-2 py-1.5 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:font-sans [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[#c5b358]/50">
              <Command.Item
                id="cmd-open-settings"
                onSelect={() => {
                  window.dispatchEvent(new CustomEvent('gm-change-tab', { detail: 'settings' }));
                  onClose();
                }}
                className={COMMAND_ITEM_CLASS}
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-[#c5b358]" />
                  <span>Open Settings</span>
                </div>
              </Command.Item>
              <Command.Item
                id="cmd-test-death"
                onSelect={() => {
                  testDeathAnimation();
                  onClose();
                }}
                className={COMMAND_ITEM_CLASS}
              >
                <div className="flex items-center gap-3">
                  <Skull className="w-4 h-4 text-[#c5b358]" />
                  <span>Test Death Animation</span>
                </div>
              </Command.Item>
              <Command.Item
                id="cmd-test-damage"
                onSelect={() => {
                  testDamageAnimation();
                  onClose();
                }}
                className={COMMAND_ITEM_CLASS}
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4 text-[#c5b358]" />
                  <span>Test Damage Animation</span>
                </div>
              </Command.Item>
              <Command.Item
                id="cmd-test-heal"
                onSelect={() => {
                  testHealAnimation();
                  onClose();
                }}
                className={COMMAND_ITEM_CLASS}
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-[#c5b358]" />
                  <span>Test Heal Animation</span>
                </div>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
