import React, { useState, useEffect } from 'react';
import { X, Moon, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Character } from '../../types';
import { getHitDiceStatus, getTotalHitDiceCount } from '../../lib/hitDice';

interface LongRestDialogProps {
  isOpen: boolean;
  characters: Character[];
  onConfirm: (selectedIds: string[]) => void;
  onClose: () => void;
}

export function LongRestDialog({ isOpen, characters, onConfirm, onClose }: LongRestDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(characters.map(c => c.id));
    }
  }, [isOpen, characters]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    if (selectedIds.length === 0) return;
    onConfirm(selectedIds);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm"
            onClick={onClose}
            id="long-rest-overlay"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#ffffff] w-full max-w-lg rounded-2xl shadow-xl border border-[#e2e8f0] overflow-hidden flex flex-col relative z-10"
            id="long-rest-dialog"
          >
            {/* Header */}
            <div className="bg-[#0f172a] px-6 py-4 text-[#ffffff] flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-[#2563eb]" />
                <div>
                  <h2 className="text-lg font-bold font-serif uppercase tracking-wider">Long Rest</h2>
                  <p className="text-xs text-[#e2e8f0]/60">Select which characters are taking a long rest.</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-[#e2e8f0] hover:text-white"
                title="Close"
                id="long-rest-close-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="p-6 max-h-[50vh] overflow-y-auto space-y-3">
              {characters.length === 0 ? (
                <p className="text-[#8d8db9] text-center text-sm py-4 italic">No active characters to select.</p>
              ) : (
                characters.map(char => {
                  const isChecked = selectedIds.includes(char.id);
                  const hdStatus = getHitDiceStatus(char.hitDiceConfig || '', char.hitDiceUsed || '{}');
                  const remainingHD = hdStatus.reduce((sum, p) => sum + p.remaining, 0);
                  const totalHD = getTotalHitDiceCount(char.hitDiceConfig || '');
                  const recoverHD = Math.ceil(totalHD / 2);

                  return (
                    <div
                      key={char.id}
                      onClick={() => toggleSelect(char.id)}
                      className={`flex flex-col p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'bg-[#f0f7ff] border-[#2563eb] shadow-sm'
                          : 'bg-white border-[#e2e8f0] hover:border-[#2563eb]'
                      }`}
                      id={`char-row-${char.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // toggled via row click
                            className="w-4 h-4 rounded text-[#2563eb] border-[#e2e8f0] focus:ring-[#2563eb] cursor-pointer accent-[#2563eb]"
                            id={`checkbox-${char.id}`}
                          />
                          <div>
                            <span className="font-serif font-bold text-[#0f172a] text-sm block">
                              {char.characterName}
                            </span>
                            <span className="text-xs text-[#8d8db9]/70 italic block">
                              {char.playerName}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono text-[#8d8db9]">
                          <span className="bg-[#8d8db9]/5 px-2 py-1 rounded border border-[#e2e8f0]">
                            HP: {char.currentHp}/{char.maxHp}
                          </span>
                          <span className="bg-[#2563eb]/10 text-[#567eff] px-2 py-1 rounded border border-[#2563eb]/20" title={totalHD > 0 ? `Will recover up to ${recoverHD} of ${totalHD} spent dice` : undefined}>
                            Hit Dice: {remainingHD} remaining
                          </span>
                        </div>
                      </div>
                      
                      {totalHD > 0 && isChecked && (
                        <div className="mt-2 text-[11px] text-[#567eff] ml-7 italic">
                          Will recover up to {recoverHD} of {totalHD} spent dice
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Warning tooltip helper if none checked */}
            {selectedIds.length === 0 && (
              <div className="px-6 pb-2 text-center" id="long-rest-warning-box">
                <span className="text-xs text-red-600 font-medium bg-red-50 px-3 py-1 rounded-full border border-red-100">
                  Select at least one character
                </span>
              </div>
            )}

            {/* Footer */}
            <div className="bg-[#ffffff] px-6 py-4 border-t border-[#e2e8f0] flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="text-[#8d8db9] border border-[#e2e8f0] rounded-xl px-3 py-1.5 text-xs hover:border-[#2563eb] hover:text-[#0f172a] transition-colors"
                id="long-rest-cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={selectedIds.length === 0}
                title={selectedIds.length === 0 ? "Select at least one character" : "Apply Long Rest to selected characters"}
                className="bg-[#2563eb] text-white font-bold uppercase tracking-widest text-xs rounded-xl px-4 py-2 hover:bg-[#567eff] transition-colors disabled:bg-[#e2e8f0] disabled:text-[#8d8db9] disabled:cursor-not-allowed disabled:opacity-60 shadow-sm flex items-center gap-1.5"
                id="long-rest-apply-btn"
              >
                <Heart className="w-4 h-4 fill-current text-white/20" />
                Apply Long Rest
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
