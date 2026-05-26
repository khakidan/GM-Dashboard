import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Combatant, NPC as Npc, Character } from '../../types';

interface CombatSidebarProps {
  isSidebarOpen: boolean;
  npcs: Npc[];
  characters: Character[];
  combatants: Combatant[];
  activeTurnId: string | null;
  onAddPreset: (type: 'pc' | 'npc', presetId: string, quantity: number) => Promise<void>;
  onAddNpc: (name: string, hp: number | '', ac: number | '', notes: string) => Promise<void>;
  onCustomAction: (actionTargetId: string, actionType: 'poison' | 'haste') => void;
}

export function CombatSidebar({
  isSidebarOpen,
  npcs,
  characters,
  combatants,
  activeTurnId,
  onAddPreset,
  onAddNpc,
  onCustomAction
}: CombatSidebarProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [presetType, setPresetType] = useState<'pc' | 'npc'>('npc');
  const [presetQuantity, setPresetQuantity] = useState<number>(1);
  const [isAddingPreset, setIsAddingPreset] = useState(false);

  const [npcName, setNpcName] = useState('');
  const [npcHp, setNpcHp] = useState<number | ''>('');
  const [npcAc, setNpcAc] = useState<number | ''>('');
  const [npcNotes, setNpcNotes] = useState('');
  const [isAddingNpc, setIsAddingNpc] = useState(false);

  const [customActionTargetId, setCustomActionTargetId] = useState<string>('');

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
    await onAddNpc(npcName, npcHp, npcAc, npcNotes);
    setIsAddingNpc(false);
    setNpcName('');
    setNpcHp('');
    setNpcAc('');
    setNpcNotes('');
  };

  return (
    <div className={cn(
      'space-y-6 transition-all duration-300 overflow-hidden w-full',
      isSidebarOpen ? 'xl:w-[384px] opacity-100' : 'xl:w-0 opacity-0 h-0 hidden xl:flex'
    )}>
      <div className="bg-white rounded-2xl border border-[#e5e1d8] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-[#2c2c26] font-serif">Add from Library</h2>
        </div>
        <form onSubmit={handleAddPreset} className="space-y-4 font-sans">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              type="button"
              onClick={() => { setPresetType('npc'); setSelectedPreset(''); }}
              className={cn('text-xs py-2 font-bold uppercase rounded-lg border', presetType === 'npc' ? 'bg-[#5a5a40] text-white border-[#5a5a40]' : 'bg-[#f5f5f0] text-[#5a5a40] border-[#e5e1d8]')}
            >
              NPC
            </button>
            <button
              type="button"
              onClick={() => { setPresetType('pc'); setSelectedPreset(''); }}
              className={cn('text-xs py-2 font-bold uppercase rounded-lg border', presetType === 'pc' ? 'bg-[#5a5a40] text-white border-[#5a5a40]' : 'bg-[#f5f5f0] text-[#5a5a40] border-[#e5e1d8]')}
            >
              Player
            </button>
          </div>

          <div>
            <label className="block text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold mb-1">Select {presetType.toUpperCase()}</label>
            <select
              value={selectedPreset}
              onChange={e => setSelectedPreset(e.target.value)}
              required
              className="w-full bg-[#fdfaf5] border border-transparent rounded-md px-3 py-2 text-[#2c2c26] text-sm focus:bg-white focus:border-[#e5e1d8] focus:ring-2 focus:ring-[#e5e1d8] outline-none transition-all"
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
              <label className="block text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold mb-1">Quantity</label>
              <input
                type="number"
                value={presetQuantity}
                onChange={e => setPresetQuantity(parseInt(e.target.value) || 1)}
                min={1}
                className="w-full bg-[#fdfaf5] border border-transparent rounded-md px-3 py-2 text-[#2c2c26] text-sm focus:bg-white focus:border-[#e5e1d8] focus:ring-2 focus:ring-[#e5e1d8] outline-none transition-all"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isAddingPreset}
            className="w-full bg-[#c5b358] hover:bg-[#b0a04f] text-[#2c2c26] font-bold text-[10px] uppercase tracking-widest py-3 rounded-full transition-colors mt-2 disabled:opacity-50"
          >
            {isAddingPreset ? 'Adding...' : '+ Add to Encounter'}
          </button>
        </form>
      </div>

      {/* Add Custom NPC Form */}
      <div className="bg-white rounded-2xl border border-[#e5e1d8] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-[#2c2c26] font-serif">Add New NPC Combatant</h2>
        </div>
        <form onSubmit={handleAddNpc} className="space-y-4 font-sans">
          <div>
            <label className="block text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold mb-1">Name</label>
            <input
              type="text"
              value={npcName}
              onChange={e => setNpcName(e.target.value)}
              placeholder="e.g. Goblin Archer"
              required
              className="w-full bg-[#fdfaf5] border border-transparent rounded-md px-3 py-2 text-[#2c2c26] text-sm focus:bg-white focus:border-[#e5e1d8] focus:ring-2 focus:ring-[#e5e1d8] outline-none transition-all placeholder:text-[#5a5a40]/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold mb-1">HP</label>
              <input
                type="number"
                value={npcHp}
                onChange={e => setNpcHp(e.target.value ? parseInt(e.target.value) : '')}
                required
                min={1}
                className="w-full bg-[#fdfaf5] border border-transparent rounded-md px-3 py-2 text-[#2c2c26] text-sm focus:bg-white focus:border-[#e5e1d8] focus:ring-2 focus:ring-[#e5e1d8] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold mb-1">AC</label>
              <input
                type="number"
                value={npcAc}
                onChange={e => setNpcAc(e.target.value ? parseInt(e.target.value) : '')}
                placeholder="10"
                className="w-full bg-[#fdfaf5] border border-transparent rounded-md px-3 py-2 text-[#2c2c26] text-sm focus:bg-white focus:border-[#e5e1d8] focus:ring-2 focus:ring-[#e5e1d8] outline-none transition-all placeholder:text-[#5a5a40]/40"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold mb-1">Special Characteristics</label>
            <input
              type="text"
              value={npcNotes}
              onChange={e => setNpcNotes(e.target.value)}
              className="w-full bg-[#fdfaf5] border border-transparent rounded-md px-3 py-2 text-[#2c2c26] text-sm focus:bg-white focus:border-[#e5e1d8] focus:ring-2 focus:ring-[#e5e1d8] outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isAddingNpc}
            className="w-full bg-[#5a5a40] hover:bg-[#3f3f37] text-white font-bold text-[10px] uppercase tracking-widest py-3 rounded-full transition-colors mt-2 disabled:opacity-50"
          >
            {isAddingNpc ? 'Adding...' : '+ Add to Combat'}
          </button>
        </form>
      </div>

      {/* Custom Actions Form */}
      <div className="bg-white rounded-2xl border border-[#e5e1d8] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-[#2c2c26] font-serif">Custom Actions</h2>
        </div>
        <div className="space-y-4 font-sans">
          <div>
            <label className="block text-[10px] text-[#5a5a40] uppercase tracking-wider font-bold mb-1">Target Combatant</label>
            <select
              value={customActionTargetId}
              onChange={e => setCustomActionTargetId(e.target.value)}
              className="w-full bg-[#fdfaf5] border border-transparent rounded-md px-3 py-2 text-[#2c2c26] text-sm focus:bg-white focus:border-[#e5e1d8] focus:ring-2 focus:ring-[#e5e1d8] outline-none transition-all"
            >
              <option value="">Select Target...</option>
              <option value="ALL">All Combatants</option>
              <option value="ACTIVE">Active Turn</option>
              <optgroup label="Combatants">
                {combatants.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onCustomAction(customActionTargetId, 'poison')}
              className="w-full bg-red-100 hover:bg-red-200 text-red-800 border border-red-200 font-bold text-[10px] uppercase tracking-widest py-2 rounded-lg transition-colors"
            >
              Poison (-2 HP)
            </button>
            <button
              onClick={() => onCustomAction(customActionTargetId, 'haste')}
              className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200 font-bold text-[10px] uppercase tracking-widest py-2 rounded-lg transition-colors"
            >
              Grant Haste
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
