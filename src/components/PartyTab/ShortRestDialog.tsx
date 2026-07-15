import React, { useState, useEffect } from 'react';
import { Heart, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Character } from '../../types';
import { getHitDiceStatus, spendHitDice } from '../../lib/hitDice';
import { parseDiceNotation, rollDice } from '../../lib/diceRoller';
import { toast } from 'sonner';
import { DialogShell } from '../ui/DialogShell';
import { Button } from '../ui/Button';
import { Accordion } from '../ui/Accordion';
import { Callout } from '../ui/Callout';
import { SectionHeader } from '../ui/SectionHeader';
import { effectiveMaxHp } from '../../lib/conditions';
import { LabeledField } from '../ui/LabeledField';

interface ShortRestDialogProps {
  isOpen: boolean;
  characters: Character[];
  onConfirm: (
    results: Array<{
      characterId: string;
      hpToAdd: number;
      newHitDiceUsed: string;
    }>
  ) => void;
  onClose: () => void;
}

interface CharRestState {
  participating: boolean;
  hpToAdd: number;
  spend: Record<string, number>; // Record of die key (e.g., 'd12') to spent count
  rollResults: Record<string, number | null>; // Record of die key to latest roll
}

export function ShortRestDialog({ isOpen, characters, onConfirm, onClose }: ShortRestDialogProps) {
  const [restStates, setRestStates] = useState<Record<string, CharRestState>>({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Initialize state when open
  useEffect(() => {
    if (isOpen) {
      const initialStates: Record<string, CharRestState> = {};
      const initialExpanded = new Set<string>();

      characters.forEach(char => {
        const isDeceased = char.statusId === 3;
        const hdStatus = getHitDiceStatus(char.hitDiceConfig || '', char.hitDiceUsed || '{}');
        const spendInit: Record<string, number> = {};
        const rollResultsInit: Record<string, number | null> = {};

        hdStatus.forEach(pool => {
          spendInit[`d${pool.die}`] = 0;
          rollResultsInit[`d${pool.die}`] = null;
        });

        initialStates[char.id] = {
          participating: !isDeceased,
          hpToAdd: 0,
          spend: spendInit,
          rollResults: rollResultsInit,
        };
        
        // Expand the first checked character by default for better UX, or let them click
        if (!isDeceased) {
          initialExpanded.add(char.id);
        }
      });

      setRestStates(initialStates);
      setExpandedIds(initialExpanded);
    }
  }, [isOpen, characters]);

  const toggleParticipating = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent expanding on checkbox click
    const char = characters.find(c => c.id === id);
    if (char?.statusId === 3) return;
    setRestStates(prev => {
      const current = prev[id] || { participating: false, hpToAdd: 0, spend: {}, rollResults: {} };
      return {
        ...prev,
        [id]: {
          ...current,
          participating: !current.participating,
        }
      };
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateSpend = (charId: string, dieKey: string, delta: number, maxAvailable: number) => {
    setRestStates(prev => {
      const current = prev[charId];
      if (!current) return prev;

      const currentVal = current.spend[dieKey] ?? 0;
      const newVal = Math.max(0, Math.min(maxAvailable, currentVal + delta));

      return {
        ...prev,
        [charId]: {
          ...current,
          spend: {
            ...current.spend,
            [dieKey]: newVal,
          }
        }
      };
    });
  };

  const updateHpToAdd = (charId: string, value: number, maxAllowed: number) => {
    const capped = Math.max(0, Math.min(maxAllowed, value));
    setRestStates(prev => {
      const current = prev[charId];
      if (!current) return prev;
      return {
        ...prev,
        [charId]: {
          ...current,
          hpToAdd: capped,
        }
      };
    });
  };

  const handleRollDice = (charId: string, charName: string, dieSize: number) => {
    try {
      const notation = `1d${dieSize}`;
      const parsed = parseDiceNotation(notation);
      const result = rollDice(parsed, notation);
      const rollVal = result.total;

      // Update inline roll results
      setRestStates(prev => {
        const current = prev[charId];
        if (!current) return prev;
        return {
          ...prev,
          [charId]: {
            ...current,
            rollResults: {
              ...current.rollResults,
              [`d${dieSize}`]: rollVal,
            }
          }
        };
      });

      toast.success(`${charName} rolled ${rollVal} on d${dieSize}!`, {
        description: `Use this as reference. CON modifier needs to be added manually.`,
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to roll dice');
    }
  };

  const handleApply = () => {
    try {
      const resultsPayload = characters
        .filter(char => restStates[char.id]?.participating)
        .map(char => {
          const stateForChar = restStates[char.id];
          let currentUsedJson = char.hitDiceUsed || '{}';

          // Add spending during this rest to used count
          Object.entries(stateForChar.spend).forEach(([dieKey, spendCount]) => {
            if (spendCount > 0) {
              const dieSize = parseInt(dieKey.replace('d', ''), 10);
              currentUsedJson = spendHitDice(char.hitDiceConfig || '', currentUsedJson, dieSize, spendCount);
            }
          });

          return {
            characterId: char.id,
            hpToAdd: stateForChar.hpToAdd,
            newHitDiceUsed: currentUsedJson,
          };
        });

      onConfirm(resultsPayload);
    } catch (err) {
      console.error(err);
      toast.error('Failed to apply short rest due to invalid hit dice configuration.');
    }
  };

  const parsedCharactersCount = characters.filter(char => restStates[char.id]?.participating).length;

  return (
    <DialogShell
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      title="Short Rest"
      subtitle="Characters may spend Hit Dice to recover HP."
      icon={<Heart className="w-5 h-5 text-[#2563eb]" />}
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button
            intent="secondary"
            onClick={onClose}
            id="short-rest-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            intent="primary"
            onClick={handleApply}
            disabled={parsedCharactersCount === 0}
            id="short-rest-apply-btn"
          >
            Apply Short Rest
          </Button>
        </div>
      }
    >
      <div className="overflow-y-auto space-y-4 max-h-[60vh]">
        {characters.length === 0 ? (
          <p className="text-[#8d8db9] text-center text-sm py-4 italic">No active characters to select.</p>
        ) : (
          characters.map(char => {
            const isDeceased = char.statusId === 3;
            const charState = restStates[char.id] || { participating: false, hpToAdd: 0, spend: {}, rollResults: {} };
            const isChecked = charState.participating;
            const isExpanded = expandedIds.has(char.id) && isChecked && !isDeceased;

            const hdStatus = getHitDiceStatus(char.hitDiceConfig || '', char.hitDiceUsed || '{}');
            const remainingCountTotal = hdStatus.reduce((sum, p) => sum + p.remaining, 0);
            const maxAllowedHP = Math.max(
              0,
              effectiveMaxHp(char.maxHp, char.tempHpMax) - char.currentHp
            );

            return (
              <div
                key={char.id}
                className="border border-[#e2e8f0] rounded-xl overflow-hidden bg-white shadow-sm"
                id={`short-rest-char-card-${char.id}`}
              >
                {/* Collapse/Expand Row Header */}
                <div
                  className={`flex items-center pl-4 select-none transition-colors ${
                    isDeceased
                      ? 'bg-gray-50/50 opacity-40 cursor-not-allowed'
                      : isChecked
                        ? 'bg-[#f0f7ff] hover:bg-[#f0f7ff]/80'
                        : 'bg-gray-50/50 opacity-60'
                  }`}
                  id={`short-rest-header-${char.id}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isDeceased}
                    onChange={(e) => {}} // custom handled via toggleParticipating
                    onClick={(e) => {
                      if (isDeceased) return;
                      toggleParticipating(char.id, e);
                    }}
                    className="w-4 h-4 rounded text-[#2563eb] border-[#e2e8f0] focus:ring-[#2563eb] cursor-pointer accent-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    id={`short-rest-checkbox-${char.id}`}
                  />
                  
                  <Accordion
                    isExpanded={isExpanded}
                    onToggle={() => !isDeceased && isChecked && toggleExpand(char.id)}
                    disabled={isDeceased || !isChecked}
                    hideChevron={!isChecked}
                    size="default"
                    className="flex-1 bg-transparent hover:bg-transparent"
                    rightContent={
                      <div className="flex items-center gap-4 text-xs">
                        <span className="bg-[#8d8db9]/5 px-2.5 py-1 rounded text-[#8d8db9] font-mono">
                          HP: {char.currentHp}/{char.maxHp}
                        </span>
                        <span className="bg-[#2563eb]/10 text-[#567eff] px-2.5 py-1 rounded font-mono">
                          HD Available: {remainingCountTotal}
                        </span>
                      </div>
                    }
                  >
                    <div>
                      <span className="font-serif font-bold text-[#0f172a] text-sm">
                        {char.characterName}
                        {isDeceased && (
                          <span className="text-red-500 font-sans text-[10px] ml-2 font-semibold bg-red-50 px-1.5 py-0.5 rounded border border-red-100 uppercase">
                            Deceased
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-[#8d8db9]/70 font-sans ml-2">
                        ({char.playerName})
                      </span>
                    </div>
                  </Accordion>
                </div>

                {/* Expandable Body */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-[#e2e8f0] bg-[#ffffff] p-5 space-y-4"
                      id={`short-rest-expanded-${char.id}`}
                    >
                      {/* Hit Dice Config Empty Check */}
                      {!char.hitDiceConfig || hdStatus.length === 0 ? (
                        <Callout severity="warning">
                          <p id={`no-hd-config-${char.id}`}>
                            No hit dice configured. Add a Hit Dice Config to this character's sheet row (e.g. '7d8').
                          </p>
                        </Callout>
                      ) : (
                        <div className="space-y-3.5">
                          <SectionHeader>
                            Dice Spending & Rolling
                          </SectionHeader>
                          {hdStatus.map(pool => {
                            const poolKey = `d${pool.die}`;
                            const spendCount = charState.spend[poolKey] ?? 0;
                            const lastRollResult = charState.rollResults[poolKey];

                            return (
                              <div
                                key={pool.die}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white border border-[#e2e8f0] p-3 rounded-xl gap-3"
                                id={`pool-row-d${pool.die}`}
                              >
                                {/* Die Name and Remaining */}
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="inline-block bg-[#0f172a] text-[#e2e8f0] px-2 py-0.5 rounded text-xs font-serif font-bold">
                                    d{pool.die}
                                  </span>
                                  <span className="text-[#8d8db9] text-xs">
                                    {pool.remaining} remaining
                                  </span>
                                </div>

                                {/* Counter inputs & trigger roll */}
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-0.5">
                                    <button
                                      type="button"
                                      onClick={() => updateSpend(char.id, poolKey, -1, pool.remaining)}
                                      className="w-7 h-7 text-gray-500 hover:text-black hover:bg-gray-200 rounded flex items-center justify-center font-bold text-sm"
                                      id={`btn-minus-d${pool.die}-${char.id}`}
                                    >
                                      -
                                    </button>
                                    <span className="w-8 text-center text-xs font-mono font-bold text-gray-800" id={`spend-count-d${pool.die}-${char.id}`}>
                                      {spendCount}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => updateSpend(char.id, poolKey, 1, pool.remaining)}
                                      className="w-7 h-7 text-gray-500 hover:text-black hover:bg-gray-200 rounded flex items-center justify-center font-bold text-sm"
                                      id={`btn-plus-d${pool.die}-${char.id}`}
                                    >
                                      +
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRollDice(char.id, char.characterName, pool.die)}
                                    className="text-xs flex items-center gap-1 py-1.5 px-3 border border-[#bdbaa3] text-[#8d8db9] hover:text-[#0f172a] hover:bg-gray-100 rounded-lg transition-all"
                                    id={`btn-roll-d${pool.die}-${char.id}`}
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Roll 1d{pool.die}
                                  </button>

                                  {/* Inline Roll Result Indicator */}
                                  {lastRollResult !== null && (
                                    <span className="text-xs bg-[#f9f8ff] text-[#567eff] font-mono font-bold px-2 py-0.5 rounded border border-amber-200/50">
                                      Rolled {lastRollResult}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* HP Input */}
                          <div className="pt-2">
                            <LabeledField
                              label={
                                <>
                                  HP to recover <span className="text-[10px] lowercase text-[#8d8db9]/60">(max {maxAllowedHP} missing)</span>
                                </>
                              }
                              htmlFor={`hp-recover-input-${char.id}`}
                              size="default"
                            >
                              <input
                                type="number"
                                min="0"
                                max={maxAllowedHP}
                                value={charState.hpToAdd}
                                onChange={e => updateHpToAdd(char.id, parseInt(e.target.value) || 0, maxAllowedHP)}
                                className="bg-white border border-[#e2e8f0] rounded-xl text-[#0f172a] placeholder:text-[#8d8db9] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/50 focus:outline-none w-full px-3 py-2 text-sm transition-all font-mono"
                                placeholder="Enter total HP recovered..."
                                id={`hp-recover-input-${char.id}`}
                              />
                            </LabeledField>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </DialogShell>
  );
}
