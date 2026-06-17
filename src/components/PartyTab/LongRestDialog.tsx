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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#2c2c26]/60 backdrop-blur-sm"
            onClick={onClose}
            id="long-rest-overlay"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#fdfaf5] w-full max-w-lg rounded-2xl shadow-2xl border border-[#e5e1d8] overflow-hidden flex flex-col relative z-10"
            id="long-rest-dialog"
          >
            {/* Header */}
            <div className="bg-[#2c2c26] p-5 text-[#e5e1d8] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-[#c5b358]" />
                <div>
                  <h2 className="text-lg font-bold font-serif uppercase tracking-wider">Long Rest</h2>
                  <p className="text-xs text-white/60">Select which characters are taking a long rest.</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                title="Close"
                id="long-rest-close-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="p-6 max-h-[50vh] overflow-y-auto space-y-3">
              {characters.length === 0 ? (
                <p className="text-[#5a5a40] text-center text-sm py-4 italic">No active characters to select.</p>
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
                          ? 'bg-[#c5b358]/5 border-[#c5b358] shadow-sm'
                          : 'bg-white border-[#e5e1d8] hover:border-[#bdbaa3]'
                      }`}
                      id={`char-row-${char.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // toggled via row click
                            className="w-4 h-4 rounded text-[#c5b358] border-[#e5e1d8] focus:ring-[#c5b358] cursor-pointer accent-[#c5b358]"
                            id={`checkbox-${char.id}`}
                          />
                          <div>
                            <span className="font-serif font-bold text-[#2c2c26] text-sm block">
                              {char.characterName}
                            </span>
                            <span className="text-xs text-[#5a5a40]/70 italic block">
                              {char.playerName}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono text-[#5a5a40]">
                          <span className="bg-[#5a5a40]/5 px-2 py-1 rounded border border-[#e5e1d8]">
                            HP: {char.currentHp}/{char.maxHp}
                          </span>
                          <span className="bg-[#c5b358]/10 text-[#85711a] px-2 py-1 rounded border border-[#c5b358]/20" title={totalHD > 0 ? `Will recover up to ${recoverHD} of ${totalHD} spent dice` : undefined}>
                            Hit Dice: {remainingHD} remaining
                          </span>
                        </div>
                      </div>
                      
                      {totalHD > 0 && isChecked && (
                        <div className="mt-2 text-[11px] text-[#85711a] ml-7 italic">
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
            <div className="bg-[#fcfaf2] p-5 border-t border-[#e5e1d8] flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-[#e5e1d8] text-[#5a5a40] hover:text-[#2c2c26] hover:bg-[#5a5a40]/5 hover:border-[#bdbaa3] rounded-xl text-sm font-medium transition-colors"
                id="long-rest-cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={selectedIds.length === 0}
                title={selectedIds.length === 0 ? "Select at least one character" : "Apply Long Rest to selected characters"}
                className="px-5 py-2 bg-[#c5b358] hover:bg-[#a39240] disabled:bg-[#e5e1d8] disabled:text-[#bdbaa3] disabled:cursor-not-allowed text-[#fdfaf5] hover:text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-1.5"
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
