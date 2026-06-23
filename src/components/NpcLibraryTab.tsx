import { DAMAGE_TYPE_OPTIONS, CONDITION_OPTIONS } from '../lib/conditions';
import React, { useState, useMemo, useEffect } from 'react';
import { useAppState } from '../hooks/useAppState';
import { useNpcLibrary } from './NpcLibraryTab/hooks/useNpcLibrary';
import { BookOpen, AlertCircle, Plus, Search, Filter, X, Shield, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { NewNpcDialog } from './NpcLibraryTab/NewNpcDialog';
import { NpcCard } from './NpcLibraryTab/NpcCard';
import { checkIrvMatch } from '../lib/combatLogic';
;

export function NpcLibraryTab() {
  const { state: appState, updateState } = useAppState();
  const {
    state,
    syncingId,
    globalError,
    handleResetNpcHp,
    handleAddNpc,
    handleUpdateNpc,
    handleDeleteNpc,
  } = useNpcLibrary();

  const [isNewNpcDialogOpen, setIsNewNpcDialogOpen] = useState(false);

  useEffect(() => {
    if (appState.openDialog === 'newNpc') {
      setIsNewNpcDialogOpen(true);
      updateState(prev => ({ ...prev, openDialog: null }));
    }
  }, [appState.openDialog, updateState]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResistances, setFilterResistances] = useState('');
  const [filterImmunities, setFilterImmunities] = useState('');
  const [filterVulnerabilities, setFilterVulnerabilities] = useState('');
  const [filterConditions, setFilterConditions] = useState('');

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterResistances('');
    setFilterImmunities('');
    setFilterVulnerabilities('');
    setFilterConditions('');
  };

  const filteredNpcs = useMemo(() => {
    return state.npcs.filter(npc => {
      const matchesSearch = !searchQuery || npc.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRes = !filterResistances || checkIrvMatch(filterResistances, npc.resistances);
      const matchesImm = !filterImmunities || checkIrvMatch(filterImmunities, npc.immunities);
      const matchesVul = !filterVulnerabilities || checkIrvMatch(filterVulnerabilities, npc.vulnerabilities);
      const matchesCond = !filterConditions || (npc.conditions?.toLowerCase() || '').includes(filterConditions.toLowerCase());
      return matchesSearch && matchesRes && matchesImm && matchesVul && matchesCond;
    });
  }, [state.npcs, searchQuery, filterResistances, filterImmunities, filterVulnerabilities, filterConditions]);

  const hasActiveFilters = Boolean(
    searchQuery || filterResistances || filterImmunities || filterVulnerabilities || filterConditions
  );

  const renderFilterSelect = (icon: React.ReactNode, placeholder: string, value: string, setter: (v: string) => void) => (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
        {icon}
      </div>
      <select
        aria-label={placeholder}
        value={value}
        onChange={e => setter(e.target.value)}
        className="w-full bg-[#fdfaf5]/50 border border-[#e5e1d8] rounded-xl pl-9 pr-3 py-2.5 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all appearance-auto cursor-pointer text-[#2c2c26]"
      >
        <option value="">{placeholder}: All</option>
        <optgroup label="Damage Types">
          {DAMAGE_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </optgroup>
        <optgroup label="Conditions">
          {CONDITION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </optgroup>
      </select>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#e5e1d8] overflow-hidden flex-1 flex flex-col w-full">
      {/* Page Header */}
      <div className="bg-[#fdfaf5] border-b border-[#e5e1d8] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2c2c26]">NPC Library</h1>
            <p className="text-sm text-[#5a5a40] mt-0.5">Reference NPCs loaded from your campaign sheets. Directly inspect stats and health status.</p>
          </div>

          <button
            onClick={() => setIsNewNpcDialogOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#c5b358] hover:bg-[#d4c47a] text-[#2c2c26] text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-lg flex-shrink-0"
            id="add-npc-btn"
          >
            <Plus className="w-4 h-4" />
            New NPC
          </button>
        </div>

        {/* Filter Controls Area */}
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a40]/60" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#e5e1d8] rounded-xl pl-9 pr-4 py-2.5 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358]/50 outline-none transition-all placeholder:text-[#5a5a40]/30"
                id="npc-search-input"
              />
            </div>
            
            <div className="grid grid-cols-2 md:flex gap-3 flex-wrap">
              {renderFilterSelect(<Shield className="w-4 h-4 text-blue-500/60" />, "Resist", filterResistances, setFilterResistances)}
              {renderFilterSelect(<Shield className="w-4 h-4 text-green-600/60" />, "Immune", filterImmunities, setFilterImmunities)}
              {renderFilterSelect(<Shield className="w-4 h-4 text-red-500/60" />, "Vulnerable", filterVulnerabilities, setFilterVulnerabilities)}
              {renderFilterSelect(<Activity className="w-4 h-4 text-purple-600/60" />, "Trait", filterConditions, setFilterConditions)}
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-[#5a5a40] hover:text-[#2c2c26] text-xs font-bold uppercase tracking-widest transition-colors"
                id="clear-filters-btn"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white w-full p-6 overflow-y-auto">
        {globalError && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-800 text-sm mb-6 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{globalError}</p>
          </div>
        )}

        <div className="space-y-4">
          {filteredNpcs.length === 0 ? (
          <div className="bg-white py-12 text-center text-[#5a5a40] italic flex flex-col items-center justify-center border border-dashed border-[#e5e1d8] rounded-2xl bg-gray-50/50">
            <BookOpen className="w-10 h-10 text-gray-300 mb-2" />
            {state.npcs.length === 0 ? (
              <span>No NPCs loaded in library. Click "Add New NPC" to begin.</span>
            ) : (
              <span>No NPCs match your filters.</span>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredNpcs.map(npc => (
              <NpcCard
                key={npc.id}
                npc={npc}
                isSyncing={syncingId === npc.id}
                isExpanded={expandedIds.has(npc.id)}
                onToggleExpand={() => toggleExpand(npc.id)}
                onUpdate={(updates) => handleUpdateNpc(npc.id, updates)}
                onDelete={() => handleDeleteNpc(npc.id)}
                onResetHp={() => handleResetNpcHp(npc.id, npc.maxHp)}
              />
            ))}
          </div>
        )}
      </div>

      <NewNpcDialog 
        isOpen={isNewNpcDialogOpen}
        onClose={() => setIsNewNpcDialogOpen(false)}
        onConfirm={(data) => {
          handleAddNpc(data);
          setIsNewNpcDialogOpen(false);
        }}
      />
      </div>
    </div>
  );
}
