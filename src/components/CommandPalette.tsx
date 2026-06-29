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
  Sparkles,
  Music
} from 'lucide-react';
import { useParty } from './PartyTab/hooks/useParty';
import { useDeathEvent, useDamageEvent, useHealEvent, useInitiativeEvent } from '../hooks/useOverlayEvents';
import { StoredAudioFile } from '../lib/audioFileStore';
import { cn } from '../lib/utils';
import { MOODS, MoodId } from '../lib/constants';

const COMMAND_ITEM_CLASS = "w-full px-3 py-2.5 rounded-lg flex items-center justify-between text-xs font-semibold font-sans transition-all cursor-pointer text-stone-300 hover:bg-[#f9f8ff] hover:text-gray-900 border-l-2 border-transparent hover:border-amber-400 data-[selected='true']:bg-[#f9f8ff] data-[selected='true']:text-gray-900 data-[selected='true']:border-amber-400 data-[selected=true]:bg-[#f9f8ff] data-[selected=true]:text-gray-900 data-[selected=true]:border-amber-400";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  ambientFiles: StoredAudioFile[];
  onPlayAmbient: (fileId: string) => void;
  currentAmbientId: string | null;

  // Mood Presets Props
  activeMood: MoodId | null;
  assignments: Record<MoodId, string | null>;
  activateMood: (moodId: MoodId, playAmbient: (fileId: string) => void) => void;
}

export function CommandPalette({ 
  isOpen, 
  onClose,
  ambientFiles,
  onPlayAmbient,
  currentAmbientId,
  activeMood,
  assignments,
  activateMood
}: CommandPaletteProps) {
  const { state, updateState } = useAppState();
  const { handleLongRest: triggerLongRest } = useParty();
  const { fire: fireDeathEvent } = useDeathEvent();
  const { fire: fireDamageEvent } = useDamageEvent();
  const { fire: fireHealEvent } = useHealEvent();
  const { fire: fireInitiativeEvent } = useInitiativeEvent();

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
    fireDeathEvent({ characterName: 'Aldric the Brave' });
    toast('Death animation triggered', {
      description: 'Check the Player View to see the overlay.',
      duration: 3000,
    });
  };

  const testDamageAnimation = () => {
    fireDamageEvent({ combatantNames: ['Thorin Ironforge'], damageAmount: 47 });
    toast('Damage animation triggered — check the Player View.', {
      duration: 3000,
    });
  };

  const testHealAnimation = () => {
    fireHealEvent({ combatantNames: ['Seraphina Brightwell'], healAmount: 34 });
    toast('Heal animation triggered — check the Player View.', {
      duration: 3000,
    });
  };

  const handleLongRest = async () => {
    if (!confirm("Are you sure you want the party to take a long rest? This will reset all Current HP to Max HP and clear all Temp HP.")) return;
    const activeCharIds = state.characters.filter(c => c.isActive).map(c => c.id);
    await triggerLongRest(activeCharIds);
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
        className="w-full max-w-xl bg-[#0f172a] text-[#e2e8f0] rounded-2xl border border-[#3f3f37] overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <Command label="GM Command Palette" id="command-palette-command-wrapper" className="flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#3f3f37]">
            <Dices className="w-5 h-5 text-[#2563eb]" />
            <Command.Input
              id="command-palette-input"
              autoFocus
              placeholder="Type a command or search..."
              className="w-full bg-transparent outline-none border-none placeholder-stone-500 text-sm font-sans text-[#e2e8f0]"
            />
          </div>

          <Command.List id="command-palette-list" className="max-h-96 overflow-y-auto py-2 scrollbar-thin">
            <Command.Empty className="px-4 py-3 text-xs text-stone-500 font-medium font-sans">No commands found.</Command.Empty>

            <Command.Group heading="── Navigation ──" className="px-2 py-1.5 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:font-sans [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[#2563eb]/50">
              <Command.Item
                id="cmd-party-roster"
                onSelect={() => {
                  window.dispatchEvent(new CustomEvent('gm-change-tab', { detail: 'party' }));
                  onClose();
                }}
                className={COMMAND_ITEM_CLASS}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-[#2563eb]" />
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
                  <Map className="w-4 h-4 text-[#2563eb]" />
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
                  <Skull className="w-4 h-4 text-[#2563eb]" />
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
                  <Swords className="w-4 h-4 text-[#2563eb]" />
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
                  <ExternalLink className="w-4 h-4 text-[#2563eb]" />
                  <span>Player View</span>
                </div>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="── Create ──" className="px-2 py-1.5 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:font-sans [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[#2563eb]/50">
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
                  <Users className="w-4 h-4 text-[#2563eb]" />
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
                  <Skull className="w-4 h-4 text-[#2563eb]" />
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
                  <Map className="w-4 h-4 text-[#2563eb]" />
                  <span>+ New Encounter</span>
                </div>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="── Combat ──" className="px-2 py-1.5 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:font-sans [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[#2563eb]/50">
              {state.combatState.activeEncounterId && (
                <>
                  <Command.Item
                    id="cmd-next-turn"
                    onSelect={() => {
                      window.dispatchEvent(new CustomEvent('gm-cmd-next-turn'));
                      onClose();
                    }}
                    className={COMMAND_ITEM_CLASS}
                  >
                    <div className="flex items-center gap-3">
                      <Play className="w-4 h-4 text-[#2563eb]" />
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
                      <Dices className="w-4 h-4 text-[#2563eb]" />
                      <span>Roll NPC Initiative</span>
                    </div>
                  </Command.Item>
                </>
              )}
              <Command.Item
                id="cmd-call-for-initiative"
                disabled={!state.combatState.activeEncounterId}
                onSelect={() => {
                  if (state.combatState.activeEncounterId) {
                    fireInitiativeEvent(true);
                    onClose();
                  }
                }}
                className={cn(
                  COMMAND_ITEM_CLASS,
                  !state.combatState.activeEncounterId && "opacity-55 cursor-not-allowed hover:bg-transparent hover:text-stone-500 hover:border-transparent pointer-events-none"
                )}
                title={!state.combatState.activeEncounterId ? "Start an encounter first" : undefined}
              >
                <div className="flex items-center gap-3">
                  <Swords className="w-4 h-4 text-[#2563eb]" />
                  <span>Call for Initiative</span>
                </div>
                {!state.combatState.activeEncounterId && (
                  <span className="text-[10px] text-stone-500 italic mr-2" title="Start an encounter first">Start an encounter first</span>
                )}
                <kbd className="px-1.5 py-0.5 text-[10px] font-sans font-bold bg-[#1a1a14]/65 border border-[#3f3f37] rounded-md text-stone-400">C</kbd>
              </Command.Item>
              {state.combatState.activeEncounterId && (
                <Command.Item
                  id="cmd-open-tools"
                  onSelect={() => {
                    window.dispatchEvent(new CustomEvent('gm-cmd-open-tools'));
                    onClose();
                  }}
                  className={COMMAND_ITEM_CLASS}
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-[#2563eb]" />
                    <span>Open Tools</span>
                  </div>
                </Command.Item>
              )}
            </Command.Group>

            <Command.Group heading="── Dice ──" className="px-2 py-1.5 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:font-sans [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[#2563eb]/50">
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
                    <Dices className="w-4 h-4 text-[#2563eb]" />
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
                  <Sparkles className="w-4 h-4 text-[#2563eb]" />
                  <span>Roll Custom...</span>
                </div>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="── Party ──" className="px-2 py-1.5 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:font-sans [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[#2563eb]/50">
              <Command.Item
                id="cmd-long-rest"
                onSelect={() => {
                  handleLongRest();
                  onClose();
                }}
                className={COMMAND_ITEM_CLASS}
              >
                <div className="flex items-center gap-3">
                  <Moon className="w-4 h-4 text-[#2563eb]" />
                  <span>Long Rest</span>
                </div>
              </Command.Item>
              <Command.Item
                id="cmd-short-rest"
                onSelect={() => {
                  window.dispatchEvent(new CustomEvent('gm-change-tab', { detail: 'party' }));
                  updateState(prev => ({ ...prev, openDialog: 'shortRest' }));
                  onClose();
                }}
                className={COMMAND_ITEM_CLASS}
              >
                <div className="flex items-center gap-3">
                  <Moon className="w-4 h-4 text-[#2563eb]" />
                  <span>Short Rest</span>
                </div>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="── Audio ──" className="px-2 py-1.5 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:font-sans [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[#2563eb]/50">
              {/* Mood Presets Commands */}
              {MOODS.map((m) => {
                const assignedTrackId = assignments[m.id];
                const track = assignedTrackId ? ambientFiles.find(f => f.id === assignedTrackId) : null;
                
                let description = `${m.label} Music · No track assigned`;
                if (track) {
                  const truncName = track.name.length > 20 ? track.name.substring(0, 17) + '...' : track.name;
                  description = `${m.label} Music · ${truncName}`;
                }
                const isActive = activeMood === m.id;

                return (
                  <Command.Item
                    key={`cmd-mood-${m.id}`}
                    id={`cmd-mood-${m.id}`}
                    onSelect={() => {
                      activateMood(m.id, onPlayAmbient);
                      onClose();
                    }}
                    className={COMMAND_ITEM_CLASS}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base leading-none">{m.emoji}</span>
                      <div className="flex flex-col">
                        <span className="font-sans font-bold">{m.label} Music</span>
                        <span className="text-[10px] text-stone-500 font-sans mt-0.5">{description}</span>
                      </div>
                    </div>
                    {isActive && (
                      <span className="flex items-center mr-2 text-green-500 font-bold" data-testid="active-indicator">
                        ●
                      </span>
                    )}
                  </Command.Item>
                );
              })}

              {ambientFiles.length === 0 ? (
                <Command.Item
                  id="cmd-audio-empty"
                  disabled={true}
                  className="w-full px-3 py-2.5 rounded-lg flex items-center justify-between text-xs font-semibold font-sans transition-all text-stone-500 pointer-events-none"
                >
                  <div className="flex flex-col">
                    <span className="font-sans font-bold">No ambient tracks loaded</span>
                    <span className="text-[10px] text-stone-500 font-sans mt-0.5">Add tracks in the Audio panel → Library tab</span>
                  </div>
                </Command.Item>
              ) : (
                ambientFiles.map(file => (
                  <Command.Item
                    key={file.id}
                    id={`cmd-play-ambient-${file.id}`}
                    onSelect={() => {
                      onPlayAmbient(file.id);
                      onClose();
                    }}
                    className={COMMAND_ITEM_CLASS}
                  >
                    <div className="flex items-center gap-3">
                      <Music className="w-4 h-4 text-[#2563eb]" />
                      <div className="flex flex-col">
                        <span className="font-sans font-bold">{file.name}</span>
                        <span className="text-[10px] text-stone-500 font-sans mt-0.5">Ambient track</span>
                      </div>
                    </div>
                    {file.id === currentAmbientId && (
                      <span className="flex items-center mr-2" data-testid="active-indicator">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                      </span>
                    )}
                  </Command.Item>
                ))
              )}
            </Command.Group>

            <Command.Group heading="── Settings ──" className="px-2 py-1.5 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:font-sans [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[#2563eb]/50">
              <Command.Item
                id="cmd-open-settings"
                onSelect={() => {
                  window.dispatchEvent(new CustomEvent('gm-change-tab', { detail: 'settings' }));
                  onClose();
                }}
                className={COMMAND_ITEM_CLASS}
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-[#2563eb]" />
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
                  <Skull className="w-4 h-4 text-[#2563eb]" />
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
                  <Zap className="w-4 h-4 text-[#2563eb]" />
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
                  <Heart className="w-4 h-4 text-[#2563eb]" />
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
