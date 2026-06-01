import React, { useState, useEffect } from 'react';
import { X, Library, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { NPC as Npc, Character, Combatant } from '../../types';
import { IrvMultiSelect } from '../ui/IrvMultiSelect';

interface CombatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  npcs: Npc[];
  characters: Character[];
  onAddPreset: (type: 'pc' | 'npc', presetId: string, quantity: number) => Promise<void>;
  onAddNpc: (
    name: string, 
    hp: number | '', 
    ac: number | '', 
    notes: string,
    resistances: string,
    immunities: string,
    vulnerabilities: string
  ) => Promise<void>;
  combatants?: Combatant[];
  onUpdateCombatant?: (id: string, updates: Partial<Combatant>) => void;
}

export function CombatSidebar({
  isOpen,
  onClose,
  npcs,
  characters,
  onAddPreset,
  onAddNpc,
  combatants = [],
  onUpdateCombatant
}: CombatSidebarProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [presetType, setPresetType] = useState<'pc' | 'npc'>('npc');
  const [presetQuantity, setPresetQuantity] = useState<number>(1);
  const [isAddingPreset, setIsAddingPreset] = useState(false);

  const [npcName, setNpcName] = useState('');
  const [npcHp, setNpcHp] = useState<number | ''>('');
  const [npcAc, setNpcAc] = useState<number | ''>('');
  const [npcNotes, setNpcNotes] = useState('');
  const [npcResistances, setNpcResistances] = useState('');
  const [npcImmunities, setNpcImmunities] = useState('');
  const [npcVulnerabilities, setNpcVulnerabilities] = useState('');
  const [isAddingNpc, setIsAddingNpc] = useState(false);

  const [selectedToolsNpcId, setSelectedToolsNpcId] = useState<string>('');
  const [abilityName, setAbilityName] = useState<string>('');
  const [rechargeThreshold, setRechargeThreshold] = useState<number>(5);

  const [legendaryActionsMax, setLegendaryActionsMax] = useState<number>(3);
  const [legendaryResistancesMax, setLegendaryResistancesMax] = useState<number>(3);

  useEffect(() => {
    if (selectedToolsNpcId) {
      const npc = combatants.find(c => c.id === selectedToolsNpcId);
      if (npc) {
        setLegendaryActionsMax(npc.legendaryActions?.max ?? 3);
        setLegendaryResistancesMax(npc.legendaryResistances?.max ?? 3);
      }
    }
  }, [selectedToolsNpcId, combatants]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddPreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPreset) return;
    setIsAddingPreset(true);
    await onAddPreset(presetType, selectedPreset, presetQuantity);
    setIsAddingPreset(false);
    setSelectedPreset('');
    setPresetQuantity(1);
  };

  const handleAddNpc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!npcName || npcHp === '') return;
    setIsAddingNpc(true);
    await onAddNpc(
      npcName, 
      npcHp, 
      npcAc, 
      npcNotes, 
      npcResistances, 
      npcImmunities, 
      npcVulnerabilities
    );
    setIsAddingNpc(false);
    setNpcName('');
    setNpcHp('');
    setNpcAc('');
    setNpcNotes('');
    setNpcResistances('');
    setNpcImmunities('');
    setNpcVulnerabilities('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div 
        className="bg-[#fdfaf5] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#e5e1d8] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-[#2c2c26] p-6 text-[#e5e1d8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Library className="w-6 h-6 text-[#c5b358]" />
            <h2 className="text-xl font-bold font-serif uppercase tracking-wider">Combat Tools</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[80vh] scrollbar-thin scrollbar-thumb-[#e5e1d8] scrollbar-track-transparent">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Add from Library Column */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2 border-b border-[#e5e1d8] pb-2">
                <Library className="w-4 h-4 text-[#c5b358]" />
                <h3 className="text-sm font-bold text-[#2c2c26] font-serif uppercase tracking-wider">Add from Library</h3>
              </div>
              <form onSubmit={handleAddPreset} className="space-y-4 font-sans">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => { setPresetType('npc'); setSelectedPreset(''); }}
                    className={cn('text-[10px] py-1.5 font-bold uppercase rounded-lg border', presetType === 'npc' ? 'bg-[#5a5a40] text-white border-[#5a5a40]' : 'bg-[#f5f5f0] text-[#5a5a40] border-[#e5e1d8]')}
                  >
                    NPC
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPresetType('pc'); setSelectedPreset(''); }}
                    className={cn('text-[10px] py-1.5 font-bold uppercase rounded-lg border', presetType === 'pc' ? 'bg-[#5a5a40] text-white border-[#5a5a40]' : 'bg-[#f5f5f0] text-[#5a5a40] border-[#e5e1d8]')}
                  >
                    Player
                  </button>
                </div>

                <div>
                  <label htmlFor="preset-select" className="block text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold mb-1 ml-1">Select {presetType.toUpperCase()}</label>
                  <select
                    id="preset-select"
                    value={selectedPreset}
                    onChange={e => setSelectedPreset(e.target.value)}
                    required
                    className="w-full bg-[#fdfaf5] border border-[#e5e1d8] rounded-lg px-3 py-2 text-[#2c2c26] text-sm focus:bg-white focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all"
                  >
                    <option value="">Select...</option>
                    {presetType === 'npc'
                      ? npcs.map(n => <option key={n.id} value={n.id}>{n.name}</option>)
                      : characters.filter(c => c.isActive).map(c => (
                          <option key={c.id} value={c.id}>{c.characterName} ({c.playerName})</option>
                        ))
                    }
                  </select>
                </div>

                {presetType === 'npc' && (
                  <div>
                    <label htmlFor="preset-quantity" className="block text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold mb-1 ml-1">Quantity</label>
                    <input
                      id="preset-quantity"
                      type="number"
                      value={presetQuantity}
                      onChange={e => setPresetQuantity(parseInt(e.target.value) || 1)}
                      min={1}
                      className="w-full bg-[#fdfaf5] border border-[#e5e1d8] rounded-lg px-3 py-2 text-[#2c2c26] text-sm focus:bg-white focus:border-[#c5b358] outline-none transition-all"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAddingPreset}
                  className="w-full bg-[#c5b358] hover:bg-[#b0a04f] text-[#2c2c26] font-bold text-[10px] uppercase tracking-widest py-3 rounded-full transition-colors mt-2 disabled:opacity-50 shadow-sm"
                >
                  {isAddingPreset ? 'Adding...' : '+ Add to Encounter'}
                </button>
              </form>
            </div>

            {/* Add Custom NPC Column */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2 border-b border-[#e5e1d8] pb-2">
                <Plus className="w-4 h-4 text-[#c5b358]" />
                <h3 className="text-sm font-bold text-[#2c2c26] font-serif uppercase tracking-wider">Quick NPC Creator</h3>
              </div>
              <form onSubmit={handleAddNpc} className="space-y-3 font-sans">
                <div>
                  <label className="block text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold mb-1 ml-1">Name</label>
                  <input
                    type="text"
                    value={npcName}
                    onChange={e => setNpcName(e.target.value)}
                    placeholder="e.g. Goblin Archer"
                    required
                    className="w-full bg-[#fdfaf5] border border-[#e5e1d8] rounded-lg px-3 py-2 text-[#2c2c26] text-sm focus:bg-white focus:border-[#c5b358] outline-none transition-all placeholder:text-[#5a5a40]/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="npc-hp" className="block text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold mb-1 ml-1">HP</label>
                    <input
                      id="npc-hp"
                      type="number"
                      value={npcHp}
                      onChange={e => setNpcHp(e.target.value ? parseInt(e.target.value) : '')}
                      required
                      min={1}
                      className="w-full bg-[#fdfaf5] border border-[#e5e1d8] rounded-lg px-3 py-2 text-[#2c2c26] text-sm focus:bg-white focus:border-[#c5b358] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="npc-ac" className="block text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold mb-1 ml-1">AC</label>
                    <input
                      id="npc-ac"
                      type="number"
                      value={npcAc}
                      onChange={e => setNpcAc(e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="10"
                      className="w-full bg-[#fdfaf5] border border-[#e5e1d8] rounded-lg px-3 py-2 text-[#2c2c26] text-sm focus:bg-white focus:border-[#c5b358] outline-none transition-all placeholder:text-[#5a5a40]/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold mb-1 ml-1">Characteristics</label>
                  <input
                    type="text"
                    value={npcNotes}
                    onChange={e => setNpcNotes(e.target.value)}
                    className="w-full bg-[#fdfaf5] border border-[#e5e1d8] rounded-lg px-3 py-2 text-[#2c2c26] text-sm focus:bg-white focus:border-[#c5b358] outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-3 pt-2 mt-2 border-t border-[#e5e1d8]">
                  <IrvMultiSelect
                    label="Resistances"
                    value={npcResistances}
                    onChange={setNpcResistances}
                    placeholder="e.g. fire"
                  />
                  <IrvMultiSelect
                    label="Immunities"
                    value={npcImmunities}
                    onChange={setNpcImmunities}
                    placeholder="e.g. poison"
                  />
                  <IrvMultiSelect
                    label="Vulnerabilities"
                    value={npcVulnerabilities}
                    onChange={setNpcVulnerabilities}
                    placeholder="e.g. cold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAddingNpc}
                  className="w-full bg-[#5a5a40] hover:bg-[#3f3f37] text-white font-bold text-[10px] uppercase tracking-widest py-3 rounded-full transition-colors mt-2 disabled:opacity-50 shadow-sm"
                >
                  {isAddingNpc ? 'Adding...' : '+ Add NPC'}
                </button>
              </form>
            </div>
          </div>

          {/* Setup Recharge Abilities Section */}
          <div className="pt-8 mt-8 border-t border-[#e5e1d8] space-y-4">
            <div className="flex items-center gap-2 border-b border-[#e5e1d8] pb-2">
              <Plus className="w-4 h-4 text-[#c5b358]" />
              <h3 className="text-sm font-bold text-[#2c2c26] font-serif uppercase tracking-wider">NPC Recharge Abilities Setup</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
              <div>
                <label htmlFor="tools-npc-select" className="block text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold mb-1 ml-1">Select Combatant NPC</label>
                <select
                  id="tools-npc-select"
                  value={selectedToolsNpcId}
                  onChange={e => {
                    setSelectedToolsNpcId(e.target.value);
                    setAbilityName('');
                  }}
                  className="w-full bg-[#fdfaf5] border border-[#e5e1d8] rounded-lg px-3 py-2 text-[#2c2c26] text-sm focus:bg-white focus:border-[#c5b358] outline-none transition-all"
                >
                  <option value="">Select an NPC in combat...</option>
                  {combatants.filter(c => c.type === 'npc').map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (HP: {c.currentHp}/{c.maxHp})
                    </option>
                  ))}
                </select>
              </div>

              {selectedToolsNpcId && (
                <div id="recharge-setup-details" className="space-y-4 col-span-1 sm:col-span-2 bg-[#faf9f6] p-4 rounded-xl border border-[#e5e1d8] animate-fade-in">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#5a5a40] mb-2 font-sans">
                    Add Recharge Ability to {combatants.find(n => n.id === selectedToolsNpcId)?.name}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="ability-name-input" className="block text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold mb-1 ml-1">Ability Name</label>
                      <input
                        id="ability-name-input"
                        type="text"
                        value={abilityName}
                        onChange={e => setAbilityName(e.target.value)}
                        placeholder="e.g. Fire Breath"
                        className="w-full bg-white border border-[#e5e1d8] rounded-lg px-3 py-2 text-[#2c2c26] text-sm focus:border-[#c5b358] outline-none transition-all placeholder:text-[#5a5a40]/30"
                      />
                    </div>
                    <div>
                      <label htmlFor="recharge-threshold-select" className="block text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold mb-1 ml-1">Recharge On</label>
                      <select
                        id="recharge-threshold-select"
                        value={rechargeThreshold}
                        onChange={e => setRechargeThreshold(parseInt(e.target.value))}
                        className="w-full bg-white border border-[#e5e1d8] rounded-lg px-3 py-2 text-[#2c2c26] text-sm focus:border-[#c5b358] outline-none transition-all"
                      >
                        <option value={6}>6 (recharge 6)</option>
                        <option value={5}>5 (recharge 5-6)</option>
                        <option value={4}>4 (recharge 4-6)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    id="btn-add-recharge-ability"
                    onClick={() => {
                      if (!abilityName.trim()) return;
                      const targetNpc = combatants.find(n => n.id === selectedToolsNpcId);
                      if (!targetNpc || !onUpdateCombatant) return;

                      const currentAbilities = targetNpc.rechargeAbilities || [];
                      const newAbility = {
                        name: abilityName.trim(),
                        rechargeOn: rechargeThreshold,
                        isCharged: true
                      };

                      onUpdateCombatant(selectedToolsNpcId, {
                        rechargeAbilities: [...currentAbilities, newAbility]
                      });

                      setAbilityName('');
                    }}
                    className="bg-[#5a5a40] hover:bg-[#3f3f37] text-white font-bold text-[10px] uppercase tracking-widest px-6 py-2.5 rounded-full transition-colors inline-block shadow-sm cursor-pointer"
                  >
                    Add Recharge Ability
                  </button>

                  {/* Setup Legendary Trackers Section */}
                  {(() => {
                    const targetNpc = combatants.find(n => n.id === selectedToolsNpcId);
                    if (!targetNpc) return null;
                    const isLegendaryActionsEnabled = !!targetNpc.legendaryActions;
                    const isLegendaryResistancesEnabled = !!targetNpc.legendaryResistances;

                    return (
                      <div id="legendary-setup-container" className="pt-6 mt-6 border-t border-[#e5e1d8] space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#5a5a40] mb-2">
                          Legendary Trackers
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Legendary Actions Setup */}
                          <div className="space-y-3 p-3 bg-white border border-[#e5e1d8] rounded-xl flex flex-col justify-between" id="actions-setup-card">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="checkbox-enable-actions"
                                checked={isLegendaryActionsEnabled}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    onUpdateCombatant?.(selectedToolsNpcId, {
                                      legendaryActions: {
                                        max: legendaryActionsMax,
                                        remaining: legendaryActionsMax
                                      }
                                    });
                                  } else {
                                    onUpdateCombatant?.(selectedToolsNpcId, {
                                      legendaryActions: undefined
                                    });
                                  }
                                }}
                                className="w-4 h-4 rounded border-[#e5e1d8] text-[#c5b358] focus:ring-[#c5b358] cursor-pointer"
                              />
                              <label htmlFor="checkbox-enable-actions" className="text-sm font-bold text-[#2c2c26] cursor-pointer">
                                Enable Legendary Actions
                              </label>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <label htmlFor="input-actions-max" className="text-xs text-[#5a5a40]">Actions Cap:</label>
                              <input
                                id="input-actions-max"
                                type="number"
                                min={1}
                                max={10}
                                value={legendaryActionsMax}
                                onChange={(e) => {
                                  const val = Math.max(1, parseInt(e.target.value) || 1);
                                  setLegendaryActionsMax(val);
                                  if (isLegendaryActionsEnabled) {
                                    onUpdateCombatant?.(selectedToolsNpcId, {
                                      legendaryActions: {
                                        max: val,
                                        remaining: targetNpc.legendaryActions ? Math.min(targetNpc.legendaryActions.remaining, val) : val
                                      }
                                    });
                                  }
                                }}
                                className="w-16 bg-[#fdfaf5] border border-[#e5e1d8] rounded px-2 py-1 text-[#2c2c26] text-sm focus:border-[#c5b358] outline-none"
                              />
                            </div>
                          </div>

                          {/* Legendary Resistances Setup */}
                          <div className="space-y-3 p-3 bg-white border border-[#e5e1d8] rounded-xl flex flex-col justify-between" id="resistances-setup-card">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="checkbox-enable-resistances"
                                checked={isLegendaryResistancesEnabled}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    onUpdateCombatant?.(selectedToolsNpcId, {
                                      legendaryResistances: {
                                        max: legendaryResistancesMax,
                                        remaining: legendaryResistancesMax
                                      }
                                    });
                                  } else {
                                    onUpdateCombatant?.(selectedToolsNpcId, {
                                      legendaryResistances: undefined
                                    });
                                  }
                                }}
                                className="w-4 h-4 rounded border-[#e5e1d8] text-[#c5b358] focus:ring-[#c5b358] cursor-pointer"
                              />
                              <label htmlFor="checkbox-enable-resistances" className="text-sm font-bold text-[#2c2c26] cursor-pointer">
                                Enable Legendary Resistances
                              </label>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <label htmlFor="input-resistances-max" className="text-xs text-[#5a5a40]">Resistances Cap:</label>
                              <input
                                id="input-resistances-max"
                                type="number"
                                min={1}
                                max={10}
                                value={legendaryResistancesMax}
                                onChange={(e) => {
                                  const val = Math.max(1, parseInt(e.target.value) || 1);
                                  setLegendaryResistancesMax(val);
                                  if (isLegendaryResistancesEnabled) {
                                    onUpdateCombatant?.(selectedToolsNpcId, {
                                      legendaryResistances: {
                                        max: val,
                                        remaining: targetNpc.legendaryResistances ? Math.min(targetNpc.legendaryResistances.remaining, val) : val
                                      }
                                    });
                                  }
                                }}
                                className="w-16 bg-[#fdfaf5] border border-[#e5e1d8] rounded px-2 py-1 text-[#2c2c26] text-sm focus:border-[#c5b358] outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      {/* Background click listener */}
      <div className="absolute inset-0 z-[-1]" onClick={onClose} />
    </div>
  );
}
