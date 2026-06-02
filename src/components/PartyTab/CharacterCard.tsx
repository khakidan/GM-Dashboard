import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, X } from 'lucide-react';
import { Character } from '../../types';
import { cn } from '../../lib/utils';
import { getHealthStatus, effectiveMaxHp, effectiveAc } from '../../lib/conditions';
import { DebouncedInput } from '../ui/DebouncedInput';
import { DebouncedTextarea } from '../ui/DebouncedTextarea';

// Modular Sub-components
import { CharacterCardHeader } from './CharacterCardHeader';
import { CharacterStatGrid } from './CharacterStatGrid';
import { CharacterIRVSection } from './CharacterIRVSection';
import { CharacterResourceSection } from './CharacterResourceSection';

export interface CharacterCardProps {
  character: Character; 
  isSyncing: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<Character>) => void;
  onDelete: () => void;
  onLevelUpClick?: () => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ 
  character, 
  isSyncing,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onLevelUpClick
}) => {
  const maxHpCeiling = effectiveMaxHp(character.maxHp || 1, character.tempHpMax);
  const healthStatus = getHealthStatus(character.currentHp || 0, maxHpCeiling);

  const [localTempAc, setLocalTempAc] = React.useState(character.tempAc ?? 0);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    setLocalTempAc(character.tempAc ?? 0);
  }, [character.tempAc]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleTempAcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const newValue = isNaN(val) ? 0 : val;
    setLocalTempAc(newValue);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onUpdate({ tempAc: newValue });
    }, 600);
  };

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
      
      <CharacterCardHeader
        characterName={character.characterName}
        playerName={character.playerName}
        className={""}
        healthStatus={healthStatus}
        isActive={character.statusId === 1}
        isDeceased={character.statusId === 3}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        isSyncing={isSyncing}
        statusId={character.statusId}
        onStatusChange={(id, name) => onUpdate({ statusId: id, statusName: name })}
        characterId={character.id}
        conditions={character.conditions}
        onUpdateCharacterName={(val) => onUpdate({ characterName: val })}
        onUpdatePlayerName={(val) => onUpdate({ playerName: val })}
        onLevelUpClick={onLevelUpClick}
        statGrid={
          <CharacterStatGrid
            ac={character.ac}
            tempAc={localTempAc}
            effectiveAc={effectiveAc(character.ac, localTempAc)}
            maxHp={character.maxHp}
            currentHp={character.currentHp}
            tempHp={character.tempHp || 0}
            tempHpMax={character.tempHpMax || 0}
            passivePerception={character.passivePerception}
            level={character.level}
            onTempAcChange={handleTempAcChange}
            isSyncing={isSyncing}
            characterId={character.id}
          />
        }
      />

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[#f5f5f0]"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
