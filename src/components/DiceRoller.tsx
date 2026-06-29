import { STORAGE_KEYS, TIMERS } from '../lib/constants';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  ChevronUp, 
  Dices, 
  RotateCcw, 
  History, 
  AlertCircle 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { parseDiceNotation, rollDice, RollResult } from '../lib/diceRoller';

export function DiceRoller() {
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.diceRollerExpanded);
    return stored === 'true';
  });

  const [notationInput, setNotationInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentRoll, setCurrentRoll] = useState<RollResult | null>(null);
  const [history, setHistory] = useState<RollResult[]>([]);
  const [timeTick, setTimeTick] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Sync expanded status to localStorage
  const handleToggleExpand = () => {
    setIsExpanded(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEYS.diceRollerExpanded, String(next));
      return next;
    });
  };

  useEffect(() => {
    const handleFocusEvent = () => {
      setIsExpanded(true);
      localStorage.setItem(STORAGE_KEYS.diceRollerExpanded, 'true');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 100);
    };
    window.addEventListener('gm-cmd-focus-dice', handleFocusEvent);
    return () => {
      window.removeEventListener('gm-cmd-focus-dice', handleFocusEvent);
    };
  }, []);

  // Timer to force-refresh relative times
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTick(prev => prev + 1);
    }, TIMERS.diceRollerTickMs);
    return () => clearInterval(interval);
  }, []);

  // Perform rolling execution
  const handleRoll = (rawInput: string) => {
    if (!rawInput.trim()) return;
    try {
      setErrorMsg(null);
      const parsed = parseDiceNotation(rawInput);
      const result = rollDice(parsed, rawInput);
      
      setCurrentRoll(result);
      setHistory(prev => {
        const nextHist = [result, ...prev];
        return nextHist.slice(0, 5); // Keep max 5 entries
      });
    } catch (err: any) {
      setErrorMsg(err?.message || "Invalid dice notation");
      // Auto-dismiss error after 4s
      setTimeout(() => {
        setErrorMsg(prev => prev === (err?.message || "Invalid dice notation") ? null : prev);
      }, TIMERS.diceRollerSettleMs);
    }
  };

  const handleRollSubmit = () => {
    handleRoll(notationInput);
  };

  const clearHistory = () => {
    setHistory([]);
    setCurrentRoll(null);
  };

  // Quick dice rollers
  const quickDice = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

  // Match relative time calculator
  const getRelativeTime = (timestamp: number) => {
    const diff = Math.max(0, Date.now() - timestamp);
    if (diff < 10000) return 'just now';
    if (diff < 60000) return 'seconds ago';
    const mins = Math.floor(diff / 60000);
    if (mins === 1) return '1 min ago';
    if (mins < 60) return `${mins} mins ago`;
    return 'earlier';
  };

  return (
    <div 
      className={cn(
        "relative flex flex-col bg-white rounded-xl shadow-2xl border border-[#e2e8f0] text-stone-900 overflow-visible transition-all font-sans",
        "w-44 h-11"
      )}
    >
      {/* Mini Collapsed / Expanded Header */}
      <div 
        onClick={handleToggleExpand}
        className="h-11 w-full bg-[#f9f8ff] rounded-xl border-b border-[#e2e8f0] flex items-center justify-between px-3.5 cursor-pointer hover:bg-[#e2e8f0] transition-colors select-none"
      >
        <div className="flex items-center gap-2 text-[#0f172a]">
          <Dices className="w-5 h-5 text-[#2563eb]" />
          <span className="text-xs font-bold uppercase tracking-wider font-sans">Dice Roller</span>
        </div>
        <div className="text-stone-500">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </div>

      {/* Main Panel Content Area */}
      {isExpanded && (
        <div className="absolute top-full mt-2 right-0 w-80 sm:w-96 p-4 flex flex-col gap-3.5 bg-white rounded-xl shadow-2xl border border-[#e2e8f0] max-h-[480px] overflow-y-auto z-50">
          
          {/* Main Notation Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={notationInput}
                onChange={e => {
                  setNotationInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRollSubmit();
                  }
                }}
                placeholder="2d6+5, 1d20 adv, 4d6 drop"
                className="flex-1 min-w-0 px-3 py-1.5 text-sm bg-[#f9f8ff]/60 border border-[#e2e8f0] rounded focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none font-mono"
              />
              <button
                onClick={handleRollSubmit}
                className="px-4 py-1.5 bg-[#2563eb] text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-[#567eff] transition-colors cursor-pointer shrink-0"
              >
                ROLL
              </button>
            </div>

            {/* Error Message display */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-xs text-red-650 bg-red-50 border border-red-100 rounded p-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="font-sans leading-none">{errorMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Roll buttons row */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-bold text-[#8d8db9]/60 uppercase tracking-widest mr-1">Quick:</span>
            {quickDice.map(die => (
              <button
                key={die}
                onClick={() => handleRoll(die)}
                className="px-2 py-1 bg-[#f9f8ff] border border-[#e2e8f0] hover:border-[#2563eb] hover:bg-[#2563eb]/5 rounded text-xs font-bold text-[#8d8db9] transition-colors cursor-pointer"
              >
                {die}
              </button>
            ))}
          </div>

          {/* Current Prominent Result Display */}
          {currentRoll && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              key={`${currentRoll.timestamp}-${currentRoll.total}`}
              className="bg-[#f9f8ff] rounded-xl border border-[#e2e8f0] p-4 flex flex-col gap-2.5 relative"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-[#8d8db9]/60 uppercase tracking-widest leading-none">Result — {currentRoll.notation}</span>
                <span className="text-[10px] font-mono text-stone-400 leading-none">{getRelativeTime(currentRoll.timestamp)}</span>
              </div>

              {/* Total display */}
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl font-bold font-serif tracking-tight text-[#0f172a] leading-none">
                  {currentRoll.total}
                </h2>
                {currentRoll.modifier !== 0 && (
                  <span className="text-sm font-sans font-medium text-stone-500">
                    ({currentRoll.total - currentRoll.modifier} {currentRoll.modifier > 0 ? `+ ${currentRoll.modifier}` : `- ${Math.abs(currentRoll.modifier)}`})
                  </span>
                )}
              </div>

              {/* Individual Roll groups and chips */}
              <div className="flex flex-col gap-1.5 pt-1.5 border-t border-[#e2e8f0]/60">
                {currentRoll.groups.map((group, groupIdx) => {
                  // Resolve which dice were kept and which were dropped preserving order
                  const remainingKept = [...group.kept];
                  const chips = group.rolls.map((rollVal, rIdx) => {
                    const keepIdx = remainingKept.indexOf(rollVal);
                    const isKept = keepIdx > -1;
                    if (isKept) {
                      remainingKept.splice(keepIdx, 1);
                    }
                    return { value: rollVal, isKept };
                  });

                  return (
                    <div key={groupIdx} className="flex flex-wrap items-center gap-1.5 text-stone-700">
                      <span className="text-[10px] font-mono text-[#8d8db9]/60 shrink-0">d{group.sides}:</span>
                      <div className="flex flex-wrap gap-1">
                        {chips.map((chip, cIdx) => (
                          <span 
                            key={cIdx} 
                            className={cn(
                              "inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded text-xs font-mono font-bold border",
                              chip.isKept 
                                ? "bg-white border-[#2563eb]/50 text-stone-900 shadow-sm"
                                : "bg-stone-100 border-stone-200 text-stone-400 line-through opacity-50"
                            )}
                          >
                            {chip.value}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-stone-500 font-serif ml-1">
                        = {group.subtotal}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* History of rolls list */}
          {history.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between border-t border-[#e2e8f0] pt-3.5">
                <div className="flex items-center gap-1.5">
                  <History className="w-4 h-4 text-[#8d8db9]/50" />
                  <span className="text-[10px] font-bold text-[#8d8db9]/60 uppercase tracking-widest leading-none">Roll History</span>
                </div>
                <button
                  onClick={clearHistory}
                  className="text-[10px] font-bold text-red-700 hover:text-red-900 active:underline flex items-center gap-0.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>CLEAR</span>
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {history.map((histItem, idx) => (
                  <div
                    key={histItem.timestamp + idx}
                    onClick={() => {
                      // Clicking a history item re-rolls it! Incredible addition for usability!
                      handleRoll(histItem.notation);
                    }}
                    className="flex items-center justify-between p-2 py-1.5 bg-[#f9f8ff]/40 hover:bg-[#2563eb]/5 border border-[#e2e8f0]/40 rounded-lg cursor-pointer transition-colors"
                    title="Click to roll again"
                  >
                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                      <span className="text-xs font-mono text-stone-500 bg-stone-100/60 border border-stone-200 px-1 py-0.5 rounded leading-none shrink-0">{histItem.notation}</span>
                      <span className="text-[10px] text-stone-400 truncate leading-none">{getRelativeTime(histItem.timestamp)}</span>
                    </div>
                    <span className="text-sm font-bold text-[#0f172a] shrink-0 font-serif pr-1">
                      {histItem.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
