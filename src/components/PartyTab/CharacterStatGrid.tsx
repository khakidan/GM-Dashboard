import React from 'react';
import { Shield, Eye, Heart } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CharacterStatGridProps {
  ac: number;
  tempAc: number;
  effectiveAc: number;
  maxHp: number;
  currentHp: number;
  tempHp: number;
  tempHpMax: number;
  passivePerception: number;
  level: number;
  onTempAcChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  
  // Optional parameters to ensure robust styling and disabled state transitions
  isSyncing?: boolean;
  characterId?: string;
}

export const CharacterStatGrid: React.FC<CharacterStatGridProps> = ({
  ac,
  tempAc,
  effectiveAc,
  maxHp,
  currentHp,
  tempHp,
  tempHpMax,
  passivePerception,
  level,
  onTempAcChange,
  isSyncing = false,
  characterId = '',
}) => {
  return (
    <>
      <div className="flex items-center gap-1.5 text-[15px] font-bold text-[#5a5a40] opacity-60">
        <Eye className="w-4 h-4" />
        {passivePerception}
      </div>
      <div className="flex items-center gap-1.5 text-[15px] font-bold text-[#c5b358]">
        <Heart className="w-4 h-4" />
        {currentHp}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-[15px] font-bold text-[#5a5a40]">
          <Shield className="w-4 h-4 opacity-50" />
          {(() => {
            const eff = effectiveAc;
            const mod = tempAc;
            if (mod === 0) return <span data-testid="eff-ac">{ac}</span>;
            const sign = mod > 0 ? '+' : '';
            return <span data-testid="eff-ac" className="text-amber-600 font-bold">{eff} ({sign}{mod})</span>;
          })()}
        </div>
        <div className={cn(
          "flex items-center gap-0.5 px-1.5 py-0.5 bg-transparent border rounded text-xs font-semibold focus-within:border-[#c5b358] focus-within:ring-1 focus-within:ring-[#c5b358] transition-colors",
          tempAc === 0 ? "text-gray-400 border-[#e5e1d8]" : "text-amber-600 font-bold border-amber-300 focus-within:border-amber-500"
        )}>
          {tempAc > 0 && <span className="select-none font-bold text-xs inline-block text-amber-600">+</span>}
          <input
            id={`ac-mod-spinner-${characterId}`}
            data-testid="ac-mod-spinner"
            type="number"
            value={tempAc}
            step="1"
            onChange={onTempAcChange}
            disabled={isSyncing}
            className="w-10 text-center bg-transparent border-0 outline-none p-0 focus:ring-0 text-inherit font-bold"
          />
        </div>
      </div>
    </>
  );
};
