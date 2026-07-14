import React, { useState, useEffect } from 'react';
import { Character, PoolEdit } from '../../types';
import { ArrowRight } from 'lucide-react';
import { IrvMultiSelect } from '../ui/IrvMultiSelect';
import { parseClassString, getHitDieForClass, addHitDieToConfig } from '../../lib/hitDice';
import { proficiencyBonusFromLevel, parseProficiencies, serializeProficiencies, parseAbilityScores, calculateModifier } from '../../lib/abilityScores';
import { calculateHpGain } from '../../lib/combatLogic';
import { ResourcePool, parseResourcePools, serializeResourcePools } from '../../lib/resourcePools';
import { LevelUpChecklist } from './LevelUpChecklist';
import { LevelUpResourcePools } from './LevelUpResourcePools';
import { useLevelUpAutomation } from '../../hooks/useLevelUpAutomation';
import { DialogShell } from '../ui/DialogShell';
import { Button } from '../ui/Button';
import { SectionHeader } from '../ui/SectionHeader';


export interface LevelUpDialogProps {
  character: Character;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (updates: Partial<Character>) => void;
}

export const LevelUpDialog: React.FC<LevelUpDialogProps> = ({
  character,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const classesList = parseClassString(character.class || '');
  const classLevels = classesList.map((cls, i) => {
    const perClass = Math.floor(character.level / classesList.length);
    const remainder = character.level % classesList.length;
    const currentClsLevel = perClass + (i < remainder ? 1 : 0);
    return {
      className: cls,
      currentLevel: currentClsLevel,
      nextLevel: currentClsLevel + 1,
    };
  });

  // Section A checklist states (visual only)
  const [chkHp, setChkHp] = useState(false);
  const [chkAc, setChkAc] = useState(false);
  const [chkPerception, setChkPerception] = useState(false);
  const [chkResistances, setChkResistances] = useState(false);
  const [chkOther, setChkOther] = useState(false);

  // Section B updated values states
  const [newLevel, setNewLevel] = useState<number>(character.level + 1);
  const [hpRoll, setHpRoll] = useState<number>(1);
  const [hasToughFeat, setHasToughFeat] = useState<boolean>(() =>
    parseProficiencies(character.proficiencies ?? '{}').toughFeat ?? false
  );
  const [hasJackOfAllTrades, setHasJackOfAllTrades] = useState<boolean>(() =>
    parseProficiencies(character.proficiencies ?? '{}').jackOfAllTrades ?? false
  );
  const [hasManuallyToggledJack, setHasManuallyToggledJack] = useState<boolean>(false);
  const [newAc, setNewAc] = useState<number>(character.ac);
  const [newNotes, setNewNotes] = useState<string>(character.notes || '');
  const [newResistances, setNewResistances] = useState<string>(character.resistances || '');
  const [newImmunities, setNewImmunities] = useState<string>(character.immunities || '');
  const [newVulnerabilities, setNewVulnerabilities] = useState<string>(character.vulnerabilities || '');

  // Multiclass / Class level increase states
  const [levelUpOption, setLevelUpOption] = useState<string>(''); // Class name or 'newClass'
  const [newClassName, setNewClassName] = useState('');
  const [newClassHitDie, setNewClassHitDie] = useState<number>(8);

  const [poolEdits, setPoolEdits] = useState<PoolEdit[]>([]);

  // Keep states updated if the input character prop changes while open
  useEffect(() => {
    if (isOpen) {
      setNewLevel(character.level + 1);
      setHpRoll(1);
      setHasToughFeat(parseProficiencies(character.proficiencies ?? '{}').toughFeat ?? false);
      setHasJackOfAllTrades(parseProficiencies(character.proficiencies ?? '{}').jackOfAllTrades ?? false);
      setHasManuallyToggledJack(false);
      setNewAc(character.ac);
      setNewNotes(character.notes || '');
      setNewResistances(character.resistances || '');
      setNewImmunities(character.immunities || '');
      setNewVulnerabilities(character.vulnerabilities || '');

      setChkHp(false);
      setChkAc(false);
      setChkPerception(false);
      setChkResistances(false);
      setChkOther(false);

      // Initialize class states
      const classesList = parseClassString(character.class || '');
      if (classesList.length > 0) {
        setLevelUpOption(classesList[0]);
      } else {
        setLevelUpOption('newClass');
      }
      setNewClassName('');
      setNewClassHitDie(8);
    }
  }, [character, isOpen]);

  const inProgressClass = levelUpOption === 'newClass'
    ? (character.class ? `${character.class}/${newClassName.trim()}` : newClassName.trim())
    : (character.class || '');

  useLevelUpAutomation(
    isOpen,
    newLevel,
    character,
    inProgressClass,
    hasManuallyToggledJack,
    setPoolEdits,
    setHasJackOfAllTrades
  );

  const conScore = parseAbilityScores(
    character.abilityScores ?? '{}'
  ).CON ?? 10;
  const conModifier = calculateModifier(conScore);

  const currentToughFeat = parseProficiencies(
    character.proficiencies ?? '{}'
  ).toughFeat ?? false;

  const totalHpGained = calculateHpGain(hpRoll, conScore, hasToughFeat);
  const hpIncrease = totalHpGained;

  const handleConfirm = () => {
    const finalClass = levelUpOption === 'newClass'
      ? (character.class ? `${character.class}/${newClassName.trim()}` : newClassName.trim())
      : (character.class || '');

    const hasClassUpdate = levelUpOption !== 'newClass' || newClassName.trim() !== '';

    // Proficiency tier sync logic
    const nextLevel = Number(newLevel);
    const newProfBonus = proficiencyBonusFromLevel(nextLevel);

    const updates: Partial<Character> = {
      level: Number(newLevel),
      proficiencies: (() => {
        try {
          const existing = parseProficiencies(
            character.proficiencies ?? '{}'
          );
          existing.proficiencyBonus = newProfBonus;
          existing.toughFeat = hasToughFeat;
          existing.jackOfAllTrades = hasJackOfAllTrades;
          return serializeProficiencies(existing);
        } catch {
          return character.proficiencies ?? '{}';
        }
      })(),
    };

    if (hasClassUpdate) {
      const hitDieSize = levelUpOption === 'newClass'
        ? newClassHitDie
        : (getHitDieForClass(levelUpOption) || 8);
      const newHitDiceConfig = addHitDieToConfig(character.hitDiceConfig || '', hitDieSize, 1);
      updates.class = finalClass;
      updates.hitDiceConfig = newHitDiceConfig;
    }

    updates.maxHp = character.maxHp + totalHpGained;
    updates.currentHp = character.currentHp + totalHpGained;

    if (Number(newAc) !== character.ac) {
      updates.ac = Number(newAc);
    }

    if (newResistances !== (character.resistances || '')) {
      updates.resistances = newResistances;
    }

    if (newImmunities !== (character.immunities || '')) {
      updates.immunities = newImmunities;
    }

    if (newVulnerabilities !== (character.vulnerabilities || '')) {
      updates.vulnerabilities = newVulnerabilities;
    }

    if (newNotes !== character.notes) {
      updates.notes = newNotes;
    }

    // Build the updated pool list from poolEdits
    const currentPoolsList = parseResourcePools(character.resourcePools || '[]');
    const updatedPools: ResourcePool[] = poolEdits
      .filter(e => e.include && e.max > 0)
      .map(e => {
        // For existing pools, preserve current value
        // For new pools, set current = max (full on level-up)
        const existing = currentPoolsList.find(p =>
          p.name.toLowerCase().trim() ===
          e.name.toLowerCase().trim()
        );
        return {
          name: e.name,
          max: e.max,
          current: existing
            ? Math.min(existing.current, e.max)
            : e.max,
          reset: e.reset,
        };
      });

    updates.resourcePools = serializeResourcePools(updatedPools);

    onConfirm(updates);
  };

  const isConfirmDisabled = levelUpOption === 'newClass' && !newClassName.trim();

  return (
    <DialogShell
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-lg"
      title="Level Up Wizard"
      subtitle={`${character.characterName} (Level ${character.level})`}
      footer={
        <div className="flex items-center justify-end gap-3 border-[#e2e8f0] bg-[#ffffff]">
          <Button
            id="cancel-dialog-btn"
            intent="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            id="confirm-level-up-btn"
            intent="primary"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="flex items-center gap-1.5"
          >
            Confirm Level Up <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      }
    >
      <div className="space-y-6 overflow-y-auto max-h-[70vh]">
        {/* SECTION A: GM Checklist */}
        <LevelUpChecklist
          chkHp={chkHp}
          setChkHp={setChkHp}
          chkAc={chkAc}
          setChkAc={setChkAc}
          chkPerception={chkPerception}
          setChkPerception={setChkPerception}
          chkResistances={chkResistances}
          setChkResistances={setChkResistances}
          chkOther={chkOther}
          setChkOther={setChkOther}
        />

        {/* SECTION B: Updated Values */}
        <div className="space-y-4" id="values-section">
          <SectionHeader>
            Section B: Updated Values
          </SectionHeader>

          {/* Class Level Up Selection */}
          <div className="bg-[#f9f8ff] border border-[#e2e8f0] rounded-2xl p-4 space-y-3">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#8d8db9]">
              Class Level Up / Multiclass
            </span>
            
            <div className="space-y-2">
              {classLevels.map((cLevel) => (
                <label key={cLevel.className} className="flex items-center gap-2.5 text-xs text-[#8d8db9] select-none cursor-pointer hover:text-[#0f172a]">
                  <input
                    type="radio"
                    name="level-up-class"
                    checked={levelUpOption === cLevel.className}
                    onChange={() => setLevelUpOption(cLevel.className)}
                    className="w-4 h-4 accent-[#2563eb]"
                  />
                  <span>
                    {cLevel.className} <span className="text-gray-400">(Level {cLevel.currentLevel} → {cLevel.nextLevel})</span>
                  </span>
                </label>
              ))}

              <label className="flex items-center gap-2.5 text-xs text-[#8d8db9] select-none cursor-pointer hover:text-[#0f172a]">
                <input
                  id="multiclass-radio-btn"
                  type="radio"
                  name="level-up-class"
                  checked={levelUpOption === 'newClass'}
                  onChange={() => setLevelUpOption('newClass')}
                  className="w-4 h-4 accent-[#2563eb]"
                />
                <span>Multiclassing into a new class</span>
              </label>
            </div>

            {levelUpOption === 'newClass' && (
              <div className="grid grid-cols-2 gap-3 pt-2 pl-6 border-l-2 border-[#2563eb]/30">
                <div>
                  <label htmlFor="new-class-name" className="block text-[9px] font-bold uppercase tracking-wider text-[#8d8db9] mb-1">
                    New Class Name
                  </label>
                  <input
                    id="new-class-name"
                    type="text"
                    placeholder="e.g. Fighter"
                    value={newClassName}
                    onChange={e => setNewClassName(e.target.value)}
                    className="bg-white border border-[#e2e8f0] rounded-xl text-[#0f172a] placeholder:text-[#8d8db9] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/50 focus:outline-none w-full px-3 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="new-class-hitdie" className="block text-[9px] font-bold uppercase tracking-wider text-[#8d8db9] mb-1">
                    Hit Die
                  </label>
                  <select
                    id="new-class-hitdie"
                    value={newClassHitDie}
                    onChange={e => setNewClassHitDie(parseInt(e.target.value, 10))}
                    className="bg-white border border-[#e2e8f0] rounded-xl text-[#0f172a] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/50 focus:outline-none w-full px-3 py-1.5 text-xs"
                  >
                    <option value={6}>d6</option>
                    <option value={8}>d8</option>
                    <option value={10}>d10</option>
                    <option value={12}>d12</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="new-level-input" className="block text-[9px] font-bold uppercase tracking-wider text-[#8d8db9] mb-1">
                New Level
              </label>
              <input
                id="new-level-input"
                type="number"
                value={newLevel}
                onFocus={(e) => e.target.select()}
                onChange={e => setNewLevel(Math.max(1, parseInt(e.target.value) || 0))}
                className="bg-white border border-[#e2e8f0] rounded-xl text-[#0f172a] placeholder:text-[#8d8db9] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/50 focus:outline-none w-full px-3 py-2 text-sm transition-all"
              />
            </div>

            <div>
              <label htmlFor="new-ac-input" className="block text-[9px] font-bold uppercase tracking-wider text-[#8d8db9] mb-1">
                New AC
              </label>
              <input
                id="new-ac-input"
                type="number"
                value={newAc}
                onFocus={(e) => e.target.select()}
                onChange={e => setNewAc(Math.max(0, parseInt(e.target.value) || 0))}
                className="bg-white border border-[#e2e8f0] rounded-xl text-[#0f172a] placeholder:text-[#8d8db9] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/50 focus:outline-none w-full px-3 py-2 text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px]
              font-bold uppercase tracking-wider
              text-[#8d8db9] mb-1">
              HP Roll
            </label>
            <input
              type="number"
              min="1"
              value={hpRoll}
              onChange={e => setHpRoll(
                Math.max(1, parseInt(e.target.value)
                  || 1)
              )}
              onFocus={e => e.target.select()}
              className="bg-white border
                border-[#e2e8f0] rounded-xl
                text-[#0f172a] focus:border-[#2563eb]
                focus:ring-1 focus:ring-[#2563eb]/50
                focus:outline-none w-full px-3 py-2
                text-sm transition-all"
            />
            <p className="text-xs text-[#8d8db9]
              mt-1">
              {conModifier >= 0 ? '+' : ''}
              {conModifier} from CON modifier
              {hasToughFeat ? ', +2 from Tough feat'
                : ''}
               — total HP gained:{' '}
              <span className="font-bold
                text-[#0f172a]">
                {totalHpGained}
              </span>
            </p>
            <label className="flex items-center
              gap-2 mt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasToughFeat}
                onChange={e => setHasToughFeat(
                  e.target.checked
                )}
                className="rounded border-[#e2e8f0]
                  text-[#2563eb] focus:ring-[#2563eb]
                  w-4 h-4"
              />
              <span className="text-xs
                text-[#8d8db9] font-medium">
                Tough feat (+2 HP per level)
              </span>
            </label>
            <label className="flex items-center
              gap-2 mt-2 cursor-pointer select-none"
              id="jack-of-all-trades-label"
            >
              <input
                id="jack-of-all-trades-checkbox"
                type="checkbox"
                checked={hasJackOfAllTrades}
                onChange={e => {
                  setHasJackOfAllTrades(e.target.checked);
                  setHasManuallyToggledJack(true);
                }}
                className="rounded border-[#e2e8f0]
                  text-[#2563eb] focus:ring-[#2563eb]
                  w-4 h-4"
              />
              <span className="text-xs
                text-[#8d8db9] font-medium">
                Jack of All Trades
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <IrvMultiSelect
              label="Resistances"
              value={newResistances}
              onChange={setNewResistances}
              placeholder="e.g. fire, poison"
            />

            <IrvMultiSelect
              label="Immunities"
              value={newImmunities}
              onChange={setNewImmunities}
              placeholder="e.g. poison, conditions"
            />

            <IrvMultiSelect
              label="Vulnerabilities"
              value={newVulnerabilities}
              onChange={setNewVulnerabilities}
              placeholder="e.g. bludgeoning"
            />

            <div>
              <label htmlFor="new-notes" className="block text-[9px] font-bold uppercase tracking-wider text-[#8d8db9] mb-1">
                Notes
              </label>
              <textarea
                id="new-notes"
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                placeholder="Record level up traits, feats, spell choices..."
                className="bg-white border border-[#e2e8f0] rounded-xl text-[#0f172a] placeholder:text-[#8d8db9] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/50 focus:outline-none w-full px-3 py-2 text-sm transition-all h-20 resize-none font-sans"
              />
            </div>
          </div>
        </div>

        {/* SECTION C: Resource Pools */}
        <LevelUpResourcePools poolEdits={poolEdits} setPoolEdits={setPoolEdits} />
      </div>
    </DialogShell>
  );
};
