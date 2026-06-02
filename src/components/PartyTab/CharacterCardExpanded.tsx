import React from 'react';
import { X } from 'lucide-react';
import { Character } from '../../types';
import { cn } from '../../lib/utils';
import { DebouncedInput } from '../ui/DebouncedInput';
import { DebouncedTextarea } from '../ui/DebouncedTextarea';
import { CharacterResourceSection } from './CharacterResourceSection';
import { CharacterIRVSection } from './CharacterIRVSection';

export interface CharacterCardExpandedProps {
  character: Character;
  isSyncing: boolean;
  onUpdate: (updates: Partial<Character>) => void;
  onDelete: () => void;
}

export const CharacterCardExpanded: React.FC<CharacterCardExpandedProps> = ({
  character,
  isSyncing,
  onUpdate,
  onDelete,
}) => {
  return (
    <div className="p-6 flex flex-col font-sans gap-5">
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
        <div className="text-center p-3 bg-[#fdfaf5] border border-[#e5e1d8] rounded-xl shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">AC</div>
          <DebouncedInput 
            type="number"
            value={character.ac || ''}
            onFocus={(e) => (e.target as HTMLInputElement).select()}
            onChange={(v) => onUpdate({ ac: parseInt(v as string, 10) || 0 })}
            className="text-lg font-bold text-[#2c2c26] w-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] rounded transition-all disabled:opacity-50"
            disabled={isSyncing}
          />
        </div>
        <div className="text-center p-3 bg-[#fdfaf5] border border-[#e5e1d8] rounded-xl shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">Max HP</div>
          <DebouncedInput 
            type="number"
            value={character.maxHp || ''}
            onFocus={(e) => (e.target as HTMLInputElement).select()}
            onChange={(v) => onUpdate({ maxHp: parseInt(v as string, 10) || 1 })}
            className={cn(
              "text-lg font-bold w-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] rounded transition-all disabled:opacity-50",
              character.tempHpMax && character.tempHpMax > 0 ? "text-amber-600 cursor-help" : "text-[#2c2c26]"
            )}
            title={character.tempHpMax && character.tempHpMax > 0 ? `Temp max (original: ${character.maxHp})` : undefined}
            disabled={isSyncing}
          />
        </div>
        <div className="text-center p-3 bg-[#fdfaf5] border border-[#e5e1d8] rounded-xl shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">HP</div>
          <DebouncedInput 
            type="number"
            value={character.currentHp === undefined ? '' : character.currentHp}
            onFocus={(e) => (e.target as HTMLInputElement).select()}
            onChange={(v) => onUpdate({ currentHp: parseInt(v as string, 10) || 0 })}
            className="text-lg font-bold text-[#2c2c26] w-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] rounded transition-all disabled:opacity-50"
            disabled={isSyncing}
          />
        </div>
        <div className="text-center p-3 bg-[#fdfaf5] border border-[#e5e1d8] rounded-xl shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">Temp</div>
          <DebouncedInput 
            type="number"
            value={character.tempHp === undefined ? '' : character.tempHp}
            onFocus={(e) => (e.target as HTMLInputElement).select()}
            onChange={(v) => onUpdate({ tempHp: parseInt(v as string, 10) || 0 })}
            className="text-lg font-bold text-[#2c2c26] w-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] rounded transition-all disabled:opacity-50"
            disabled={isSyncing}
          />
        </div>
        <div className="text-center p-3 bg-[#fdfaf5] border border-[#e5e1d8] rounded-xl shadow-sm group/lvl">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">Level</div>
          <DebouncedInput 
            type="number"
            value={character.level || ''}
            onFocus={(e) => (e.target as HTMLInputElement).select()}
            onChange={(v) => onUpdate({ level: parseInt(v as string, 10) || 1 })}
            placeholder="1"
            className="text-lg font-bold text-[#2c2c26] w-full text-center bg-transparent border border-transparent rounded hover:bg-white focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-colors disabled:opacity-50"
            disabled={isSyncing}
          />
        </div>
        <div className="text-center p-3 bg-[#fdfaf5] border border-[#e5e1d8] rounded-xl shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#5a5a40] mb-1">Passive</div>
          <DebouncedInput 
            type="number"
            value={character.passivePerception === undefined ? '' : character.passivePerception}
            onFocus={(e) => (e.target as HTMLInputElement).select()}
            onChange={(v) => onUpdate({ passivePerception: parseInt(v as string, 10) || 0 })}
            className="text-lg font-bold text-[#2c2c26] w-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] rounded transition-all disabled:opacity-50"
            disabled={isSyncing}
          />
        </div>
      </div>

      <CharacterResourceSection
        conditions={character.conditions || ''}
        onConditionsChange={(v) => onUpdate({ conditions: v })}
        immunities={character.immunities || ''}
        combatantId={character.id}
      />

      <CharacterIRVSection
        resistances={character.resistances || ''}
        immunities={character.immunities || ''}
        vulnerabilities={character.vulnerabilities || ''}
        onUpdate={onUpdate}
      />

      <div>
        <div className="text-[10px] uppercase text-[#5a5a40] font-bold tracking-widest mb-2 px-1">Notes</div>
        <DebouncedTextarea 
          value={character.notes}
          onChange={(v) => onUpdate({ notes: v })}
          placeholder="Notes..."
          className="w-full text-sm text-[#2c2c26] bg-[#fdfaf5] p-3 rounded-lg italic resize-none border border-[#e5e1d8] focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all h-24 placeholder:text-[#cccbcb] disabled:opacity-50"
          disabled={isSyncing}
        />
      </div>

      <div className="pt-4">
        <button 
          onClick={onDelete}
          disabled={isSyncing}
          className="w-full py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold uppercase tracking-widest border border-red-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <X className="w-4 h-4" />
          Delete Player
        </button>
      </div>
    </div>
  );
};
