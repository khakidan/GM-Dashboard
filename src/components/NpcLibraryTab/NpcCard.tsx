import React from 'react';
import { NPC } from '../../types';
import { Shield, Heart, Loader2, Trash2, RotateCcw, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { DebouncedInput } from '../ui/DebouncedInput';
import { DebouncedTextarea } from '../ui/DebouncedTextarea';

export interface NpcCardProps {
  npc: NPC;
  isSyncing: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<NPC>) => void;
  onDelete: () => void;
  onResetHp: () => void;
}

export const NpcCard: React.FC<NpcCardProps> = ({
  npc,
  isSyncing,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onResetHp
}) => {
  const needsReset = npc.currentHp < npc.maxHp;

  return (
    <div className={cn(
      "bg-white rounded-2xl border overflow-hidden flex flex-col relative group transition-all",
      isExpanded ? "border-[#c5b358]/40" : "border-[#e5e1d8] hover:border-[#c5b358]/20",
      isSyncing ? "border-[#c5b358] shadow-[0_0_15px_rgba(197,179,88,0.3)] shadow-[#c5b358]/20" : "shadow-sm hover:shadow-md"
    )}>
      {isSyncing && (
        <div className="absolute top-2 right-10 z-20 flex items-center gap-1 bg-[#c5b358] text-[#2c2c26] text-xs uppercase font-bold px-3 py-1 rounded-full shadow-sm animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin"/> Syncing
        </div>
      )}

      {/* Header Area - Always Visible */}
      <div className="p-4 flex items-center justify-between gap-3 px-5">
        <div className="flex-1 min-w-0 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <DebouncedInput
              type="text"
              value={npc.name}
              onChange={(val) => onUpdate({ name: val as string })}
              className="text-lg font-bold text-[#2c2c26] font-serif bg-transparent border-none focus:ring-0 w-full p-0 truncate disabled:opacity-50"
              disabled={isSyncing}
            />
          </div>

          {!isExpanded && (
            <div className="flex items-center gap-4 pl-4 border-l border-[#f5f5f0] whitespace-nowrap">
              {npc.conditions && (
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full text-[14px] font-bold italic max-w-[220px] truncate">
                  {npc.conditions}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[15px] font-bold text-[#c5b358]">
                <Heart className="w-4 h-4" />
                {npc.currentHp}/{npc.maxHp}
              </div>
              <div className="flex items-center gap-1.5 text-[15px] font-bold text-[#5a5a40]">
                <Shield className="w-4 h-4 opacity-50" />
                {npc.ac}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 border-l border-[#f5f5f0] pl-3">
          <button
            onClick={onToggleExpand}
            className="p-2 text-[#5a5a40] opacity-30 hover:opacity-100 hover:bg-[#f5f5f0] rounded-full transition-all"
          >
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[#f5f5f0]"
          >
            <div className="p-6 flex flex-col gap-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 bg-[#fdfaf5] border border-[#e5e1d8] rounded-xl shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">AC</div>
                  <DebouncedInput
                    type="number"
                    value={npc.ac}
                    onFocus={(e) => (e.target as HTMLInputElement).select()}
                    onChange={(v) => onUpdate({ ac: parseInt(v as string) || 0 })}
                    className="text-lg font-bold text-[#2c2c26] w-full text-center bg-transparent border-none focus:ring-0 p-0 disabled:opacity-50"
                    disabled={isSyncing}
                  />
                </div>
                <div className="text-center p-3 bg-[#fdfaf5] border border-[#e5e1d8] rounded-xl shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">Max HP</div>
                  <DebouncedInput
                    type="number"
                    value={npc.maxHp}
                    onFocus={(e) => (e.target as HTMLInputElement).select()}
                    onChange={(v) => onUpdate({ maxHp: parseInt(v as string) || 1 })}
                    className="text-lg font-bold text-[#2c2c26] w-full text-center bg-transparent border-none focus:ring-0 p-0 disabled:opacity-50"
                    disabled={isSyncing}
                  />
                </div>
                <div className="text-center p-3 bg-[#fdfaf5] border border-[#e5e1d8] rounded-xl shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">HP</div>
                  <DebouncedInput
                    type="number"
                    value={npc.currentHp}
                    onFocus={(e) => (e.target as HTMLInputElement).select()}
                    onChange={(v) => onUpdate({ currentHp: parseInt(v as string) || 0 })}
                    className={cn(
                      "text-lg font-bold w-full text-center bg-transparent border-none focus:ring-0 p-0 disabled:opacity-50",
                      npc.currentHp <= 0 ? "text-red-600" : "text-[#2c2c26]"
                    )}
                    disabled={isSyncing}
                  />
                </div>
                <div className="text-center p-3 bg-[#fdfaf5] border border-[#e5e1d8] rounded-xl shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">Temp</div>
                  <DebouncedInput
                    type="number"
                    value={npc.tempHp}
                    onFocus={(e) => (e.target as HTMLInputElement).select()}
                    onChange={(v) => onUpdate({ tempHp: parseInt(v as string) || 0 })}
                    className="text-lg font-bold text-[#2c2c26] w-full text-center bg-transparent border-none focus:ring-0 p-0 disabled:opacity-50"
                    disabled={isSyncing}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-[10px] uppercase text-[#5a5a40] font-bold tracking-widest mb-1.5 px-1">Conditions</div>
                  <DebouncedInput
                    type="text"
                    value={npc.conditions || ''}
                    onChange={(v) => onUpdate({ conditions: v as string })}
                    placeholder="None"
                    className="w-full text-xs text-[#2c2c26] bg-[#fdfaf5] p-3 rounded-lg border border-[#e5e1d8] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all placeholder:text-[#cccbcb] disabled:opacity-50"
                    disabled={isSyncing}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="text-[10px] uppercase text-[#5a5a40] font-bold tracking-widest mb-1.5 px-1">Resists</div>
                    <DebouncedInput
                      type="text"
                      value={npc.resistances || ''}
                      onChange={(v) => onUpdate({ resistances: v as string })}
                      placeholder="None"
                      className="w-full text-xs text-[#2c2c26] bg-[#fdfaf5] p-3 rounded-lg border border-[#e5e1d8] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all placeholder:text-[#cccbcb] disabled:opacity-50 font-sans"
                      disabled={isSyncing}
                    />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-[#5a5a40] font-bold tracking-widest mb-1.5 px-1">Immune</div>
                    <DebouncedInput
                      type="text"
                      value={npc.immunities || ''}
                      onChange={(v) => onUpdate({ immunities: v as string })}
                      placeholder="None"
                      className="w-full text-xs text-[#2c2c26] bg-[#fdfaf5] p-3 rounded-lg border border-[#e5e1d8] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all placeholder:text-[#cccbcb] disabled:opacity-50 font-sans"
                      disabled={isSyncing}
                    />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-[#5a5a40] font-bold tracking-widest mb-1.5 px-1">Vuln</div>
                    <DebouncedInput
                      type="text"
                      value={npc.vulnerabilities || ''}
                      onChange={(v) => onUpdate({ vulnerabilities: v as string })}
                      placeholder="None"
                      className="w-full text-xs text-[#2c2c26] bg-[#fdfaf5] p-3 rounded-lg border border-[#e5e1d8] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all placeholder:text-[#cccbcb] disabled:opacity-50 font-sans"
                      disabled={isSyncing}
                    />
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase text-[#5a5a40] font-bold tracking-widest mb-1.5 px-1">Notes</div>
                  <DebouncedTextarea
                    value={npc.notes || ''}
                    onChange={(v) => onUpdate({ notes: v as string })}
                    placeholder="Special abilities or description..."
                    rows={3}
                    className="w-full text-xs text-[#2c2c26] bg-[#fdfaf5] p-3 rounded-lg border border-[#e5e1d8] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all resize-none placeholder:text-[#cccbcb] disabled:opacity-50 leading-relaxed font-sans"
                    disabled={isSyncing}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                {needsReset && (
                  <button
                    onClick={onResetHp}
                    disabled={isSyncing}
                    className="flex-1 py-3 bg-[#c5b358]/10 text-[#2c2c26] hover:bg-[#c5b358]/20 border border-[#c5b358]/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset HP
                  </button>
                )}
                <button
                  onClick={onDelete}
                  disabled={isSyncing}
                  className="flex-1 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold uppercase tracking-widest border border-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete NPC
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
