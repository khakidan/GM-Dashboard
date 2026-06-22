import React, { useState, useEffect } from 'react';
import { X, Heart, ChevronDown, ChevronUp, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Character } from '../../types';
import { getHitDiceStatus, parseHitDiceUsed, serializeHitDiceUsed, spendHitDice } from '../../lib/hitDice';
import { parseDiceNotation, rollDice } from '../../lib/diceRoller';
import { toast } from 'sonner';

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
        const hdStatus = getHitDiceStatus(char.hitDiceConfig || '', char.hitDiceUsed || '{}');
        const spendInit: Record<string, number> = {};
        const rollResultsInit: Record<string, number | null> = {};

        hdStatus.forEach(pool => {
          spendInit[`d${pool.die}`] = 0;
          rollResultsInit[`d${pool.die}`] = null;
        });

        initialStates[char.id] = {
          participating: true,
          hpToAdd: 0,
          spend: spendInit,
          rollResults: rollResultsInit,
        };
        
        // Expand the first checked character by default for better UX, or let them click
        initialExpanded.add(char.id);
      });

      setRestStates(initialStates);
      setExpandedIds(initialExpanded);
    }
  }, [isOpen, characters]);

  const toggleParticipating = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent expanding on checkbox click
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#2c2c26]/60 backdrop-blur-sm"
            onClick={onClose}
            id="short-rest-overlay"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#fdfaf5] w-full max-w-2xl rounded-2xl shadow-xl border border-[#e5e1d8] overflow-hidden flex flex-col relative z-10"
            id="short-rest-dialog"
          >
            {/* Header */}
            <div className="bg-[#2c2c26] px-6 py-4 text-[#fdfaf5] flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-[#c5b358]" />
                <div>
                  <h2 className="text-lg font-bold font-serif uppercase tracking-wider">Short Rest</h2>
                  <p className="text-xs text-[#e5e1d8]/60">Characters may spend Hit Dice to recover HP.</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-[#e5e1d8] hover:text-white"
                title="Close"
                id="short-rest-close-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="p-6 overflow-y-auto space-y-4 max-h-[60vh]">
              {characters.length === 0 ? (
                <p className="text-[#5a5a40] text-center text-sm py-4 italic">No active characters to select.</p>
              ) : (
                characters.map(char => {
                  const charState = restStates[char.id] || { participating: false, hpToAdd: 0, spend: {}, rollResults: {} };
                  const isChecked = charState.participating;
                  const isExpanded = expandedIds.has(char.id) && isChecked;

                  const hdStatus = getHitDiceStatus(char.hitDiceConfig || '', char.hitDiceUsed || '{}');
                  const remainingCountTotal = hdStatus.reduce((sum, p) => sum + p.remaining, 0);
                  const maxAllowedHP = Math.max(0, char.maxHp - char.currentHp);

                  return (
                    <div
                      key={char.id}
                      className="border border-[#e5e1d8] rounded-xl overflow-hidden bg-white shadow-sm"
                      id={`short-rest-char-card-${char.id}`}
                    >
                      {/* Collapse/Expand Row Header */}
                      <div
                        onClick={() => isChecked && toggleExpand(char.id)}
                        className={`flex items-center justify-between p-4 cursor-pointer select-none transition-colors ${
                          isChecked ? 'bg-[#fdf4c2] hover:bg-[#fdf4c2]/80' : 'bg-gray-50/50 opacity-60'
                        }`}
                        id={`short-rest-header-${char.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {}} // custom handled via toggleParticipating
                            onClick={(e) => toggleParticipating(char.id, e)}
                            className="w-4 h-4 rounded text-[#c5b358] border-[#e5e1d8] focus:ring-[#c5b358] cursor-pointer accent-[#c5b358]"
                            id={`short-rest-checkbox-${char.id}`}
                          />
                          <div>
                            <span className="font-serif font-bold text-[#2c2c26] text-sm">
                              {char.characterName}
                            </span>
                            <span className="text-[10px] text-[#5a5a40]/70 font-sans ml-2">
                              ({char.playerName})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                          <span className="bg-[#5a5a40]/5 px-2.5 py-1 rounded text-[#5a5a40] font-mono">
                            HP: {char.currentHp}/{char.maxHp}
                          </span>
                          <span className="bg-[#c5b358]/10 text-[#85711a] px-2.5 py-1 rounded font-mono">
                            HD Available: {remainingCountTotal}
                          </span>
                          {isChecked && (
                            <span className="text-[#5a5a40]">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expandable Body */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-[#e5e1d8] bg-[#fdfaf5] p-5 space-y-4"
                            id={`short-rest-expanded-${char.id}`}
                          >
                            {/* Hit Dice Config Empty Check */}
                            {!char.hitDiceConfig || hdStatus.length === 0 ? (
                              <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 text-amber-800 border border-amber-200/50 rounded-xl text-xs">
                                <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                                <p id={`no-hd-config-${char.id}`}>
                                  No hit dice configured. Add a Hit Dice Config to this character's sheet row (e.g. '7d8').
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-3.5">
                                <h3 className="text-[#5a5a40] text-xs font-bold uppercase tracking-widest border-b border-[#e5e1d8] pb-1 mb-2">
                                  Dice Spending & Rolling
                                </h3>
                                {hdStatus.map(pool => {
                                  const poolKey = `d${pool.die}`;
                                  const spendCount = charState.spend[poolKey] ?? 0;
                                  const lastRollResult = charState.rollResults[poolKey];

                                  return (
                                    <div
                                      key={pool.die}
                                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white border border-[#e5e1d8] p-3 rounded-xl gap-3"
                                      id={`pool-row-d${pool.die}`}
                                    >
                                      {/* Die Name and Remaining */}
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className="inline-block bg-[#2c2c26] text-[#e5e1d8] px-2 py-0.5 rounded text-xs font-serif font-bold">
                                          d{pool.die}
                                        </span>
                                        <span className="text-[#5a5a40] text-xs">
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
                                          className="text-xs flex items-center gap-1 py-1.5 px-3 border border-[#bdbaa3] text-[#5a5a40] hover:text-[#2c2c26] hover:bg-gray-100 rounded-lg transition-all"
                                          id={`btn-roll-d${pool.die}-${char.id}`}
                                        >
                                          <RefreshCw className="w-3.5 h-3.5" />
                                          Roll 1d{pool.die}
                                        </button>

                                        {/* Inline Roll Result Indicator */}
                                        {lastRollResult !== null && (
                                          <span className="text-xs bg-amber-50 text-amber-700 font-mono font-bold px-2 py-0.5 rounded border border-amber-200/50">
                                            Rolled {lastRollResult}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* HP Input */}
                                <div className="pt-2">
                                  <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-2 px-1">
                                    HP to recover <span className="text-[10px] lowercase text-[#5a5a40]/60">(max {maxAllowedHP} missing)</span>
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max={maxAllowedHP}
                                    value={charState.hpToAdd}
                                    onChange={e => updateHpToAdd(char.id, parseInt(e.target.value) || 0, maxAllowedHP)}
                                    className="bg-white border border-[#e5e1d8] rounded-xl text-[#2c2c26] placeholder:text-[#5a5a40] focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358]/50 focus:outline-none w-full px-3 py-2 text-sm transition-all font-mono"
                                    placeholder="Enter total HP recovered..."
                                    id={`hp-recover-input-${char.id}`}
                                  />
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

            {/* Footer */}
            <div className="bg-[#fdfaf5] px-6 py-4 border-t border-[#e5e1d8] flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="text-[#5a5a40] border border-[#e5e1d8] rounded-xl px-3 py-1.5 text-xs hover:border-[#c5b358] hover:text-[#2c2c26] transition-colors"
                id="short-rest-cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={parsedCharactersCount === 0}
                className="bg-[#c5b358] text-[#2c2c26] font-bold uppercase tracking-widest text-xs rounded-xl px-4 py-2 hover:bg-[#d4c47a] transition-colors disabled:bg-[#e5e1d8] disabled:text-[#5a5a40] disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
                id="short-rest-apply-btn"
              >
                Apply Short Rest
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
