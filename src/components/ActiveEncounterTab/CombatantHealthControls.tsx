import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Combatant, DamageType } from '../../types';
import { DAMAGE_TYPE_OPTIONS } from '../../lib/conditions';

interface CombatantHealthControlsProps {
  c: Combatant;
  damageInput: string;
  healInput: string;
  onDamageInputChange: (val: string) => void;
  onHealInputChange: (val: string) => void;
  onHealthSubmit: (isDamage: boolean, damageType?: DamageType | null) => void;
  isSyncing: boolean;
  isActiveTurn: boolean;
  hpMode?: 'damage' | 'heal';
}

export const CombatantHealthControls = ({
  c,
  damageInput,
  healInput,
  onDamageInputChange,
  onHealInputChange,
  onHealthSubmit,
  isSyncing,
  isActiveTurn,
  hpMode,
}: CombatantHealthControlsProps) => {
  const [selectedDamageType, setSelectedDamageType] = useState<DamageType | null>(null);

  return (
    <div className="min-w-0 flex items-center gap-2" onClick={e => e.stopPropagation()}>
      <div className="flex flex-nowrap items-center gap-2 ml-auto" id={`hp-controls-${c.id}`}>
        {/* Damage Row & Inputs */}
        <div 
          className={cn(
            "flex items-center gap-1 p-1 rounded-lg transition-all",
            hpMode === 'damage' ? "bg-red-50 border border-red-200/80 shadow-sm" : "opacity-75 hover:opacity-100"
          )}
        >
          <input
            id={`damage-input-${c.id}`}
            type="number"
            value={damageInput}
            onChange={e => onDamageInputChange(e.target.value)}
            placeholder="0"
            disabled={isSyncing}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onHealthSubmit(true, selectedDamageType || null);
                setSelectedDamageType(null);
              }
            }}
            className={cn(
              'w-18 h-8 bg-transparent border border-[#e2e8f0] rounded px-1 text-center outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/30 font-sans text-base font-bold disabled:opacity-50',
              isActiveTurn && 'bg-white border-[#2563eb]/50'
            )}
          />
          <select
            id={`damage-type-select-${c.id}`}
            value={selectedDamageType || ''}
            onChange={e => {
              const raw = e.target.value;
              const isValidDamageType = (v: string): v is DamageType =>
                (DAMAGE_TYPE_OPTIONS as readonly string[]).includes(v);
              if (isValidDamageType(raw)) {
                setSelectedDamageType(raw);
              } else {
                setSelectedDamageType(null);
              }
            }}
            disabled={isSyncing}
            className="w-28 h-8 bg-transparent border border-[#e2e8f0] rounded px-1 text-xs font-bold text-[#8d8db9] outline-none cursor-pointer focus:border-[#2563eb] appearance-auto"
          >
            <option value="">Damage Type</option>
            {DAMAGE_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              onHealthSubmit(true, selectedDamageType || null);
              setSelectedDamageType(null);
            }}
            disabled={isSyncing}
            className="px-2 h-8 leading-none bg-red-50 text-red-700 hover:bg-red-100 border border-red-100 rounded-md text-xs font-bold uppercase disabled:opacity-50 cursor-pointer"
            title="Damage"
          >
            DMG
          </button>
        </div>
        
        <div className="border-l border-[#e2e8f0]">&nbsp;</div>
        
        {/* Heal Row & Inputs */}
        <div 
          className={cn(
            "flex items-center gap-1 p-1 rounded-lg transition-all",
            hpMode === 'heal' ? "bg-emerald-50 border border-emerald-200/80 shadow-sm" : "opacity-75 hover:opacity-100"
          )}
        >
          <input
            id={`heal-input-${c.id}`}
            type="number"
            value={healInput}
            onChange={e => onHealInputChange(e.target.value)}
            placeholder="0"
            disabled={isSyncing}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onHealthSubmit(false, null);
              }
            }}
            className={cn(
              'w-18 h-8 bg-transparent border border-[#e2e8f0] rounded px-1 text-center outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/30 font-sans text-base font-bold disabled:opacity-50',
              isActiveTurn && 'bg-white border-[#2563eb]/50'
            )}
          />
          <button
            onClick={() => onHealthSubmit(false, null)}
            disabled={isSyncing}
            className="px-2 h-8 leading-none bg-green-50 text-green-700 hover:bg-green-100 border border-green-100 rounded-md text-xs font-bold uppercase disabled:opacity-50 cursor-pointer"
            title="Heal"
          >
            HEAL
          </button>
        </div>
      </div>
    </div>
  );
};
