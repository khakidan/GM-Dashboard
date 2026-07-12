import React from 'react';
import { Trash2 } from 'lucide-react';
import { Character } from '../../types';
import { cn } from '../../lib/utils';
import { DebouncedInput } from '../ui/DebouncedInput';
import { CardNumberInput } from '../ui/CardNumberInput';
import { DebouncedTextarea } from '../ui/DebouncedTextarea';
import { CharacterResourceSection } from './CharacterResourceSection';
import { IrvSection } from '../ui/IrvSection';
import { ResourcePoolsSection } from '../ui/ResourcePoolsSection';
import { getHitDiceStatus, getTotalHitDiceCount, parseHitDiceUsed, serializeHitDiceUsed } from '../../lib/hitDice';
import { getResourceForEffect, parseResourcePools, spendResourcePip, serializeResourcePools } from '../../lib/resourcePools';
import { toast } from 'sonner';
import { StatBlock } from '../ui/StatBlock';
import { LabeledField } from '../ui/LabeledField';
import { StatTile } from '../ui/StatTile';
import { PipTracker } from '../ui/PipTracker';
import { parseAbilityScores, parseProficiencies, serializeAbilityScores, serializeProficiencies, proficiencyBonusFromLevel } from '../../lib/abilityScores';
import { SpellcastingStatsRow } from '../ui/SpellcastingStatsRow';
import { serializeSpellcastingAbility } from '../../lib/spellcasting';
import { Button } from '../ui/Button';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { effectiveMaxHp } from '../../lib/conditions';

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
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const handleConditionAdded = (label: string) => {
    const resourceName = getResourceForEffect(label);
    if (!resourceName) return;

    const pools = parseResourcePools(character.resourcePools || '');
    const matchedPool = pools.find(
      (p) => p.name.toLowerCase() === resourceName.toLowerCase()
    );

    if (!matchedPool) return;

    if (matchedPool.current > 0) {
      const updatedPools = spendResourcePip(pools, resourceName, 1);
      onUpdate({
        resourcePools: serializeResourcePools(updatedPools),
      });
    } else {
      toast.warning(`${matchedPool.name} is already depleted.`);
    }
  };

  const parsedAbilityScores = 
    parseAbilityScores(character.abilityScores);
  const parsedProficiencies = 
    parseProficiencies(character.proficiencies);

  return (
    <div className="p-6 flex flex-col font-sans gap-5 bg-white">
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        <StatTile label="AC">
          <CardNumberInput
            value={character.ac || 0}
            onChange={v => onUpdate({ ac: v })}
            fallback={0}
            min={0}
            className="text-lg font-bold text-[#0f172a] w-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] rounded transition-all disabled:opacity-50"
            disabled={isSyncing}
          />
        </StatTile>
        <StatTile label="Max HP">
          <CardNumberInput
            value={character.maxHp || 0}
            onChange={v => onUpdate({ maxHp: v })}
            fallback={1}
            min={1}
            className={cn(
              "text-lg font-bold w-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] rounded transition-all disabled:opacity-50",
              character.tempHpMax && character.tempHpMax > 0 ? "text-[#2563eb] cursor-help" : "text-[#0f172a]"
            )}
            title={character.tempHpMax && character.tempHpMax > 0 ? `Temp max (original: ${character.maxHp})` : undefined}
            disabled={isSyncing}
          />
        </StatTile>
        <StatTile label="HP">
          <CardNumberInput
            value={character.currentHp ?? 0}
            onChange={v => onUpdate({ currentHp: v })}
            fallback={0}
            max={effectiveMaxHp(character.maxHp, character.tempHpMax)}
            className="text-lg font-bold text-[#0f172a] w-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] rounded transition-all disabled:opacity-50"
            disabled={isSyncing}
          />
        </StatTile>
        <StatTile label="Temp">
          <CardNumberInput
            value={character.tempHp ?? 0}
            onChange={v => onUpdate({ tempHp: v })}
            fallback={0}
            min={0}
            className="text-lg font-bold text-[#0f172a] w-full text-center bg-transparent border border-transparent outline-none focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] rounded transition-all disabled:opacity-50"
            disabled={isSyncing}
          />
        </StatTile>
        <StatTile label="Level" className="group/lvl">
          <CardNumberInput
            value={character.level || 1}
            onChange={v => onUpdate({ level: v })}
            fallback={1}
            min={1}
            max={20}
            placeholder="1"
            className="text-lg font-bold text-[#0f172a] w-full text-center bg-transparent border border-transparent rounded hover:bg-white focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-colors disabled:opacity-50"
            disabled={isSyncing}
          />
        </StatTile>
      </div>

      <StatBlock
        abilityScores={parsedAbilityScores}
        proficiencies={parsedProficiencies}
        characterLevel={character.level}
        readOnly={false}
        onChange={(scores, profs) => {
          onUpdate({
            abilityScores: serializeAbilityScores(scores),
            proficiencies: serializeProficiencies(profs),
          });
        }}
      />

      <SpellcastingStatsRow
        abilityScores={parsedAbilityScores}
        profBonus={proficiencyBonusFromLevel(character.level)}
        className={character.class}
        overrideAbility={parsedProficiencies.spellcastingAbility}
        onOverrideChange={(ability) => {
          const updated = { ...parsedProficiencies };
          if (ability === undefined) {
            delete updated.spellcastingAbility;
          } else {
            updated.spellcastingAbility = ability;
          }
          onUpdate({
            proficiencies: serializeProficiencies(updated),
            spellcastingAbility: serializeSpellcastingAbility(ability),
          });
        }}
      />

      <LabeledField label="Class">
        <DebouncedInput 
          type="text"
          value={character.class || ''}
          onChange={(v) => onUpdate({ class: v as string })}
          className="text-sm text-[#0f172a] font-medium bg-[#ffffff] p-3 border border-[#e2e8f0] rounded-lg hover:bg-white focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all placeholder:text-[#cccbcb] disabled:opacity-50 w-full"
          placeholder="e.g. Barbarian or Barbarian / Fighter"
          disabled={isSyncing}
        />
      </LabeledField>

      {/* Hit Dice Config and Display Section */}
      <div className="border border-[#e2e8f0] hover:border-[#2563eb]/30 rounded-xl bg-white p-4 space-y-3 shadow-inner">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#e2e8f0]/50 pb-2">
          <div className="text-[10px] uppercase text-[#8d8db9] font-bold tracking-widest px-1">
            Hit Dice
          </div>
          {/* Config Input directly inline */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8d8db9]/70">Config:</span>
            <DebouncedInput
              type="text"
              value={character.hitDiceConfig || ''}
              onChange={(value) => onUpdate({ hitDiceConfig: value as string })}
              placeholder="e.g. 5d8 or 2d10+3d8"
              className="text-xs bg-[#ffffff] hover:bg-white focus:bg-white text-[#0f172a] border border-[#e2e8f0] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none px-2 py-1 rounded w-36 transition-all font-mono"
              disabled={isSyncing}
              id={`hit-dice-config-input-${character.id}`}
            />
          </div>
        </div>

        {/* Pool Display */}
        {!character.hitDiceConfig ? (
          <p className="text-xs text-[#8d8db9]/60 italic px-1" id={`hit-dice-empty-helper-${character.id}`}>
            No hit dice configured. Enter a formula (e.g., "5d8" or "2d10+3d8") to track rest pools.
          </p>
        ) : (
          <div className="space-y-2">
            {(() => {
              const pools = getHitDiceStatus(character.hitDiceConfig, character.hitDiceUsed || '{}');
              if (pools.length === 0) {
                return (
                  <p className="text-xs text-[#2563eb] italic px-1">
                    Invalid hit dice config formula. Use e.g. "5d8" or "1d10+4d8".
                  </p>
                );
              }
              return pools.map((pool) => {
                return (
                  <div key={pool.die} className="flex items-center justify-between text-xs py-1 px-1 border-b border-[#ffffff]/50 last:border-b-0" id={`pool-display-d${pool.die}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-[#20201a] inline-block bg-[#f9f8ff] px-1.5 py-0.5 rounded text-[10px]">
                        d{pool.die}
                      </span>
                      <span className="font-mono text-[#8d8db9]">
                        {pool.remaining} / {getTotalHitDiceCount(character.hitDiceConfig || '')} remaining
                      </span>
                    </div>
                    {/* Visual spent indicators */}
                    <PipTracker
                      max={pool.count}
                      remaining={pool.remaining}
                      onChange={(newValue) => {
                        const used = parseHitDiceUsed(character.hitDiceUsed || '{}');
                        const newUsed = pool.count - newValue;
                        const updatedUsed = { ...used, [`d${pool.die}`]: Math.max(0, newUsed) };
                        onUpdate({ hitDiceUsed: serializeHitDiceUsed(updatedUsed) });
                      }}
                      color="blue"
                      size="default"
                      label={`d${pool.die} hit die`}
                    />
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      <ResourcePoolsSection
        character={character}
        isSyncing={isSyncing}
        onUpdate={onUpdate}
      />

      <CharacterResourceSection
        conditions={character.conditions || ''}
        onConditionsChange={(v) => onUpdate({ conditions: v })}
        immunities={character.immunities || ''}
        combatantId={character.id}
        onConditionAdded={handleConditionAdded}
        characterId={character.id}
        onUpdateCharacter={(id, updates) => onUpdate(updates)}
      />

      <IrvSection
        resistances={character.resistances || ''}
        immunities={character.immunities || ''}
        vulnerabilities={character.vulnerabilities || ''}
        onUpdate={onUpdate}
        labels={{
          resistances: 'Resistances',
          immunities: 'Immunities',
          vulnerabilities: 'Vulnerabilities',
        }}
        placeholders={{
          resistances: 'e.g. fire',
          immunities: 'e.g. poison',
          vulnerabilities: 'e.g. cold',
        }}
        gap="gap-4"
      />

      <LabeledField label="Notes">
        <DebouncedTextarea 
          value={character.notes}
          onChange={(v) => onUpdate({ notes: v })}
          placeholder="Notes..."
          className="w-full text-sm text-[#0f172a] bg-transparent p-3 rounded-lg italic resize-none border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all h-24 placeholder:text-[#8d8db9]/40 disabled:opacity-50"
          disabled={isSyncing}
        />
      </LabeledField>

      <div className="pt-4">
        <Button intent="destructive" size="large" onClick={() => setIsConfirmOpen(true)} disabled={isSyncing} className="w-full flex items-center justify-center gap-2">
          <Trash2 className="w-4 h-4" />
          Delete Player
        </Button>
        <ConfirmationDialog
          isOpen={isConfirmOpen}
          title="Delete Player?"
          description={`This will permanently remove ${character.characterName} from your party roster. This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={onDelete}
          onClose={() => setIsConfirmOpen(false)}
        />
      </div>
    </div>
  );
};
