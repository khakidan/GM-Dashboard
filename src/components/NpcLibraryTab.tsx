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
  };

  const filteredNpcs = useMemo(() => {
    return state.npcs.filter(npc => {
      const matchesSearch = !searchQuery || npc.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRes = !filterResistances || checkIrvMatch(filterResistances, npc.resistances);
      const matchesImm = !filterImmunities || checkIrvMatch(filterImmunities, npc.immunities);
      const matchesVul = !filterVulnerabilities || checkIrvMatch(filterVulnerabilities, npc.vulnerabilities);
      return matchesSearch && matchesRes && matchesImm && matchesVul;
    });
  }, [state.npcs, searchQuery, filterResistances, filterImmunities, filterVulnerabilities]);

  const hasActiveFilters = Boolean(
    searchQuery || filterResistances || filterImmunities || filterVulnerabilities
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
        className="w-full bg-[#ffffff]/50 border border-[#e2e8f0] rounded-xl pl-9 pr-3 py-2.5 text-sm focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all appearance-auto cursor-pointer text-[#0f172a]"
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
    <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] overflow-hidden flex-1 flex flex-col w-full">
      {/* Page Header */}
      <div className="bg-[#ffffff] border-b border-[#e2e8f0] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">NPC Library</h1>
            <p className="text-sm text-[#8d8db9] mt-0.5">Reference NPCs loaded from your campaign sheets. Directly inspect stats and health status.</p>
          </div>

          <button
            onClick={() => setIsNewNpcDialogOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#2563eb] hover:bg-[#567eff] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-lg flex-shrink-0"
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
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8d8db9]/60" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#e2e8f0] rounded-xl pl-9 pr-4 py-2.5 text-sm focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/50 outline-none transition-all placeholder:text-[#8d8db9]/30"
                id="npc-search-input"
              />
            </div>
            
            <div className="grid grid-cols-2 md:flex gap-3 flex-wrap">
              {renderFilterSelect(<Shield className="w-4 h-4 text-blue-500/60" />, "Resist", filterResistances, setFilterResistances)}
              {renderFilterSelect(<Shield className="w-4 h-4 text-green-600/60" />, "Immune", filterImmunities, setFilterImmunities)}
              {renderFilterSelect(<Shield className="w-4 h-4 text-red-500/60" />, "Vulnerable", filterVulnerabilities, setFilterVulnerabilities)}
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-[#8d8db9] hover:text-[#0f172a] text-xs font-bold uppercase tracking-widest transition-colors"
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
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BookOpen className="w-12 h-12 text-[#8d8db9] opacity-20 mb-4" />
              <h3 className="text-lg font-serif font-bold text-[#0f172a] mb-2">
                No NPCs in library
              </h3>
              <p className="text-sm text-[#8d8db9] mb-6 max-w-xs">
                Add NPCs to build your library. They will be available to add to any encounter.
              </p>
              <button
                onClick={() => setIsNewNpcDialogOpen(true)}
                className="bg-[#2563eb] hover:bg-[#567eff] text-white font-bold font-sans uppercase tracking-widest text-xs px-6 py-3 rounded-xl transition-all shadow-md active:scale-95"
              >
                Add New NPC
              </button>
            </div>
          ) : (
          <div className="flex flex-col gap-4">
            {filteredNpcs.map(npc => (
              <NpcCard
                key={npc.id}
                npc={npc}
                isSyncing={syncingId === npc.id}
                isExpanded={expandedIds.has(npc.id)}
                onToggleExpand={() => toggleExpand(npc.id)}
                onUpdate={(updates) => handleUpdateNpc(npc.id, updates)}
                onDelete={() => handleDeleteNpc(npc.id)}
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
