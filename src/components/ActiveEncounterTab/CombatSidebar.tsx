import { RECHARGE_THRESHOLDS } from '../../lib/constants';
import React, { useState, useEffect } from 'react';
import { X, Library, Plus, Users, UserPlus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { NPC as Npc, Character, Combatant } from '../../types';
import { NpcFormFields, NpcFormData, DEFAULT_NPC_FORM_DATA } from '../ui/NpcFormFields';

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
    vulnerabilities: string,
    legendaryActions: number,
    legendaryResistances: number,
    rechargeAbilities: Array<{ name: string, rechargeOn: number }>
  ) => Promise<void>;
  combatants?: Combatant[];
}

export function CombatSidebar({
  isOpen,
  onClose,
  npcs,
  characters,
  onAddPreset,
  onAddNpc,
  combatants = []
}: CombatSidebarProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'party' | 'create'>('library');
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [presetQuantity, setPresetQuantity] = useState<number>(1);
  const [isAddingInLibrary, setIsAddingInLibrary] = useState(false);
  const [createNpcData, setCreateNpcData] = useState<NpcFormData>(DEFAULT_NPC_FORM_DATA);
  const [isCreatingNpc, setIsCreatingNpc] = useState(false);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<Set<string>>(new Set());
  const [npcSearch, setNpcSearch] = useState('');

  // Reset npcSearch when closing or switching tabs
  useEffect(() => {
    if (!isOpen) {
      setNpcSearch('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeTab !== 'library') {
      setNpcSearch('');
    }
  }, [activeTab]);

  const filteredNpcs = npcs.filter(npc =>
    npc.name.toLowerCase().includes(npcSearch.toLowerCase())
  );

  const handleClose = () => {
    setNpcSearch('');
    onClose();
  };

  const inEncounterIds = new Set(
    combatants
      .map(c => c.characterId)
      .filter((id): id is string => !!id)
  );

  const isInEncounter = (characterId: string) => inEncounterIds.has(characterId);

  const toggleCharacterSelection = (characterId: string) => {
    if (isInEncounter(characterId)) return;
    const next = new Set(selectedCharacterIds);
    if (next.has(characterId)) {
      next.delete(characterId);
    } else {
      next.add(characterId);
    }
    setSelectedCharacterIds(next);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
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

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createNpcData.name.trim() === '') return;
    setIsCreatingNpc(true);
    await onAddNpc(
      createNpcData.name,
      Number(createNpcData.maxHp),
      Number(createNpcData.ac),
      createNpcData.notes,
      createNpcData.resistances,
      createNpcData.immunities,
      createNpcData.vulnerabilities,
      createNpcData.legendaryActions,
      createNpcData.legendaryResistances,
      createNpcData.rechargeAbilities
    );
    setIsCreatingNpc(false);
    setCreateNpcData(DEFAULT_NPC_FORM_DATA);
    handleClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div 
        className="bg-[#fdfaf5] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#e5e1d8] overflow-hidden flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-[#2c2c26] p-6 text-[#e5e1d8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-[#c5b358]" />
            <h2 className="text-xl font-bold font-serif uppercase tracking-wider">Add Combatant</h2>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-[#e5e1d8] shrink-0">
          {(['library', 'party', 'create'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn("flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all", activeTab === tab ? "bg-white text-[#2c2c26]" : "bg-[#f5f0d5] text-[#5a5a40]")}
            >
              {tab === 'library' ? 'NPC Library' : tab === 'party' ? 'Party Members' : 'Create NPC'}
            </button>
          ))}
        </div>

        <div className="p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-[#e5e1d8] flex-1">
          {activeTab === 'library' && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Search NPCs..."
                value={npcSearch}
                onChange={e => setNpcSearch(e.target.value)}
                className="w-full bg-white border border-[#e5e1d8] rounded-xl px-4 py-3 text-sm"
              />
              <div className="border border-[#e5e1d8] rounded-xl h-64 overflow-y-auto">
                {filteredNpcs.length === 0 ? (
                  <div className="text-center py-12 text-sm text-[#5a5a40]">
                    {npcSearch ? `No NPCs match '${npcSearch}'` : 'NPC Library is empty.'}
                  </div>
                ) : (
                  filteredNpcs.map(npc => (
                    <button
                      key={npc.id}
                      onClick={() => setSelectedPreset(npc.id)}
                      className={cn("w-full text-left p-4 border-b border-[#e5e1d8] hover:bg-[#faf9f6]", selectedPreset === npc.id && "bg-[#f5f0d5] border-[#c5b358]")}
                    >
                      <div className="font-bold">{npc.name}</div>
                      <div className="text-xs text-[#5a5a40]">AC: {npc.ac}  HP: {npc.maxHp}</div>
                    </button>
                  ))
                )}
              </div>
              <div className="flex items-center gap-4">
                  <label htmlFor="npc-quantity">How many?</label>
                  <input id="npc-quantity" type="number" value={presetQuantity} onChange={e => setPresetQuantity(parseInt(e.target.value) || 1)} min="1" max="20" className="w-16 p-2 border border-[#e5e1d8] rounded-lg" />
              </div>
              <button
                disabled={!selectedPreset || isAddingInLibrary}
                onClick={async () => {
                  setIsAddingInLibrary(true);
                  await onAddPreset('npc', selectedPreset, presetQuantity);
                  setIsAddingInLibrary(false);
                  handleClose();
                }}
                className="w-full bg-[#c5b358] text-[#2c2c26] py-3 rounded-xl font-bold uppercase"
              >
                Add to Encounter
              </button>
            </div>
          )}
          {activeTab === 'party' && (
            <div className="space-y-4">
              {characters.filter(c => c.statusId === 1 || c.statusName === 'Active').length === 0 ? (
                <div className="text-sm text-[#5a5a40] py-8 text-center">No active party members. Add players in the Party Roster tab.</div>
              ) : characters.filter(c => c.statusId === 1 || c.statusName === 'Active').every(c => isInEncounter(c.id)) ? (
                <div className="text-sm text-[#5a5a40] py-8 text-center">All party members are already in this encounter.</div>
              ) : (
                <div className="space-y-2">
                  {characters.filter(c => c.statusId === 1 || c.statusName === 'Active').map(char => {
                    const alreadyIn = isInEncounter(char.id);
                    return (
                      <div key={char.id} className={cn("flex items-center gap-3 p-3 rounded-xl border border-[#e5e1d8]", alreadyIn ? "opacity-50 bg-[#f5f5f0]" : "bg-white")}>
                        <input
                          type="checkbox"
                          checked={selectedCharacterIds.has(char.id)}
                          onChange={() => toggleCharacterSelection(char.id)}
                          disabled={alreadyIn}
                        />
                        <div className="flex-1">
                          <div className="font-bold">{char.characterName}</div>
                          <div className="text-xs text-[#5a5a40]">Player: {char.playerName} AC: {char.ac} HP: {char.currentHp}/{char.maxHp}</div>
                        </div>
                        {alreadyIn && <div className="text-[10px] font-bold text-[#5a5a40] uppercase">Already in encounter</div>}
                      </div>
                    );
                  })}
                  <button
                    disabled={selectedCharacterIds.size === 0}
                    onClick={async () => {
                      for (const id of selectedCharacterIds) {
                        await onAddPreset('pc', id, 1);
                      }
                      setSelectedCharacterIds(new Set());
                      handleClose();
                    }}
                    className="w-full bg-[#c5b358] text-[#2c2c26] py-3 rounded-xl font-bold uppercase disabled:opacity-50"
                  >
                    Add Selected
                  </button>
                </div>
              )}
            </div>
          )}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateAndAdd} className="space-y-6">
              <NpcFormFields data={createNpcData} onChange={setCreateNpcData} compact />
              <button
                type="submit"
                disabled={isCreatingNpc}
                className="w-full bg-[#c5b358] text-[#2c2c26] py-3 rounded-xl font-bold uppercase"
              >
                {isCreatingNpc ? 'Creating...' : 'Create & Add to Encounter'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
