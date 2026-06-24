import React, { useState, useEffect } from 'react';
import { Character } from '../../types';
import { X, ArrowRight, CheckSquare, Square } from 'lucide-react';
import { IrvMultiSelect } from '../ui/IrvMultiSelect';
import { parseClassString, getHitDieForClass, addHitDieToConfig } from '../../lib/hitDice';
import { proficiencyBonusFromLevel, parseProficiencies, serializeProficiencies } from '../../lib/abilityScores';
import { getResourcePoolSuggestions } from '../../lib/resourcePoolScaling';
import { ResourcePool, parseResourcePools, serializeResourcePools } from '../../lib/resourcePools';


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
  const [newMaxHp, setNewMaxHp] = useState<number>(character.maxHp);
  const [alsoIncreaseCurrentHp, setAlsoIncreaseCurrentHp] = useState(true);
  const [newAc, setNewAc] = useState<number>(character.ac);
  const [newPassivePerception, setNewPassivePerception] = useState<number>(character.passivePerception);
  const [newNotes, setNewNotes] = useState<string>(character.notes || '');
  const [newResistances, setNewResistances] = useState<string>(character.resistances || '');
  const [newImmunities, setNewImmunities] = useState<string>(character.immunities || '');
  const [newVulnerabilities, setNewVulnerabilities] = useState<string>(character.vulnerabilities || '');

  // Multiclass / Class level increase states
  const [levelUpOption, setLevelUpOption] = useState<string>(''); // Class name or 'newClass'
  const [newClassName, setNewClassName] = useState('');
  const [newClassHitDie, setNewClassHitDie] = useState<number>(8);

  const [poolEdits, setPoolEdits] = useState<
    Array<{
      name: string;
      max: number;
      reset: 'short' | 'long' | 'none';
      isNew: boolean;
      include: boolean;
      isAutoDerived: boolean;
    }>
  >([]);

  useEffect(() => {
    if (isOpen) {
      const currentPools = parseResourcePools(character.resourcePools || '[]');
      const suggestions = getResourcePoolSuggestions(
        character.class ?? '',
        newLevel,
        currentPools
      );
      setPoolEdits(suggestions.map(s => ({
        name: s.name,
        max: s.suggestedMax,
        reset: s.reset,
        isNew: s.isNew,
        include: s.suggestedMax > 0,
        isAutoDerived: s.isAutoDerived
      })));
    } else {
      setPoolEdits([]);
    }
  }, [isOpen, newLevel, character.class, character.resourcePools]);

  // Keep states updated if the input character prop changes while open
  useEffect(() => {
    if (isOpen) {
      setNewLevel(character.level + 1);
      setNewMaxHp(character.maxHp);
      setAlsoIncreaseCurrentHp(true);
      setNewAc(character.ac);
      setNewPassivePerception(character.passivePerception);
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

  if (!isOpen) return null;

  // Derive HP Gain (can be negative or positive, but we're mostly interested in positive increase)
  const hpIncrease = Math.max(0, newMaxHp - character.maxHp);

  const handleConfirm = () => {
    const finalClass = levelUpOption === 'newClass'
      ? (character.class ? `${character.class}/${newClassName.trim()}` : newClassName.trim())
      : (character.class || '');

    const hasClassUpdate = levelUpOption !== 'newClass' || newClassName.trim() !== '';

    const updates: Partial<Character> = {
      level: Number(newLevel),
    };

    // Proficiency tier sync logic
    const nextLevel = Number(newLevel);
    const newProfBonus = proficiencyBonusFromLevel(nextLevel);
    const oldProfBonus = proficiencyBonusFromLevel(character.level);

    if (newProfBonus !== oldProfBonus) {
      const currentProfs = parseProficiencies(character.proficiencies || '{}');
      const storedBonus = currentProfs.proficiencyBonus;

      // Only update if not manually overridden
      // (stored value matches old calculated value OR is unset/0)
      const wasAutoCalculated = storedBonus === 0 || storedBonus === oldProfBonus;

      if (wasAutoCalculated) {
        const updatedProfs = {
          ...currentProfs,
          proficiencyBonus: newProfBonus,
        };
        updates.proficiencies = serializeProficiencies(updatedProfs);
      }
    }

    if (hasClassUpdate) {
      const hitDieSize = levelUpOption === 'newClass'
        ? newClassHitDie
        : (getHitDieForClass(levelUpOption) || 8);
      const newHitDiceConfig = addHitDieToConfig(character.hitDiceConfig || '', hitDieSize, 1);
      updates.class = finalClass;
      updates.hitDiceConfig = newHitDiceConfig;
    }

    if (Number(newMaxHp) !== character.maxHp) {
      updates.maxHp = Number(newMaxHp);
    }

    if (alsoIncreaseCurrentHp && hpIncrease > 0) {
      const finalCurrentHp = Math.min(Number(newMaxHp), character.currentHp + hpIncrease);
      if (finalCurrentHp !== character.currentHp) {
        updates.currentHp = finalCurrentHp;
      }
    }

    if (Number(newAc) !== character.ac) {
      updates.ac = Number(newAc);
    }

    if (Number(newPassivePerception) !== character.passivePerception) {
      updates.passivePerception = Number(newPassivePerception);
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

  const isConfirmDisabled = levelUpOption === 'newClass' && !!character.class && !newClassName.trim();

  return (
    <div
      id="level-up-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2c2c26]/60 backdrop-blur-sm overflow-y-auto"
    >
      <div
        id="level-up-dialog"
        className="bg-[#fdfaf5] w-full max-w-lg rounded-2xl shadow-xl border border-[#e5e1d8] overflow-hidden flex flex-col my-8"
      >
        {/* Header */}
        <div className="bg-[#2c2c26] px-6 py-4 text-[#fdfaf5] flex items-center justify-between rounded-t-2xl">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold font-serif uppercase tracking-wider text-[#c5b358]">
              Level Up Wizard
            </h2>
            <p className="text-[10px] text-[#e5e1d8]/60 font-sans font-bold uppercase tracking-wider mt-0.5">
              {character.characterName} (Level {character.level})
            </p>
          </div>
          <button
            id="close-dialog-btn"
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-[#e5e1d8] hover:text-white cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* SECTION A: GM Checklist */}
          <div className="space-y-3" id="checklist-section">
            <h3 className="text-[#5a5a40] text-xs font-bold uppercase tracking-widest border-b border-[#e5e1d8] pb-1 mb-2">
              Section A: GM Checklist <span className="text-[9px] font-normal text-[#5a5a40] normal-case tracking-normal">(visual only memory aid)</span>
            </h3>
            
            <div className="space-y-2.5">
              <button
                id="chk-hp-btn"
                onClick={() => setChkHp(!chkHp)}
                className="flex items-start gap-2.5 w-full text-left text-xs text-[#5a5a40] hover:text-[#2c2c26] transition-colors"
              >
                {chkHp ? (
                  <CheckSquare className="w-4 h-4 text-[#c5b358] shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-[#e5e1d8] hover:border-[#c5b358] shrink-0 mt-0.5" />
                )}
                <span>
                  <strong>Ask player:</strong> what is your new Max HP?
                  <span className="block text-[10px] text-gray-400 mt-0.5">(Roll hit die + CON modifier, or take the average)</span>
                </span>
              </button>

              <button
                id="chk-ac-btn"
                onClick={() => setChkAc(!chkAc)}
                className="flex items-start gap-2.5 w-full text-left text-xs text-[#5a5a40] hover:text-[#2c2c26] transition-colors"
              >
                {chkAc ? (
                  <CheckSquare className="w-4 h-4 text-[#c5b358] shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-[#e5e1d8] shrink-0 mt-0.5" />
                )}
                <span>
                  <strong>Ask player:</strong> did your AC change?
                  <span className="block text-[10px] text-gray-400 mt-0.5">(New armor, Unarmored Defense change, magical item, etc.)</span>
                </span>
              </button>

              <button
                id="chk-perc-btn"
                onClick={() => setChkPerception(!chkPerception)}
                className="flex items-start gap-2.5 w-full text-left text-xs text-[#5a5a40] hover:text-[#2c2c26] transition-colors"
              >
                {chkPerception ? (
                  <CheckSquare className="w-4 h-4 text-[#c5b358] shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-[#e5e1d8] shrink-0 mt-0.5" />
                )}
                <span>
                  <strong>Ask player:</strong> did your Passive Perception change?
                  <span className="block text-[10px] text-gray-400 mt-0.5">(Wisdom score increase, new Perception proficiency, etc.)</span>
                </span>
              </button>

              <button
                id="chk-res-btn"
                onClick={() => setChkResistances(!chkResistances)}
                className="flex items-start gap-2.5 w-full text-left text-xs text-[#5a5a40] hover:text-[#2c2c26] transition-colors"
              >
                {chkResistances ? (
                  <CheckSquare className="w-4 h-4 text-[#c5b358] shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-[#e5e1d8] shrink-0 mt-0.5" />
                )}
                <span>
                  <strong>Ask player:</strong> any new resistances, immunities, or special traits to record in Notes?
                </span>
              </button>

              <button
                id="chk-other-btn"
                onClick={() => setChkOther(!chkOther)}
                className="flex items-start gap-2.5 w-full text-left text-xs text-[#5a5a40] hover:text-[#2c2c26] transition-colors"
              >
                {chkOther ? (
                  <CheckSquare className="w-4 h-4 text-[#c5b358] shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-[#e5e1d8] shrink-0 mt-0.5" />
                )}
                <span>
                  <strong>Ask player:</strong> any other stat changes?
                  <span className="block text-[10px] text-gray-400 mt-0.5">(Speed, saving throws, new features, etc. — notes only)</span>
                </span>
              </button>
            </div>
          </div>

          {/* SECTION B: Updated Values */}
          <div className="space-y-4" id="values-section">
            <h3 className="text-[#5a5a40] text-xs font-bold uppercase tracking-widest border-b border-[#e5e1d8] pb-1 mb-2">
              Section B: Updated Values
            </h3>

            {/* Class Level Up Selection */}
            <div className="bg-[#fcfbf9] border border-[#e5e1d8] rounded-2xl p-4 space-y-3">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-[#5a5a40]">
                Class Level Up / Multiclass
              </span>
              
              <div className="space-y-2">
                {classLevels.map((cLevel) => (
                  <label key={cLevel.className} className="flex items-center gap-2.5 text-xs text-[#5a5a40] select-none cursor-pointer hover:text-[#2c2c26]">
                    <input
                      type="radio"
                      name="level-up-class"
                      checked={levelUpOption === cLevel.className}
                      onChange={() => setLevelUpOption(cLevel.className)}
                      className="w-4 h-4 accent-[#c5b358]"
                    />
                    <span>
                      {cLevel.className} <span className="text-gray-400">(Level {cLevel.currentLevel} → {cLevel.nextLevel})</span>
                    </span>
                  </label>
                ))}

                <label className="flex items-center gap-2.5 text-xs text-[#5a5a40] select-none cursor-pointer hover:text-[#2c2c26]">
                  <input
                    id="multiclass-radio-btn"
                    type="radio"
                    name="level-up-class"
                    checked={levelUpOption === 'newClass'}
                    onChange={() => setLevelUpOption('newClass')}
                    className="w-4 h-4 accent-[#c5b358]"
                  />
                  <span>Multiclassing into a new class</span>
                </label>
              </div>

              {levelUpOption === 'newClass' && (
                <div className="grid grid-cols-2 gap-3 pt-2 pl-6 border-l-2 border-[#c5b358]/30">
                  <div>
                    <label htmlFor="new-class-name" className="block text-[9px] font-bold uppercase tracking-wider text-[#5a5a40] mb-1">
                      New Class Name
                    </label>
                    <input
                      id="new-class-name"
                      type="text"
                      placeholder="e.g. Fighter"
                      value={newClassName}
                      onChange={e => setNewClassName(e.target.value)}
                      className="bg-white border border-[#e5e1d8] rounded-xl text-[#2c2c26] placeholder:text-[#5a5a40] focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358]/50 focus:outline-none w-full px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-class-hitdie" className="block text-[9px] font-bold uppercase tracking-wider text-[#5a5a40] mb-1">
                      Hit Die
                    </label>
                    <select
                      id="new-class-hitdie"
                      value={newClassHitDie}
                      onChange={e => setNewClassHitDie(parseInt(e.target.value, 10))}
                      className="bg-white border border-[#e5e1d8] rounded-xl text-[#2c2c26] focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358]/50 focus:outline-none w-full px-3 py-1.5 text-xs"
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
                <label htmlFor="new-level-input" className="block text-[9px] font-bold uppercase tracking-wider text-[#5a5a40] mb-1">
                  New Level
                </label>
                <input
                  id="new-level-input"
                  type="number"
                  value={newLevel}
                  onFocus={(e) => e.target.select()}
                  onChange={e => setNewLevel(Math.max(1, parseInt(e.target.value) || 0))}
                  className="bg-white border border-[#e5e1d8] rounded-xl text-[#2c2c26] placeholder:text-[#5a5a40] focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358]/50 focus:outline-none w-full px-3 py-2 text-sm transition-all"
                />
              </div>

              <div>
                <label htmlFor="new-ac-input" className="block text-[9px] font-bold uppercase tracking-wider text-[#5a5a40] mb-1">
                  New AC
                </label>
                <input
                  id="new-ac-input"
                  type="number"
                  value={newAc}
                  onFocus={(e) => e.target.select()}
                  onChange={e => setNewAc(Math.max(0, parseInt(e.target.value) || 0))}
                  className="bg-white border border-[#e5e1d8] rounded-xl text-[#2c2c26] placeholder:text-[#5a5a40] focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358]/50 focus:outline-none w-full px-3 py-2 text-sm transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-[#fdfaf5] border border-[#e5e1d8] rounded-2xl p-4">
              <div>
                <label htmlFor="new-max-hp-input" className="block text-[9px] font-bold uppercase tracking-wider text-[#5a5a40] mb-1">
                  New Max HP
                </label>
                <input
                  id="new-max-hp-input"
                  type="number"
                  value={newMaxHp}
                  onFocus={(e) => e.target.select()}
                  onChange={e => setNewMaxHp(Math.max(1, parseInt(e.target.value) || 0))}
                  className="bg-white border border-[#e5e1d8] rounded-xl text-[#2c2c26] placeholder:text-[#5a5a40] focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358]/50 focus:outline-none w-full px-3 py-2 text-sm transition-all"
                />
              </div>

              <div>
                <span className="block text-[9px] font-bold uppercase tracking-wider text-[#5a5a40] mb-1">
                  HP Increase
                </span>
                <div className="bg-gray-100/70 text-gray-700 rounded-xl px-3 py-2 text-sm font-bold border border-[#e5e1d8] h-[38px] flex items-center justify-between">
                  <span id="hp-increase-display">{hpIncrease}</span>
                  <span className="text-[9px] font-normal text-gray-400">gained this level</span>
                </div>
              </div>

              <div className="col-span-2">
                <label
                  htmlFor="also-increase-hp"
                  className="flex items-center gap-2.5 text-xs text-[#5a5a40] select-none cursor-pointer hover:text-[#2c2c26]"
                >
                  <input
                    id="also-increase-hp"
                    type="checkbox"
                    checked={alsoIncreaseCurrentHp}
                    onChange={e => setAlsoIncreaseCurrentHp(e.target.checked)}
                    className="w-4 h-4 accent-[#c5b358] cursor-pointer"
                  />
                  <span>
                    Also increase Current HP by <strong className="text-[#c5b358]">{hpIncrease}</strong>
                  </span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="new-passive-perception" className="block text-[9px] font-bold uppercase tracking-wider text-[#5a5a40] mb-1">
                  New Passive Perception
                </label>
                <input
                  id="new-passive-perception"
                  type="number"
                  value={newPassivePerception}
                  onFocus={(e) => e.target.select()}
                  onChange={e => setNewPassivePerception(Math.max(0, parseInt(e.target.value) || 0))}
                  className="bg-white border border-[#e5e1d8] rounded-xl text-[#2c2c26] placeholder:text-[#5a5a40] focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358]/50 focus:outline-none w-full px-3 py-2 text-sm transition-all"
                />
              </div>

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
                <label htmlFor="new-notes" className="block text-[9px] font-bold uppercase tracking-wider text-[#5a5a40] mb-1">
                  Notes
                </label>
                <textarea
                  id="new-notes"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Record level up traits, feats, spell choices..."
                  className="bg-white border border-[#e5e1d8] rounded-xl text-[#2c2c26] placeholder:text-[#5a5a40] focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358]/50 focus:outline-none w-full px-3 py-2 text-sm transition-all h-20 resize-none font-sans"
                />
              </div>
            </div>
          </div>

          {/* SECTION C: Resource Pools */}
          {poolEdits.length > 0 && (
            <div className="space-y-3" id="resource-pools-section">
              <h3 className="text-[#5a5a40] text-xs font-bold uppercase tracking-widest border-b border-[#e5e1d8] pb-1 mb-2">
                Resource Pools
              </h3>
              <div className="border border-[#e5e1d8] rounded-2xl p-4 bg-[#f5f1e8] space-y-3">
                {poolEdits.map((entry, index) => (
                  <div
                    key={entry.name}
                    className={`flex items-center justify-between gap-4 py-2 border-b border-[#e5e1d8]/50 last:border-0 ${
                      !entry.include ? 'opacity-50' : ''
                    }`}
                    id={`pool-row-${entry.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {/* LEFT: pool name + badge */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-[#2c2c26] font-medium text-xs truncate">
                        {entry.name}
                      </span>
                      {entry.isNew && (
                        <span className="bg-[#c5b358]/20 border border-[#c5b358] text-[#8a7a20] px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0">
                          New
                        </span>
                      )}
                    </div>

                    {/* MIDDLE: input + auto label */}
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={entry.max}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                          setPoolEdits(prev => prev.map((item, i) => i === index ? { ...item, max: val } : item));
                        }}
                        disabled={!entry.include}
                        className="bg-white border border-[#e5e1d8] rounded-xl text-[#2c2c26] focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358]/50 focus:outline-none w-16 px-2 py-1 text-xs text-center font-bold"
                        id={`pool-input-${entry.name.toLowerCase().replace(/\s+/g, '-')}`}
                      />
                      {entry.isAutoDerived && (
                        <span className="text-[#5a5a40] text-[9px] font-bold bg-[#5a5a40]/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                          Auto
                        </span>
                      )}
                    </div>

                    {/* RIGHT: reset label */}
                    <div className="w-24 text-right shrink-0">
                      <span className="text-[#5a5a40] text-[11px] font-medium">
                        {entry.reset === 'short'
                          ? 'Short/Long Rest'
                          : entry.reset === 'long'
                          ? 'Long Rest'
                          : 'Manual'}
                      </span>
                    </div>

                    {/* FAR RIGHT: include checkbox for new pools only */}
                    <div className="w-12 flex justify-end shrink-0">
                      {entry.isNew ? (
                        <label className="flex items-center gap-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={entry.include}
                            onChange={(e) => {
                              setPoolEdits(prev => prev.map((item, i) => i === index ? { ...item, include: e.target.checked } : item));
                            }}
                            className="w-3.5 h-3.5 accent-[#c5b358] cursor-pointer"
                            id={`pool-checkbox-${entry.name.toLowerCase().replace(/\s+/g, '-')}`}
                          />
                          <span className="text-[9px] font-bold text-[#5a5a40] uppercase">Add</span>
                        </label>
                      ) : (
                        <div className="w-7 h-3.5" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#fdfaf5] px-6 py-4 border-t border-[#e5e1d8] flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            id="cancel-dialog-btn"
            onClick={onClose}
            className="text-[#5a5a40] border border-[#e5e1d8] rounded-xl px-3 py-1.5 text-xs hover:border-[#c5b358] hover:text-[#2c2c26] transition-colors"
          >
            Cancel
          </button>
          <button
            id="confirm-level-up-btn"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="bg-[#c5b358] text-[#2c2c26] font-bold uppercase tracking-widest text-xs rounded-xl px-4 py-2 hover:bg-[#d4c47a] transition-colors disabled:bg-[#e5e1d8] disabled:text-[#5a5a40] disabled:cursor-not-allowed disabled:opacity-60 shadow-sm flex items-center gap-1.5"
          >
            Confirm Level Up <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
