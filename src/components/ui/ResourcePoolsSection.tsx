import React, { useState } from 'react';
import { Plus, Minus, Trash2, Edit2, Save, X, RotateCcw } from 'lucide-react';
import { Character } from '../../types';
import { cn } from '../../lib/utils';
import { PipTracker } from './PipTracker';
import { Badge } from './Badge';
import { ConfirmationDialog } from './ConfirmationDialog';
import {
  parseResourcePools,
  serializeResourcePools,
  spendResourcePip,
  recoverResourcePip,
  addResourcePool,
  removeResourcePool,
  updateResourcePool,
  ResourcePool,
} from '../../lib/resourcePools';

export interface ResourcePoolsSectionProps {
  character: Character;
  isSyncing: boolean;
  onUpdate: (updates: Partial<Character>) => void;
}

export const ResourcePoolsSection: React.FC<ResourcePoolsSectionProps> = ({
  character,
  isSyncing,
  onUpdate,
}) => {
  const pools = parseResourcePools(character.resourcePools || '[]');

  // State for Add Pool Form
  const [newPoolName, setNewPoolName] = useState('');
  const [newPoolMax, setNewPoolMax] = useState(3);
  const [newPoolReset, setNewPoolReset] = useState<ResourcePool['reset']>('long');
  const [isAdding, setIsAdding] = useState(false);

  // State for Editing Pool Inline
  const [editingPoolName, setEditingPoolName] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editMax, setEditMax] = useState(3);
  const [editReset, setEditReset] = useState<ResourcePool['reset']>('long');
  const [pendingDeleteName, setPendingDeleteName] = useState<string | null>(null);

  // Trigger spreadsheet/state updates
  const savePools = (updatedPools: ResourcePool[]) => {
    onUpdate({ resourcePools: serializeResourcePools(updatedPools) });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newPoolName.trim();
    if (!trimmedName || newPoolMax <= 0) return;

    const updated = addResourcePool(pools, {
      name: trimmedName,
      max: newPoolMax,
      reset: newPoolReset,
    });

    savePools(updated);
    setNewPoolName('');
    setNewPoolMax(3);
    setNewPoolReset('long');
    setIsAdding(false);
  };

  const handleDelete = (name: string) => {
    setPendingDeleteName(name);
  };

  const confirmDelete = () => {
    if (!pendingDeleteName) return;
    const updated = removeResourcePool(pools, pendingDeleteName);
    savePools(updated);
    setPendingDeleteName(null);
  };

  const startEdit = (pool: ResourcePool) => {
    setEditingPoolName(pool.name);
    setEditName(pool.name);
    setEditMax(pool.max);
    setEditReset(pool.reset);
  };

  const cancelEdit = () => {
    setEditingPoolName(null);
  };

  const handleSaveEdit = (originalName: string) => {
    const trimmedName = editName.trim();
    if (!trimmedName || editMax <= 0) return;

    const updated = updateResourcePool(pools, originalName, {
      name: trimmedName,
      max: editMax,
      reset: editReset,
    });

    savePools(updated);
    setEditingPoolName(null);
  };

  const handleSpend = (name: string, current: number) => {
    if (current <= 0) return;
    const updated = spendResourcePip(pools, name, 1);
    savePools(updated);
  };

  const handleRecover = (name: string, current: number, max: number) => {
    if (current >= max) return;
    const updated = recoverResourcePip(pools, name, 1);
    savePools(updated);
  };

  const handleResetPool = (name: string, max: number) => {
    // Let's force reset by spending/recovering back to max:
    const tempUpdated = pools.map(p => {
      if (p.name.toLowerCase() === name.toLowerCase()) {
        return { ...p, current: p.max };
      }
      return p;
    });
    savePools(tempUpdated);
  };

  const getResetLabel = (reset: ResourcePool['reset']) => {
    switch (reset) {
      case 'short': return 'Short/Long Rest';
      case 'long': return 'Long Rest Only';
      case 'none': return 'Manual Reset';
      default: return 'No Reset';
    }
  };

  return (
    <div className="border border-[#e2e8f0] hover:border-[#2563eb]/30 rounded-xl bg-white p-4 space-y-3 shadow-inner font-sans">
      <div className="flex items-center justify-between border-b border-[#e2e8f0]/50 pb-2">
        <div className="text-[10px] uppercase text-[#8d8db9] font-bold tracking-widest px-1">
          Class Resource Trackers
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            disabled={isSyncing}
            className="text-xs text-[#2563eb] hover:text-[#567eff] font-bold flex items-center gap-1 transition-all"
            id={`add-resource-btn-${character.id}`}
          >
            <Plus className="w-3.5 h-3.5" /> Add Track
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-[#ffffff] border border-[#e2e8f0] rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between border-b border-[#e2e8f0]/40 pb-1">
            <span className="text-xs font-bold text-[#8d8db9]">New Resource Tracker</span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-[#8d8db9]/60 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[9px] uppercase font-bold text-[#8d8db9]/70">Name</label>
              <input
                type="text"
                placeholder="Rage, Ki, Spell Slots..."
                value={newPoolName}
                onChange={(e) => setNewPoolName(e.target.value)}
                className="w-full text-xs bg-white border border-[#e2e8f0] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] px-2 py-1.5 rounded outline-none"
                required
                id={`new-resource-name-${character.id}`}
              />
            </div>
            <div>
              <label className="text-[9px] uppercase font-bold text-[#8d8db9]/70">Max Uses</label>
              <input
                type="number"
                min={1}
                value={newPoolMax}
                onChange={(e) => setNewPoolMax(parseInt(e.target.value, 10) || 1)}
                className="w-full text-xs bg-white border border-[#e2e8f0] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] px-2 py-1.5 rounded outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[9px] uppercase font-bold text-[#8d8db9]/70">Resets On</label>
              <select
                value={newPoolReset}
                onChange={(e) => setNewPoolReset(e.target.value as ResourcePool['reset'])}
                className="w-full text-xs bg-white border border-[#e2e8f0] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] px-2 py-1.5 rounded outline-none"
              >
                <option value="short">Short & Long Rest</option>
                <option value="long">Long Rest Only</option>
                <option value="none">Manual Only</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-1.5 bg-[#2563eb] hover:bg-[#567eff] text-xs font-bold text-white uppercase rounded transition-all"
            id={`save-new-resource-${character.id}`}
          >
            Create Tracker
          </button>
        </form>
      )}

      {pools.length === 0 ? (
        <p className="text-xs text-[#8d8db9]/60 italic px-1">
          No class resource trackers active. Set up rage counters, ki pips, grit, or spell slots above.
        </p>
      ) : (
        <div className="space-y-4">
          {pools.map((pool) => {
            const isEditing = editingPoolName === pool.name;

            return (
              <div
                key={pool.name}
                className="border-b border-gray-100 last:border-0 pb-3 last:pb-0"
                id={`resource-pool-${pool.name.replace(/\s+/g, '-').toLowerCase()}`}
              >
                {isEditing ? (
                  <div className="bg-[#ffffff] border border-dashed border-[#e2e8f0] p-3 rounded-lg space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[9px] uppercase font-bold text-[#8d8db9]/70">Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full text-xs bg-white border border-[#e2e8f0] focus:border-[#2563eb] px-2 py-1 rounded outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-[#8d8db9]/70">Max Uses</label>
                        <input
                          type="number"
                          min={1}
                          value={editMax}
                          onChange={(e) => setEditMax(parseInt(e.target.value, 10) || 1)}
                          className="w-full text-xs bg-white border border-[#e2e8f0] focus:border-[#2563eb] px-2 py-1 rounded outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-[#8d8db9]/70">Resets On</label>
                        <select
                          value={editReset}
                          onChange={(e) => setEditReset(e.target.value as ResourcePool['reset'])}
                          className="w-full text-xs bg-white border border-[#e2e8f0] focus:border-[#2563eb] px-2 py-1 rounded outline-none"
                        >
                          <option value="short">Short & Long Rest</option>
                          <option value="long">Long Rest Only</option>
                          <option value="none">Manual Only</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 text-xs">
                      <button
                        onClick={cancelEdit}
                        className="px-2.5 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(pool.name)}
                        className="px-2.5 py-1 bg-[#2563eb] hover:bg-[#567eff] text-white rounded font-bold"
                        id={`save-edit-resource-${pool.name.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Header line */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-[#20201a] text-sm font-serif block">
                          {pool.name}
                        </span>
                        <Badge
                          color={pool.reset === 'short' ? 'blue' : pool.reset === 'long' ? 'purple' : 'gray'}
                          size="compact"
                        >
                          Reset: {getResetLabel(pool.reset)}
                        </Badge>
                      </div>

                      {/* Tool Actions */}
                      <div className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleResetPool(pool.name, pool.max)}
                          title="Reset Tracker to Max"
                          className="p-1 hover:bg-[#f1ecd8]/60 hover:text-[#2563eb] rounded transition-all"
                          id={`reset-resource-${pool.name.replace(/\s+/g, '-').toLowerCase()}`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => startEdit(pool)}
                          title="Edit Tracker"
                          className="p-1 hover:bg-[#f1ecd8]/60 hover:text-blue-600 rounded transition-all"
                          id={`edit-resource-${pool.name.replace(/\s+/g, '-').toLowerCase()}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(pool.name)}
                          title="Remove Tracker"
                          className="p-1 hover:bg-red-50 hover:text-red-600 rounded transition-all"
                          id={`delete-resource-${pool.name.replace(/\s+/g, '-').toLowerCase()}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Tracker control */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSpend(pool.name, pool.current)}
                          disabled={pool.current <= 0 || isSyncing}
                          className="p-1 border border-[#e2e8f0] rounded hover:bg-red-50 disabled:opacity-30 cursor-pointer"
                          id={`spend-resource-${pool.name.replace(/\s+/g, '-').toLowerCase()}`}
                          title="Spend 1 Use"
                        >
                          <Minus className="w-3 h-3 text-red-600" />
                        </button>
                        <span className="font-mono font-bold text-xs px-2 text-[#0f172a]">
                          {pool.current} / {pool.max}
                        </span>
                        <button
                          onClick={() => handleRecover(pool.name, pool.current, pool.max)}
                          disabled={pool.current >= pool.max || isSyncing}
                          className="p-1 border border-[#e2e8f0] rounded hover:bg-green-50 disabled:opacity-30 cursor-pointer"
                          id={`recover-resource-${pool.name.replace(/\s+/g, '-').toLowerCase()}`}
                          title="Recover 1 Use"
                        >
                          <Plus className="w-3 h-3 text-green-700" />
                        </button>
                      </div>

                      {/* Dot Pips Visual list */}
                      <PipTracker
                        max={pool.max}
                        remaining={pool.current}
                        onChange={(newValue) => {
                          if (newValue > pool.current) {
                            savePools(recoverResourcePip(pools, pool.name, newValue - pool.current));
                          } else {
                            savePools(spendResourcePip(pools, pool.name, pool.current - newValue));
                          }
                        }}
                        color="blue"
                        size="default"
                        label={pool.name}
                        className="max-w-[50%] flex-wrap"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <ConfirmationDialog
        isOpen={pendingDeleteName !== null}
        title="Remove Resource Pool?"
        description={pendingDeleteName ? `Remove the "${pendingDeleteName}" resource pool?` : ''}
        confirmLabel="Remove"
        onConfirm={confirmDelete}
        onClose={() => setPendingDeleteName(null)}
      />
    </div>
  );
};
