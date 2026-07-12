import React, { useState, useEffect } from 'react';
import { Moon, Heart } from 'lucide-react';
import { Character } from '../../types';
import { getHitDiceStatus, getTotalHitDiceCount } from '../../lib/hitDice';
import { DialogShell } from '../ui/DialogShell';
import { Button } from '../ui/Button';

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
      setSelectedIds(characters.filter(c => c.statusId !== 3).map(c => c.id));
    }
  }, [isOpen]);

  const toggleSelect = (id: string) => {
    const char = characters.find(c => c.id === id);
    if (char?.statusId === 3) return;
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    if (selectedIds.length === 0) return;
    onConfirm(selectedIds);
  };

  return (
    <DialogShell
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-lg"
      title="Long Rest"
      subtitle="Select which characters are taking a long rest."
      icon={<Moon className="w-5 h-5 text-[#2563eb]" />}
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button
            intent="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            intent="primary"
            onClick={handleApply}
            disabled={selectedIds.length === 0}
            title={selectedIds.length === 0 ? "Select at least one character" : "Apply Long Rest to selected characters"}
            className="flex items-center gap-1.5"
          >
            <Heart className="w-4 h-4 fill-current text-white/20" />
            Apply Long Rest
          </Button>
        </div>
      }
    >
      <div className="max-h-[50vh] overflow-y-auto space-y-3">
        {characters.length === 0 ? (
          <p className="text-[#8d8db9] text-center text-sm py-4 italic">No active characters to select.</p>
        ) : (
          characters.map(char => {
            const isDeceased = char.statusId === 3;
            const isChecked = selectedIds.includes(char.id);
            const hdStatus = getHitDiceStatus(char.hitDiceConfig || '', char.hitDiceUsed || '{}');
            const remainingHD = hdStatus.reduce((sum, p) => sum + p.remaining, 0);
            const totalHD = getTotalHitDiceCount(char.hitDiceConfig || '');
            const recoverHD = Math.ceil(totalHD / 2);

            return (
              <div
                key={char.id}
                onClick={() => !isDeceased && toggleSelect(char.id)}
                className={`flex flex-col p-3.5 rounded-xl border transition-all select-none ${
                  isDeceased
                    ? 'opacity-40 bg-gray-50 border-gray-200 cursor-not-allowed'
                    : isChecked
                      ? 'bg-[#f0f7ff] border-[#2563eb] shadow-sm cursor-pointer'
                      : 'bg-white border-[#e2e8f0] hover:border-[#2563eb] cursor-pointer'
                }`}
                id={`char-row-${char.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isDeceased}
                      onChange={() => {}} // toggled via row click
                      className="w-4 h-4 rounded text-[#2563eb] border-[#e2e8f0] focus:ring-[#2563eb] cursor-pointer accent-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed"
                      id={`checkbox-${char.id}`}
                    />
                    <div>
                      <span className="font-serif font-bold text-[#0f172a] text-sm block">
                        {char.characterName}
                        {isDeceased && (
                          <span className="text-red-500 font-sans text-[10px] ml-2 font-semibold bg-red-50 px-1.5 py-0.5 rounded border border-red-100 uppercase">
                            Deceased
                          </span>
                        )}
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

      {selectedIds.length === 0 && (
        <div className="mt-4 text-center">
          <span className="text-xs text-red-600 font-medium bg-red-50 px-3 py-1 rounded-full border border-red-100">
            Select at least one character
          </span>
        </div>
      )}
    </DialogShell>
  );
}
