import React from 'react';
import { Heart, Shield, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { DebouncedInput } from '../ui/DebouncedInput';

export interface NpcCardHeaderProps {
  name: string;
  ac: number;
  maxHp: number;
  currentHp: number;
  conditions?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isSyncing: boolean;
  onUpdateName: (val: string) => void;
}

export const NpcCardHeader: React.FC<NpcCardHeaderProps> = ({
  name,
  ac,
  maxHp,
  currentHp,
  conditions,
  isExpanded,
  onToggleExpand,
  isSyncing,
  onUpdateName,
}) => {
  return (
    <div className="p-4 flex items-center justify-between gap-3 px-5">
      <div className="flex-1 min-w-0 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <DebouncedInput
            type="text"
            value={name}
            onChange={(val) => onUpdateName(val as string)}
            className="text-lg font-bold text-[#2c2c26] font-serif bg-transparent border-none focus:ring-0 w-full p-0 truncate disabled:opacity-50"
            disabled={isSyncing}
          />
        </div>

        {!isExpanded && (
          <div className="flex items-center gap-4 pl-4 border-l border-[#f5f5f0] whitespace-nowrap">
            {conditions && (
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full text-[14px] font-bold italic max-w-[220px] truncate">
                {conditions}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[15px] font-bold text-[#c5b358]">
              <Heart className="w-4 h-4" />
              {currentHp}/{maxHp}
            </div>
            <div className="flex items-center gap-1.5 text-[15px] font-bold text-[#5a5a40]">
              <Shield className="w-4 h-4 opacity-50" />
              {ac}
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
  );
};
