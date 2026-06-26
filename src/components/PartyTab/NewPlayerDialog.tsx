import React, { useEffect, useState, useRef } from 'react';
import { X, UserPlus, AlertCircle, Edit2, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Character } from '../../types';
import { cn } from '../../lib/utils';
import { useFormState } from '../../hooks/useFormState';
import { suggestHitDiceConfig } from '../../lib/hitDice';
import { IrvMultiSelect } from '../ui/IrvMultiSelect';
import { StatBlock } from '../ui/StatBlock';
import { 
  DEFAULT_ABILITY_SCORES, 
  DEFAULT_PROFICIENCIES, 
  serializeAbilityScores, 
  serializeProficiencies,
  getPassiveScore
} from '../../lib/abilityScores';
import {
  ResourcePool,
  serializeResourcePools,
  addResourcePool,
  removeResourcePool,
  updateResourcePool
} from '../../lib/resourcePools';
import { getClassResourceSuggestions } from '../../lib/classResources';
import { getResourcePoolSuggestions } from '../../lib/resourcePoolScaling';

interface NewPlayerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (character: Omit<Character, 'id' | 'sheetRowIndex'>) => void;
}

type TabId = 'identity' | 'combat' | 'abilities' | 'resources';

const TABS: { id: TabId; label: string; optional?: boolean }[] = [
  { id: 'identity', label: 'Identity' },
  { id: 'combat', label: 'Combat Stats', optional: true },
  { id: 'abilities', label: 'Abilities', optional: true },
  { id: 'resources', label: 'Resources', optional: true },
];

export function NewPlayerDialog({ isOpen, onClose, onConfirm }: NewPlayerDialogProps) {
  const [activeTab, setActiveTab] = useState<TabId>('identity');

  const { values: formData, handleChange, reset } = useFormState({
    playerName: '',
    characterName: '',
    class: '',
    level: 1,
    statusId: 1, // Active
    ac: 10,
    maxHp: 10,
    hitDiceConfig: '',
    notes: '',
    resistances: '',
    immunities: '',
    vulnerabilities: '',
    abilityScores: DEFAULT_ABILITY_SCORES,
    proficiencies: DEFAULT_PROFICIENCIES,
    resourcePools: [] as ResourcePool[],
  });

  const poolsCustomized = useRef(false);

  // Tab 4 local state
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [newResourceName, setNewResourceName] = useState('');
  const [newResourceMax, setNewResourceMax] = useState(3);
  const [newResourceReset, setNewResourceReset] = useState<'short'|'long'|'none'>('long');

  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [editResourceName, setEditResourceName] = useState('');
  const [editResourceMax, setEditResourceMax] = useState(3);
  const [editResourceReset, setEditResourceReset] = useState<'short'|'long'|'none'>('long');

  useEffect(() => {
    if (!isOpen) {
      reset();
      setActiveTab('identity');
      poolsCustomized.current = false;
      setIsAddingResource(false);
      setEditingResourceId(null);
    }
  }, [isOpen, reset]);

  // Auto-suggest hit dice
  useEffect(() => {
    if (activeTab === 'combat' && !formData.hitDiceConfig && formData.class && formData.level) {
      const suggestion = suggestHitDiceConfig(formData.class, formData.level);
      if (suggestion) {
        handleChange('hitDiceConfig', suggestion);
      }
    }
  }, [activeTab, formData.class, formData.level, formData.hitDiceConfig, handleChange]);

  // Auto-suggest resource pools
  useEffect(() => {
    if (!poolsCustomized.current && formData.class) {
      const level = typeof formData.level === 'number' ? formData.level : (parseInt(formData.level) || 1);
      const suggestions = getResourcePoolSuggestions(
        formData.class,
        level,
        []
      );
      if (suggestions.length > 0) {
        handleChange('resourcePools',
          suggestions.map(s => ({
            name: s.name,
            current: s.suggestedMax,
            max: s.suggestedMax,
            reset: s.reset,
          }))
        );
      }
    }
  }, [formData.class, formData.level]);

  const isTab1Valid = formData.playerName.trim() !== '' && formData.characterName.trim() !== '';
  const isHitDiceValid = formData.hitDiceConfig.trim() === '' || /^\d+d\d+(\+\d+d\d+)*$/.test(formData.hitDiceConfig.trim());
  const isFormValid = isTab1Valid && isHitDiceValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    onConfirm({
      playerName: formData.playerName,
      characterName: formData.characterName,
      level: formData.level,
      class: formData.class,
      statusId: formData.statusId,
      statusName: formData.statusId === 1 ? 'Active' : formData.statusId === 2 ? 'Inactive' : 'Deceased',
      ac: formData.ac,
      maxHp: formData.maxHp,
      currentHp: formData.maxHp, // starts at max
      tempHp: 0,
      tempHpMax: 0,
      conditions: '',
      isActive: formData.statusId === 1,
      passivePerception: getPassiveScore(formData.abilityScores, formData.proficiencies, 'perception'),
      notes: formData.notes,
      resistances: formData.resistances,
      immunities: formData.immunities,
      vulnerabilities: formData.vulnerabilities,
      tempAc: 0,
      deathSavesFails: 0,
      deathSavesSuccesses: 0,
      hitDiceConfig: formData.hitDiceConfig,
      hitDiceUsed: '{}',
      abilityScores: serializeAbilityScores(formData.abilityScores),
      proficiencies: serializeProficiencies(formData.proficiencies),
      resourcePools: serializeResourcePools(formData.resourcePools),
    });
  };

  const handleAddResource = () => {
    const trimmed = newResourceName.trim();
    if (!trimmed) return;
    poolsCustomized.current = true;
    handleChange('resourcePools', addResourcePool(formData.resourcePools, {
      name: trimmed,
      max: newResourceMax,
      reset: newResourceReset
    }));
    setNewResourceName('');
    setNewResourceMax(3);
    setNewResourceReset('long');
    setIsAddingResource(false);
  };

  const handleUpdateResourceCurrent = (name: string, delta: number) => {
    poolsCustomized.current = true;
    const items = formData.resourcePools.map(p => {
      if (p.name === name) {
        return { ...p, current: Math.max(0, Math.min(p.max, p.current + delta)) };
      }
      return p;
    });
    handleChange('resourcePools', items);
  };

  const handleDeleteResource = (name: string) => {
    poolsCustomized.current = true;
    handleChange('resourcePools', removeResourcePool(formData.resourcePools, name));
  };
  
  const startEditResource = (pool: ResourcePool) => {
    setEditingResourceId(pool.name);
    setEditResourceName(pool.name);
    setEditResourceMax(pool.max);
    setEditResourceReset(pool.reset);
  };

  const handleSaveEditResource = (originalName: string) => {
    poolsCustomized.current = true;
    handleChange('resourcePools', updateResourcePool(formData.resourcePools, originalName, {
      name: editResourceName.trim() || originalName,
      max: editResourceMax,
      reset: editResourceReset
    }));
    setEditingResourceId(null);
  };

  const handleNext = () => {
    const currentIndex = TABS.findIndex(t => t.id === activeTab);
    if (currentIndex < TABS.length - 1) setActiveTab(TABS[currentIndex + 1].id);
  };

  const handlePrev = () => {
    const currentIndex = TABS.findIndex(t => t.id === activeTab);
    if (currentIndex > 0) setActiveTab(TABS[currentIndex - 1].id);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#fdfaf5] w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl border border-[#e5e1d8] flex flex-col mx-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-stone-900 rounded-t-xl transition-colors">
              <div className="flex items-center gap-3">
                <UserPlus className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-stone-100">Add Character</h2>
              </div>
              <button
                onClick={onClose}
                className="text-stone-400 hover:text-stone-200 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-stone-200 bg-stone-50/50 px-6 flex items-center overflow-x-auto no-scrollbar">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "px-4 py-3 text-sm transition-colors relative whitespace-nowrap",
                      isActive ? "text-amber-600 border-b-2 border-amber-500 font-medium" : "text-stone-500 hover:text-stone-700"
                    )}
                  >
                    {tab.label}
                    {!tab.optional && (
                      <span className="text-[10px] text-amber-600 ml-1.5">(required)</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Form Content Area */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col min-h-0">
              <div className="flex-1 px-6 py-5">
                {activeTab === 'identity' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                        Player Name
                      </label>
                      <input
                        type="text"
                        value={formData.playerName}
                        onChange={e => handleChange('playerName', e.target.value)}
                        placeholder="e.g. Sarah"
                        required
                        className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-stone-400 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                        Character Name
                      </label>
                      <input
                        type="text"
                        value={formData.characterName}
                        onChange={e => handleChange('characterName', e.target.value)}
                        placeholder="e.g. Drogar"
                        required
                        className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-stone-400 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                        Class
                      </label>
                      <input
                        type="text"
                        value={formData.class}
                        onChange={e => handleChange('class', e.target.value)}
                        placeholder="e.g. Barbarian, Monk, Vitalist"
                        className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-stone-400 shadow-sm"
                      />
                      <p className="text-xs text-stone-500 mt-1">
                        Used to suggest starting resources on the Resources tab
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                          Level
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={formData.level}
                          onChange={e => handleChange('level', parseInt(e.target.value) || 1)}
                          className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                          Status
                        </label>
                        <select
                          value={formData.statusId}
                          onChange={e => handleChange('statusId', parseInt(e.target.value))}
                          className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all appearance-none cursor-pointer shadow-sm"
                        >
                          <option value={1}>Active</option>
                          <option value={2}>Inactive</option>
                          <option value={3}>Deceased</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'combat' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                          Armor Class
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={formData.ac}
                          onChange={e => handleChange('ac', parseInt(e.target.value) || 10)}
                          className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                          Max HP
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.maxHp}
                          onChange={e => handleChange('maxHp', parseInt(e.target.value) || 1)}
                          className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                        Hit Dice
                      </label>
                      <input
                        type="text"
                        value={formData.hitDiceConfig}
                        onChange={e => handleChange('hitDiceConfig', e.target.value)}
                        placeholder="e.g. 5d10 or 4d8+1d6"
                        className={cn(
                          "w-full bg-white border rounded-lg px-4 py-2 text-sm text-stone-800 outline-none transition-all placeholder:text-stone-400 shadow-sm",
                          isHitDiceValid 
                            ? "border-stone-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400" 
                            : "border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        )}
                      />
                      {!isHitDiceValid && (
                        <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          <span>Invalid format. Must be like 2d6 or 1d8+2d6.</span>
                        </div>
                      )}
                      <p className="text-xs text-stone-500 mt-1">
                        Auto-suggested from class. Format: [count]d[size] (e.g. 5d10)
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                        RESISTANCES / IMMUNITIES / VULNERABILITIES
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <IrvMultiSelect
                          label="Resists"
                          value={formData.resistances}
                          onChange={v => handleChange('resistances', v)}
                          compact
                        />
                        <IrvMultiSelect
                          label="Immune"
                          value={formData.immunities}
                          onChange={v => handleChange('immunities', v)}
                          compact
                        />
                        <IrvMultiSelect
                          label="Vuln"
                          value={formData.vulnerabilities}
                          onChange={v => handleChange('vulnerabilities', v)}
                          compact
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-1.5 px-1">
                        Notes
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={e => handleChange('notes', e.target.value)}
                        placeholder="Special abilities, backstory notes..."
                        rows={3}
                        className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-stone-400 resize-none shadow-sm"
                      />
                    </div>
                  </div>
                )}
                {activeTab === 'abilities' && (
                  <div>
                    <p className="text-xs text-stone-500 italic mb-4">
                      Passive Perception, Insight, and Investigation are calculated automatically from these values.
                    </p>
                    <div className="bg-stone-100 rounded-xl p-3 shadow-inner border border-stone-200">
                      <StatBlock
                        abilityScores={formData.abilityScores}
                        proficiencies={formData.proficiencies}
                        characterLevel={formData.level}
                        readOnly={false}
                        onChange={(scores, profs) => {
                          handleChange('abilityScores', scores);
                          handleChange('proficiencies', profs);
                        }}
                      />
                    </div>
                  </div>
                )}
                {activeTab === 'resources' && (
                  <div className="space-y-4">
                    {formData.class && getClassResourceSuggestions(formData.class).length > 0 ? (
                      <p className="text-xs text-stone-500 italic mb-3">
                        Suggested pools for {formData.class}. Adjust max values to match your character.
                      </p>
                    ) : (formData.resourcePools.length === 0 && !isAddingResource) ? (
                      <p className="text-xs text-stone-500 italic mb-3">
                        No class entered. Add resource pools manually below.
                      </p>
                    ) : null}

                    <div className="space-y-2">
                      {formData.resourcePools.map(pool => {
                        const isEditing = editingResourceId === pool.name;
                        return (
                          <div key={pool.name} className="bg-white border border-stone-200 rounded-lg p-3 shadow-sm">
                            {isEditing ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <div>
                                    <label className="text-[10px] uppercase font-bold text-stone-500 mb-1 block">Name</label>
                                    <input
                                      type="text"
                                      value={editResourceName}
                                      onChange={e => setEditResourceName(e.target.value)}
                                      className="w-full text-xs bg-stone-50 text-stone-800 border border-stone-200 focus:border-amber-400 px-2 py-1.5 rounded outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] uppercase font-bold text-stone-500 mb-1 block">Max Uses</label>
                                    <input
                                      type="number"
                                      min={1}
                                      max={20}
                                      value={editResourceMax}
                                      onChange={e => setEditResourceMax(parseInt(e.target.value, 10) || 1)}
                                      className="w-full text-xs bg-stone-50 text-stone-800 border border-stone-200 focus:border-amber-400 px-2 py-1.5 rounded outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] uppercase font-bold text-stone-500 mb-1 block">Resets On</label>
                                    <select
                                      value={editResourceReset}
                                      onChange={e => setEditResourceReset(e.target.value as 'short'|'long'|'none')}
                                      className="w-full text-xs bg-stone-50 text-stone-800 border border-stone-200 focus:border-amber-400 px-2 py-1.5 rounded outline-none"
                                    >
                                      <option value="short">Short Rest</option>
                                      <option value="long">Long Rest</option>
                                      <option value="none">Never</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2 text-xs">
                                  <button type="button" onClick={() => setEditingResourceId(null)} className="px-3 py-1.5 text-stone-500 hover:text-stone-700">Cancel</button>
                                  <button type="button" onClick={() => handleSaveEditResource(pool.name)} className="px-3 py-1.5 bg-[#c5b358] text-[#2c2c26] hover:bg-[#b0a04f] font-medium rounded-xl transition-colors">Save</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="font-bold text-stone-800">{pool.name}</div>
                                  <div className={cn(
                                    "text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full",
                                    pool.reset === 'short' ? "bg-amber-100 text-amber-700 font-medium" :
                                    pool.reset === 'long' ? "bg-blue-100 text-blue-700 font-medium" :
                                    "bg-stone-100 text-stone-500"
                                  )}>
                                    {pool.reset === 'short' ? 'SR' : pool.reset === 'long' ? 'LR' : '—'}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateResourceCurrent(pool.name, -1)}
                                      disabled={pool.current <= 0}
                                      className="w-6 h-6 flex items-center justify-center bg-stone-50 border border-stone-200 rounded hover:bg-stone-100 text-stone-600 disabled:opacity-30 disabled:hover:bg-stone-50"
                                    >
                                      −
                                    </button>
                                    <span className="text-xs font-mono font-bold text-stone-700 w-8 text-center">{pool.current} / {pool.max}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateResourceCurrent(pool.name, 1)}
                                      disabled={pool.current >= pool.max}
                                      className="w-6 h-6 flex items-center justify-center bg-stone-50 border border-stone-200 rounded hover:bg-stone-100 text-stone-600 disabled:opacity-30 disabled:hover:bg-stone-50"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button type="button" onClick={() => startEditResource(pool)} className="p-1.5 text-stone-400 hover:text-amber-600 rounded transition-colors" title="Edit">
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button type="button" onClick={() => handleDeleteResource(pool.name)} className="text-red-400 hover:text-red-600 p-2" title="Delete">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {isAddingResource && (
                      <div className="bg-stone-100 border border-stone-200 rounded-lg p-3 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-stone-600 mb-1 block">Name</label>
                            <input
                              type="text"
                              value={newResourceName}
                              onChange={e => setNewResourceName(e.target.value)}
                              placeholder="e.g. Rage, Ki Points"
                              className="w-full text-xs bg-white text-stone-800 border border-stone-200 focus:border-amber-400 px-2 py-1.5 rounded outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-stone-600 mb-1 block">Max Uses</label>
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={newResourceMax}
                              onChange={e => setNewResourceMax(parseInt(e.target.value, 10) || 1)}
                              className="w-full text-xs bg-white text-stone-800 border border-stone-200 focus:border-amber-400 px-2 py-1.5 rounded outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-stone-600 mb-1 block">Resets On</label>
                            <select
                              value={newResourceReset}
                              onChange={e => setNewResourceReset(e.target.value as 'short'|'long'|'none')}
                              className="w-full text-xs bg-white text-stone-800 border border-stone-200 focus:border-amber-400 px-2 py-1.5 rounded outline-none"
                            >
                              <option value="short">Short Rest</option>
                              <option value="long">Long Rest</option>
                              <option value="none">Never</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 text-xs">
                          <button type="button" onClick={() => setIsAddingResource(false)} className="px-3 py-1.5 text-stone-500 hover:text-stone-700">Cancel</button>
                          <button type="button" onClick={handleAddResource} disabled={!newResourceName.trim()} className="px-3 py-1.5 bg-[#c5b358] text-[#2c2c26] hover:bg-[#b0a04f] font-medium rounded-xl disabled:opacity-50 transition-colors">Add</button>
                        </div>
                      </div>
                    )}

                    {!isAddingResource && (
                      <button
                        type="button"
                        onClick={() => setIsAddingResource(true)}
                        className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#c5b358] hover:text-[#b0a04f]"
                      >
                        <Plus className="w-3 h-3" /> Add Resource
                      </button>
                    )}

                    {formData.resourcePools.length === 0 && !isAddingResource && (
                      <div className="border border-dashed border-stone-200 rounded-lg p-6 text-center text-stone-400 text-sm italic bg-white/50">
                        No resource pools yet. Click '+ Add Resource' to add class abilities like Rage or Ki Points.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-stone-200 bg-stone-50/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  {activeTab !== 'identity' && (
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="text-sm text-stone-500 hover:text-stone-700 px-2 py-1 transition-colors"
                    >
                      ← Previous
                    </button>
                  )}
                  {activeTab !== 'resources' && (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="text-sm text-stone-500 hover:text-stone-700 px-2 py-1 transition-colors"
                    >
                      Next →
                    </button>
                  )}
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-[#e5e1d8] hover:bg-[#d4cfc1] text-[#2c2c26] text-sm font-medium px-4 py-2 rounded-xl mr-3 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid}
                    className="bg-[#c5b358] hover:bg-[#b0a04f] text-[#2c2c26] font-medium px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400 flex items-center justify-center shadow-lg"
                  >
                    Add Character
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
