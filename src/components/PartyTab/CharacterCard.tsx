import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { Character } from '../../types';
import { cn } from '../../lib/utils';
import { getHealthStatus, effectiveMaxHp, effectiveAc } from '../../lib/conditions';
import { SpellcastingStatsRow } from '../ui/SpellcastingStatsRow';
import { parseAbilityScores, parseProficiencies, proficiencyBonusFromLevel } from '../../lib/abilityScores';

// Modular Sub-components
import { CharacterCardHeader } from './CharacterCardHeader';
import { CharacterStatGrid } from './CharacterStatGrid';
import { CharacterCardExpanded } from './CharacterCardExpanded';

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
      "bg-[#fdfaf5] rounded-2xl border overflow-hidden flex flex-col relative group transition-all",
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

      {!isExpanded && (
        <div className="px-5 pb-3 -mt-1" id={`spellcasting-stats-container-${character.id}`}>
          <SpellcastingStatsRow
            abilityScores={parseAbilityScores(character.abilityScores)}
            profBonus={proficiencyBonusFromLevel(character.level)}
            className={character.class}
            overrideAbility={parseProficiencies(character.proficiencies).spellcastingAbility}
          />
        </div>
      )}

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[#e5e1d8] bg-white"
          >
            <CharacterCardExpanded
              character={character}
              isSyncing={isSyncing}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
