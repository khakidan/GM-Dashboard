import React, { useState, useMemo, useEffect } from 'react';
import { useAppState } from '../hooks/useAppState';
import { useNpcLibrary } from './NpcLibraryTab/hooks/useNpcLibrary';
import { BookOpen, AlertCircle, Plus, Search, Filter, X, Shield, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { NewNpcDialog } from './NpcLibraryTab/NewNpcDialog';
import { NpcCard } from './NpcLibraryTab/NpcCard';
import { checkIrvMatch } from '../lib/combatLogic';
import { DAMAGE_TYPE_OPTIONS, CONDITION_OPTIONS } from '../lib/irvOptions';

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
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#e5e1d8] shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#2c2c26] font-serif">NPC Library</h2>
          <p className="text-sm text-[#5a5a40] mt-1 font-sans">
            Reference NPCs loaded from your campaign sheets. Directly inspect stats and health status.
          </p>
        </div>
        <button
          onClick={() => setIsNewNpcDialogOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#c5b358] hover:bg-[#b0a04f] text-[#2c2c26] px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c5b358] shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add New NPC
        </button>
      </div>

      {globalError && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{globalError}</p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-2xl border border-[#e5e1d8] shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#2c2c26]">
            <Filter className="w-4 h-4 text-[#c5b358]" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Search & Filter</h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#fdfaf5]/50 border border-[#e5e1d8] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all"
            />
          </div>
          {renderFilterSelect(<Shield className="w-4 h-4 text-blue-400 opacity-50" />, 'Resistance', filterResistances, setFilterResistances)}
          {renderFilterSelect(<Shield className="w-4 h-4 text-green-400 opacity-50" />, 'Immunity', filterImmunities, setFilterImmunities)}
          {renderFilterSelect(<Shield className="w-4 h-4 text-red-400 opacity-50" />, 'Vulnerability', filterVulnerabilities, setFilterVulnerabilities)}
          
          <div className="relative">
            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 opacity-50" />
            <input
              type="text"
              placeholder="Conditions..."
              value={filterConditions}
              onChange={e => setFilterConditions(e.target.value)}
              className="w-full bg-[#fdfaf5]/50 border border-[#e5e1d8] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358] outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* NPC List */}
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
  );
}
