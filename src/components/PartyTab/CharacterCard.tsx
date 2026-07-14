import React from 'react';
import { Character } from '../../types';
import { cn } from '../../lib/utils';
import { getHealthStatus, effectiveMaxHp, effectiveAc } from '../../lib/conditions';
import { SpellcastingStatsRow } from '../ui/SpellcastingStatsRow';
import { parseAbilityScores, parseProficiencies, proficiencyBonusFromLevel } from '../../lib/abilityScores';
import { CardShell } from '../ui/CardShell';
import { ExpandableContent } from '../ui/ExpandableContent';

// Modular Sub-components
import { CharacterCardHeader } from './CharacterCardHeader';
import { CharacterStatGrid } from './CharacterStatGrid';
import { CharacterCardExpanded } from './CharacterCardExpanded';

export interface CharacterCardProps {
  character: Character; 
  statuses: Record<string, string>;
  isSyncing: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<Character>) => void;
  onDelete: () => void;
  onLevelUpClick?: () => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ 
  character, 
  statuses,
  isSyncing,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onLevelUpClick
}) => {
  const maxHpCeiling = effectiveMaxHp(character.maxHp || 1, character.tempHpMax);
  let healthStatus = getHealthStatus(character.currentHp || 0, maxHpCeiling);

  const isPcDead = (character.deathSavesFails || 0) >= 3;
  if (character.currentHp <= 0) {
    if (isPcDead || character.statusId === 3) {
      healthStatus = { label: 'Dead', color: 'text-gray-500' };
    } else if ((character.deathSavesSuccesses || 0) >= 3) {
      healthStatus = { label: 'Stable', color: 'text-blue-500' };
    } else {
      healthStatus = { label: 'Unconscious', color: 'text-red-500' };
    }
  }

  const [localTempAc, setLocalTempAc] = React.useState(character.tempAc ?? 0);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (isPcDead && character.statusId !== 3) {
      onUpdate({ statusId: 3, statusName: 'Deceased' });
    }
  }, [isPcDead, character.statusId, onUpdate]);

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
    <CardShell
      syncing={isSyncing}
      className={cn(
        "flex flex-col relative group",
        isExpanded ? "border-[#2563eb]/40" : "hover:border-[#2563eb]/20"
      )}
    >
      
      <CharacterCardHeader
        characterName={character.characterName}
        playerName={character.playerName}
        statuses={statuses}
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

      <ExpandableContent isExpanded={isExpanded}>
        <CharacterCardExpanded
          character={character}
          isSyncing={isSyncing}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      </ExpandableContent>
    </CardShell>
  );
};
