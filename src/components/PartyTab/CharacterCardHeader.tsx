import React from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { DebouncedInput } from '../ui/DebouncedInput';

export interface CharacterCardHeaderProps {
  characterName: string;
  playerName: string;
  className?: string; // Character's D&D class badge or other styling class
  healthStatus: { label: string; color: string };
  isActive: boolean;
  isDeceased: boolean;
  
  // Additional props to preserve functionality & interactive features
  isExpanded: boolean;
  onToggleExpand: () => void;
  isSyncing: boolean;
  statusId: number;
  onStatusChange: (statusId: number, statusName: string) => void;
  characterId: string;
  conditions?: string;
  onUpdateCharacterName?: (val: string) => void;
  onUpdatePlayerName?: (val: string) => void;
  onLevelUpClick?: (() => void) | null;
  statGrid?: React.ReactNode;
}

export const CharacterCardHeader: React.FC<CharacterCardHeaderProps> = ({
  characterName,
  playerName,
  className,
  healthStatus,
  isActive,
  isDeceased,
  isExpanded,
  onToggleExpand,
  isSyncing,
  statusId,
  onStatusChange,
  characterId,
  conditions,
  onUpdateCharacterName,
  onUpdatePlayerName,
  onLevelUpClick,
  statGrid,
}) => {
  return (
    <div className="p-4 flex items-center justify-between gap-3 px-5">
      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
        <div className="flex items-center gap-2 min-w-0">
          <DebouncedInput 
            value={characterName}
            onChange={(v) => onUpdateCharacterName?.(v as string)}
            className="text-lg font-bold text-[#2c2c26] font-serif bg-transparent border border-transparent rounded hover:bg-[#fdfaf5] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none px-2 py-1 -ml-2 transition-all placeholder:text-gray-300 disabled:opacity-50 w-auto max-w-[160px] truncate"
            placeholder="Name"
            disabled={isSyncing}
          />
          <div className="hidden sm:block text-[#e5e1d8] shrink-0">|</div>
          <DebouncedInput 
            value={playerName}
            onChange={(v) => onUpdatePlayerName?.(v as string)}
            className="text-xs text-[#5a5a40] uppercase tracking-wider font-bold opacity-60 bg-transparent border border-transparent rounded hover:bg-[#fdfaf5] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none px-2 py-1 -ml-2 transition-all placeholder:text-gray-300 disabled:opacity-50 w-auto max-w-[100px] truncate"
            placeholder="Player"
            disabled={isSyncing}
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="relative shrink-0 flex items-center">
            <select
              value={statusId}
              onChange={(e) => {
                const id = parseInt(e.target.value, 10);
                let statusName = "Unknown";
                if (id === 1) statusName = "Active";
                if (id === 2) statusName = "Absent";
                if (id === 3) statusName = "Dead";
                onStatusChange(id, statusName);
              }}
              disabled={isSyncing}
              className={cn(
                "text-xs uppercase tracking-widest font-bold pl-3 pr-8 py-1.5 rounded-full border transition-colors outline-none cursor-pointer appearance-none disabled:opacity-50",
                statusId === 1 ? "bg-green-50 text-green-700 border-green-100" : 
                statusId === 3 ? "bg-red-50 text-red-700 border-red-100" :
                "bg-gray-50 text-gray-500 border-gray-100"
              )}
            >
              <option value={1}>Active</option>
              <option value={2}>Absent</option>
              <option value={3}>Dead</option>
            </select>
            <div className="absolute right-2.5 pointer-events-none text-xs font-bold opacity-40">
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>

          {!isExpanded && (
            <div className="flex items-center gap-4 pl-4 border-l border-[#f5f5f0] whitespace-nowrap">
              {conditions && (
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full text-[14px] font-bold italic max-w-[220px] truncate">
                  {conditions}
                </div>
              )}
              <div className={cn(
                "hidden sm:flex items-center px-2 py-0.5 rounded-full font-sans text-xs font-bold uppercase tracking-wider border",
                healthStatus.color,
                healthStatus.label === 'Full' ? 'bg-emerald-50 border-emerald-200' :
                healthStatus.label === 'Healthy' ? 'bg-green-50 border-green-200' :
                healthStatus.label === 'Injured' ? 'bg-yellow-50 border-yellow-200' :
                healthStatus.label === 'Bloodied' ? 'bg-red-50 border-red-200' :
                'bg-gray-100 border-gray-200'
              )}>
                {healthStatus.label}
              </div>
              {statGrid}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 border-l border-[#f5f5f0] pl-3">
        {statusId === 1 && onLevelUpClick && (
          <button
            id={`lvl-btn-${characterId}`}
            onClick={(e) => {
              e.stopPropagation();
              onLevelUpClick();
            }}
            className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider bg-[#c5b358]/10 text-[#5a5a40] hover:bg-[#c5b358] hover:text-white rounded-md transition-all cursor-pointer border border-[#c5b358]/20"
          >
            Level Up
          </button>
        )}
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
  );
};
