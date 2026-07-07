import React, { useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { IconButton } from './IconButton';
import {
  ResourcePool,
  addResourcePool,
  removeResourcePool,
  updateResourcePool
} from '../../lib/resourcePools';
import { CLASS_RESOURCE_SUGGESTIONS } from '../../lib/classResources';

interface ResourcePoolManagerProps {
  pools: ResourcePool[];
  onChange: (pools: ResourcePool[]) => void;
  characterClass: string;
  onCustomized?: () => void;
}

export function ResourcePoolManager({
  pools,
  onChange,
  characterClass,
  onCustomized,
}: ResourcePoolManagerProps) {
  // Tab 4 local state
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [newResourceName, setNewResourceName] = useState('');
  const [newResourceMax, setNewResourceMax] = useState(3);
  const [newResourceReset, setNewResourceReset] = useState<'short' | 'long' | 'none'>('long');

  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [editResourceName, setEditResourceName] = useState('');
  const [editResourceMax, setEditResourceMax] = useState(3);
  const [editResourceReset, setEditResourceReset] = useState<'short' | 'long' | 'none'>('long');

  const markCustomized = () => {
    if (onCustomized) {
      onCustomized();
    }
  };

  const handleAddResource = () => {
    const trimmed = newResourceName.trim();
    if (!trimmed) return;
    markCustomized();
    onChange(addResourcePool(pools, {
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
    markCustomized();
    const items = pools.map(p => {
      if (p.name === name) {
        return { ...p, current: Math.max(0, Math.min(p.max, p.current + delta)) };
      }
      return p;
    });
    onChange(items);
  };

  const handleDeleteResource = (name: string) => {
    markCustomized();
    onChange(removeResourcePool(pools, name));
  };
  
  const startEditResource = (pool: ResourcePool) => {
    setEditingResourceId(pool.name);
    setEditResourceName(pool.name);
    setEditResourceMax(pool.max);
    setEditResourceReset(pool.reset);
  };

  const handleSaveEditResource = (originalName: string) => {
    markCustomized();
    onChange(updateResourcePool(pools, originalName, {
      name: editResourceName.trim() || originalName,
      max: editResourceMax,
      reset: editResourceReset
    }));
    setEditingResourceId(null);
  };

  return (
    <div className="space-y-4">
      {characterClass && (CLASS_RESOURCE_SUGGESTIONS[characterClass]?.length ?? 0) > 0 ? (
        <p className="text-xs text-stone-500 italic mb-3">
          Suggested pools for {characterClass}. Adjust max values to match your character.
        </p>
      ) : (pools.length === 0 && !isAddingResource) ? (
        <p className="text-xs text-stone-500 italic mb-3">
          No class entered. Add resource pools manually below.
        </p>
      ) : null}

      <div className="space-y-2">
        {pools.map(pool => {
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
                        onChange={e => setEditResourceReset(e.target.value as 'short' | 'long' | 'none')}
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
                    <button type="button" onClick={() => handleSaveEditResource(pool.name)} className="px-3 py-1.5 bg-[#2563eb] text-white hover:bg-[#567eff] font-medium rounded-xl transition-colors">Save</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="font-bold text-stone-800">{pool.name}</div>
                    <div className={cn(
                      "text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full",
                      pool.reset === 'short' ? "bg-amber-100 text-[#567eff] font-medium" :
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
                      <IconButton
                        icon={<Edit2 className="w-3.5 h-3.5" />}
                        onClick={() => startEditResource(pool)}
                        aria-label="Edit"
                        title="Edit"
                        className="hover:text-[#2563eb] hover:bg-[#2563eb]/10"
                      />
                      <IconButton
                        icon={<Trash2 className="w-4 h-4" />}
                        intent="destructive"
                        onClick={() => handleDeleteResource(pool.name)}
                        aria-label="Delete"
                        title="Delete"
                      />
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
                onChange={e => setNewResourceReset(e.target.value as 'short' | 'long' | 'none')}
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
            <button type="button" onClick={handleAddResource} disabled={!newResourceName.trim()} className="px-3 py-1.5 bg-[#2563eb] text-white hover:bg-[#567eff] font-medium rounded-xl disabled:opacity-50 transition-colors">Add</button>
          </div>
        </div>
      )}

      {!isAddingResource && (
        <button
          type="button"
          onClick={() => setIsAddingResource(true)}
          className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#2563eb] hover:text-[#567eff]"
        >
          <Plus className="w-3 h-3" /> Add Resource
        </button>
      )}

      {pools.length === 0 && !isAddingResource && (
        <div className="border border-dashed border-stone-200 rounded-lg p-6 text-center text-stone-400 text-sm italic bg-white/50">
          No resource pools yet. Click '+ Add Resource' to add class abilities like Rage or Ki Points.
        </div>
      )}
    </div>
  );
}
