import React from 'react';
import { Character } from '../../types';
import { Shield, Eye, Heart, Loader2, X, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { DebouncedInput } from '../ui/DebouncedInput';
import { DebouncedTextarea } from '../ui/DebouncedTextarea';

export interface CharacterCardProps {
  character: Character; 
  isSyncing: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<Character>) => void;
  onDelete: () => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ 
  character, 
  isSyncing,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete
}) => {
  return (
    <div className={cn(
      "bg-white rounded-2xl border overflow-hidden flex flex-col relative group transition-all",
      isExpanded ? "border-[#c5b358]/40" : "border-[#e5e1d8] hover:border-[#c5b358]/20",
      isSyncing ? "border-[#c5b358] shadow-[0_0_15px_rgba(197,179,88,0.3)] shadow-[#c5b358]/20" : "shadow-sm hover:shadow-md"
    )}>
      {isSyncing && (
        <div className="absolute top-2 right-10 z-20 flex items-center gap-1 bg-[#c5b358] text-[#2c2c26] text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin"/> Syncing
        </div>
      )}
      
      {/* Header Area - Always Visible */}
      <div className="p-3 flex items-center justify-between gap-3 px-4">
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
          <div className="flex items-center gap-2 min-w-0">
             <DebouncedInput 
                value={character.characterName}
                onChange={(v) => onUpdate({ characterName: v as string })}
                className="text-base font-bold text-[#2c2c26] font-serif bg-transparent border border-transparent rounded hover:bg-[#fdfaf5] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none px-2 py-0.5 -ml-2 transition-all placeholder:text-gray-300 disabled:opacity-50 w-auto max-w-[140px] truncate"
                placeholder="Name"
                disabled={isSyncing}
              />
              <div className="hidden sm:block text-[#e5e1d8] shrink-0">|</div>
              <DebouncedInput 
                value={character.playerName}
                onChange={(v) => onUpdate({ playerName: v as string })}
                className="text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold opacity-60 bg-transparent border border-transparent rounded hover:bg-[#fdfaf5] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none px-2 py-0.5 -ml-2 transition-all placeholder:text-gray-300 disabled:opacity-50 w-auto max-w-[90px] truncate"
                placeholder="Player"
                disabled={isSyncing}
              />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative shrink-0 flex items-center">
              <select
                value={character.statusId}
                onChange={(e) => {
                  const id = parseInt(e.target.value);
                  let statusName = "Unknown";
                  if (id === 1) statusName = "Active";
                  if (id === 2) statusName = "Absent";
                  if (id === 3) statusName = "Dead";
                  onUpdate({ statusId: id, statusName });
                }}
                disabled={isSyncing}
                className={cn(
                  "text-[8px] uppercase tracking-widest font-bold pl-1.5 pr-4 py-0.5 rounded-full border transition-colors outline-none cursor-pointer appearance-none disabled:opacity-50",
                  character.statusId === 1 ? "bg-green-50 text-green-700 border-green-100" : 
                  character.statusId === 3 ? "bg-red-50 text-red-700 border-red-100" :
                  "bg-gray-50 text-gray-500 border-gray-100"
                )}
              >
                <option value={1}>Active</option>
                <option value={2}>Absent</option>
                <option value={3}>Dead</option>
              </select>
              <div className="absolute right-1 pointer-events-none text-[6px] font-bold opacity-40">▼</div>
            </div>

            {!isExpanded && (
              <div className="flex items-center gap-3 pl-3 border-l border-[#f5f5f0] whitespace-nowrap">
                {character.conditions && (
                  <div className="hidden lg:flex items-center gap-1.5 px-3 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded-full text-[14px] font-bold italic max-w-[220px] truncate">
                    {character.conditions}
                  </div>
                )}
                <div className="flex items-center gap-1 text-[14px] font-bold text-[#5a5a40] opacity-60">
                  <Eye className="w-3.5 h-3.5" />
                  {character.passivePerception}
                </div>
                <div className="flex items-center gap-1 text-[14px] font-bold text-[#c5b358]">
                  <Heart className="w-3.5 h-3.5" />
                  {character.currentHp}
                </div>
                <div className="flex items-center gap-1 text-[14px] font-bold text-[#5a5a40]">
                  <Shield className="w-3.5 h-3.5 opacity-50" />
                  {character.ac}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 border-l border-[#f5f5f0] pl-2">
          <button 
            onClick={onToggleExpand}
            className="p-1.5 text-[#5a5a40] opacity-30 hover:opacity-100 hover:bg-[#f5f5f0] rounded-full transition-all"
          >
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
              <ChevronDown className="w-4 h-4" />
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
            <div className="p-5 flex flex-col font-sans gap-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-[#fdfaf5] border border-[#e5e1d8] rounded-xl shadow-sm">
                   <div className="text-[7px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">HP</div>
                   <DebouncedInput 
                    type="number"
                    value={character.currentHp === undefined ? '' : character.currentHp}
                    onChange={(v) => onUpdate({ currentHp: parseInt(v as string) || 0 })}
                    className="text-base font-bold text-[#2c2c26] w-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] rounded transition-all disabled:opacity-50"
                    disabled={isSyncing}
                  />
                </div>
                <div className="text-center p-2 bg-[#fdfaf5] border border-[#e5e1d8] rounded-xl shadow-sm">
                   <div className="text-[7px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">Temp</div>
                   <DebouncedInput 
                    type="number"
                    value={character.tempHp === undefined ? '' : character.tempHp}
                    onChange={(v) => onUpdate({ tempHp: parseInt(v as string) || 0 })}
                    className="text-base font-bold text-[#2c2c26] w-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] rounded transition-all disabled:opacity-50"
                    disabled={isSyncing}
                  />
                </div>
                <div className="text-center p-2 bg-[#fdfaf5] border border-[#e5e1d8] rounded-xl shadow-sm group/lvl">
                   <div className="text-[7px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">Level</div>
                   <DebouncedInput 
                    type="number"
                    value={character.level || ''}
                    onChange={(v) => onUpdate({ level: parseInt(v as string) || 1 })}
                    placeholder="1"
                    className="text-base font-bold text-[#2c2c26] w-full text-center bg-transparent border border-transparent rounded hover:bg-white focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-colors disabled:opacity-50"
                    disabled={isSyncing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-[#faf9f6] p-3 rounded-xl border border-[#e5e1d8]">
                <div className="text-center">
                  <Shield className="w-3 h-3 mx-auto text-[#5a5a40] mb-1 opacity-70" />
                  <DebouncedInput 
                    type="number"
                    value={character.ac || ''}
                    onChange={(v) => onUpdate({ ac: parseInt(v as string) || 0 })}
                    className="text-sm font-bold text-[#2c2c26] w-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] rounded transition-all disabled:opacity-50"
                    disabled={isSyncing}
                  />
                  <div className="text-[7px] font-bold uppercase tracking-widest text-[#5a5a40]">AC</div>
                </div>
                <div className="text-center">
                  <Heart className="w-3 h-3 mx-auto text-[#5a5a40] mb-1 opacity-70" />
                  <DebouncedInput 
                    type="number"
                    value={character.maxHp || ''}
                    onChange={(v) => onUpdate({ maxHp: parseInt(v as string) || 1 })}
                    className="text-sm font-bold text-[#2c2c26] w-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] rounded transition-all disabled:opacity-50"
                    disabled={isSyncing}
                  />
                  <div className="text-[7px] font-bold uppercase tracking-widest text-[#5a5a40]">Max HP</div>
                </div>
                <div className="text-center">
                  <Eye className="w-3 h-3 mx-auto text-[#5a5a40] mb-1 opacity-70" />
                  <DebouncedInput 
                    type="number"
                    value={character.passivePerception === undefined ? '' : character.passivePerception}
                    onChange={(v) => onUpdate({ passivePerception: parseInt(v as string) || 0 })}
                    className="text-sm font-bold text-[#2c2c26] w-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] rounded transition-all disabled:opacity-50"
                    disabled={isSyncing}
                  />
                  <div className="text-[7px] font-bold uppercase tracking-widest text-[#5a5a40]">Percept</div>
                </div>
              </div>

              <div>
                <div className="text-[8px] uppercase text-[#5a5a40] font-bold tracking-widest mb-1 px-1">Conditions</div>
                <DebouncedInput 
                  type="text"
                  value={character.conditions}
                  onChange={(v) => onUpdate({ conditions: v as string })}
                  placeholder="Conditions..."
                  className="w-full text-xs text-[#2c2c26] bg-[#fdfaf5] p-2 rounded-lg border border-[#e5e1d8] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all placeholder:text-[#cccbcb] disabled:opacity-50"
                  disabled={isSyncing}
                />
              </div>

              <div>
                <div className="text-[8px] uppercase text-[#5a5a40] font-bold tracking-widest mb-1 px-1">Notes</div>
                <DebouncedTextarea 
                  value={character.notes}
                  onChange={(v) => onUpdate({ notes: v })}
                  placeholder="Notes..."
                  className="w-full text-xs text-[#2c2c26] bg-[#fdfaf5] p-2 rounded-lg italic resize-none border border-[#e5e1d8] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all h-20 placeholder:text-[#cccbcb] disabled:opacity-50"
                  disabled={isSyncing}
                />
              </div>

              <div className="pt-2">
                <button 
                  onClick={onDelete}
                  disabled={isSyncing}
                  className="w-full py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-red-100 transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-3 h-3" />
                  Delete Player
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
