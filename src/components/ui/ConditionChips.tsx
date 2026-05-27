// src/components/ui/ConditionChips.tsx

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import {
  CONDITION_OPTIONS,
  EFFECT_OPTIONS,
  CONDITION_IMMUNITY_MAP,
} from '../../lib/irvOptions';
import { checkIrvMatch } from '../../lib/combatLogic';
import { toast } from 'sonner';

interface ConditionChipsProps {
  value: string;                      // comma-separated string
  onChange: (value: string) => void;
  immunities?: string;                // checked before adding official conditions
  disabled?: boolean;
  className?: string;
}

type ChipCategory = 'condition' | 'effect' | 'custom';

function getCategory(chip: string): ChipCategory {
  const lower = chip.toLowerCase().trim();
  if (CONDITION_OPTIONS.includes(lower)) return 'condition';
  if (EFFECT_OPTIONS.includes(lower))   return 'effect';
  return 'custom';
}

const chipClass: Record<ChipCategory, string> = {
  condition: 'bg-red-50 text-red-700 border border-red-200',
  effect:    'bg-blue-50 text-blue-700 border border-blue-200',
  custom:    'bg-[#f5f5f0] text-[#5a5a40] border border-[#e5e1d8]',
};

export function ConditionChips({
  value,
  onChange,
  immunities = '',
  disabled = false,
  className,
}: ConditionChipsProps) {
  const [query, setQuery]   = useState('');
  const [open, setOpen]     = useState(false);
  const wrapperRef          = useRef<HTMLDivElement>(null);
  const inputRef            = useRef<HTMLInputElement>(null);

  const chips = value
    ? value.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const chipsLower = chips.map(c => c.toLowerCase());

  // Close dropdown when clicking outside
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const allOptions = [
    ...CONDITION_OPTIONS.map(o => ({ label: o, group: 'Conditions' as const })),
    ...EFFECT_OPTIONS.map(o =>    ({ label: o, group: 'Effects' as const })),
  ];

  const filtered = allOptions.filter(
    o =>
      o.label.toLowerCase().includes(query.toLowerCase()) &&
      !chipsLower.includes(o.label.toLowerCase())
  );

  const conditionResults = filtered.filter(o => o.group === 'Conditions');
  const effectResults    = filtered.filter(o => o.group === 'Effects');

  function isImmune(conditionName: string): boolean {
    if (!immunities) return false;
    const lower = conditionName.toLowerCase().trim();
    const keys  = CONDITION_IMMUNITY_MAP[lower] || [lower];
    return keys.some(k => checkIrvMatch(k, immunities));
  }

  function addChip(label: string) {
    const trimmed = label.trim();
    if (!trimmed) return;
    if (chipsLower.includes(trimmed.toLowerCase())) {
      setQuery(''); setOpen(false); return;
    }

    // Block official conditions the target is immune to
    if (getCategory(trimmed) === 'condition' && isImmune(trimmed)) {
      toast.warning(`Cannot apply ${trimmed}`, {
        description: 'This combatant is immune to that condition.',
      });
      setQuery(''); setOpen(false); return;
    }

    onChange([...chips, trimmed].join(', '));
    setQuery(''); setOpen(false);
  }

  function removeChip(chip: string) {
    onChange(chips.filter(c => c !== chip).join(', '));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      addChip(filtered.length === 1 ? filtered[0].label : query);
    }
    if (e.key === 'Escape')   { setOpen(false); }
    if (e.key === 'Backspace' && !query && chips.length > 0) {
      removeChip(chips[chips.length - 1]);
    }
  }

  const showCustomEntry =
    query.trim() &&
    !filtered.some(o => o.label.toLowerCase() === query.toLowerCase());

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>

      {/* Chip container + input */}
      <div
        className={cn(
          'min-h-[42px] flex flex-wrap gap-1.5 p-2',
          'bg-[#faf9f6] border border-[#e5e1d8] rounded-xl cursor-text transition-colors',
          !disabled && 'focus-within:border-[#c5b358] focus-within:bg-white',
          disabled  && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {chips.map(chip => (
          <span
            key={chip}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
              'text-xs font-bold font-sans capitalize',
              chipClass[getCategory(chip)]
            )}
          >
            {chip}
            {!disabled && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); removeChip(chip); }}
                className="leading-none hover:opacity-60 transition-opacity ml-0.5"
                aria-label={`Remove ${chip}`}
              >
                ×
              </button>
            )}
          </span>
        ))}

        {!disabled && (
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={chips.length === 0 ? 'Add condition or effect...' : ''}
            className="flex-1 min-w-[140px] bg-transparent outline-none text-xs font-sans
                       text-[#2c2c26] placeholder:text-[#5a5a40]/40"
          />
        )}
      </div>

      {/* Dropdown */}
      {open && !disabled && (filtered.length > 0 || showCustomEntry) && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#e5e1d8]
                        rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">

          {conditionResults.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest
                              text-red-600 bg-red-50 border-b border-[#f0f0f0]">
                Conditions
              </div>
              {conditionResults.map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); addChip(opt.label); }}
                  className="w-full text-left px-3 py-2 text-xs font-sans text-red-700
                             hover:bg-red-50 transition-colors capitalize"
                >
                  {opt.label}
                  {isImmune(opt.label) && (
                    <span className="ml-2 text-[9px] font-bold text-red-400 uppercase tracking-wider">
                      immune
                    </span>
                  )}
                </button>
              ))}
            </>
          )}

          {effectResults.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest
                              text-blue-600 bg-blue-50 border-b border-[#f0f0f0]">
                Effects
              </div>
              {effectResults.map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); addChip(opt.label); }}
                  className="w-full text-left px-3 py-2 text-xs font-sans text-blue-700
                             hover:bg-blue-50 transition-colors capitalize"
                >
                  {opt.label}
                </button>
              ))}
            </>
          )}

          {showCustomEntry && (
            <>
              <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest
                              text-[#5a5a40] bg-[#f5f5f0] border-b border-[#e5e1d8]">
                Custom
              </div>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); addChip(query); }}
                className="w-full text-left px-3 py-2 text-xs font-sans text-[#5a5a40]
                           hover:bg-[#f5f5f0] transition-colors"
              >
                Add "{query}"
              </button>
            </>
          )}
        </div>
      )}

      {/* Colour legend — only shown when chips are present */}
      {chips.length > 0 && (
        <div className="flex gap-3 mt-1 px-1">
          <span className="text-[9px] font-sans text-[#5a5a40]/60 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-300 inline-block" />
            Condition
          </span>
          <span className="text-[9px] font-sans text-[#5a5a40]/60 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-300 inline-block" />
            Effect
          </span>
        </div>
      )}
    </div>
  );
}