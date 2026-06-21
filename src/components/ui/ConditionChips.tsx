import { CONDITION_OPTIONS, EFFECT_OPTIONS, CONDITION_IMMUNITY_MAP, CONCENTRATION_EFFECTS, CONDITION_MECHANICS, buildConditionSummary } from '../../lib/conditions';
// src/components/ui/ConditionChips.tsx

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import { ConditionPopover } from './ConditionPopover';
import { checkIrvMatch } from '../../lib/combatLogic';
import { toast } from 'sonner';

interface ConditionChipsProps {
  value: string;                      // comma-separated string
  onChange: (value: string) => void;
  immunities?: string;                // checked before adding official conditions
  disabled?: boolean;
  className?: string;
  onAddWithTimer?: (label: string, rounds: number) => void;
  currentRound?: number;
  onConcentrationEffectAdded?: (effectName: string) => void;
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
  onAddWithTimer,
  currentRound,
  onConcentrationEffectAdded,
}: ConditionChipsProps) {
  const [query, setQuery]   = useState('');
  const [open, setOpen]     = useState(false);
  const wrapperRef          = useRef<HTMLDivElement>(null);
  const inputRef            = useRef<HTMLInputElement>(null);
  
  const [pendingCondition, setPendingCondition] = useState<string | null>(null);
  const [timerRounds, setTimerRounds] = useState<string>('');
  
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const debouncedOnChange = (newValue: string) => {
    setLocalValue(newValue);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  };

  const chips = localValue
    ? localValue.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const chipsLower = chips.map(c => c.toLowerCase());

  const updatePosition = () => {
    if (wrapperRef.current && open) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  };

  useLayoutEffect(() => {
    updatePosition();
  }, [open, query]);

  useEffect(() => {
    if (!open) return;
    
    let debounceTimer: ReturnType<typeof setTimeout>;
    const handleScroll = (e: Event) => {
      // Close on scroll to prevent detached dropdowns
      const portalEl = document.getElementById('condition-chips-dropdown');
      if (portalEl && (e.target === portalEl || portalEl.contains(e.target as Node))) {
        return;
      }
      setOpen(false);
    };
    const handleResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [open]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        // Also need to check if the click was inside the portal dropdown
        const portalEl = document.getElementById('condition-chips-dropdown');
        if (portalEl && portalEl.contains(e.target as Node)) return;
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

  function commitChip(label: string) {
    const trimmed = label.trim();
    let nextChips = [...chips];
    
    const isExhaustion = /^exhaustion \d$/i.test(trimmed);
    if (isExhaustion) {
      nextChips = nextChips.filter(c => !/^exhaustion \d$/i.test(c.trim()));
    }
    
    nextChips.push(trimmed);
    
    const isConEffect = CONCENTRATION_EFFECTS.has(trimmed.toLowerCase().trim()) && trimmed.toLowerCase().trim() !== 'concentrating';
    if (isConEffect && onConcentrationEffectAdded) {
      onConcentrationEffectAdded(trimmed);
    }
    
    debouncedOnChange(nextChips.join(', '));
    setQuery('');
    setOpen(false);
  }

  function removeChip(chip: string) {
    const trimmed = chip.trim();
    let nextChips = chips.filter(c => c !== chip);
    
    const CON_LABEL = 'concentrating';
    if (CONCENTRATION_EFFECTS.has(trimmed.toLowerCase().trim()) || trimmed.toLowerCase().trim() === CON_LABEL) {
      const remainingConEffects = nextChips.filter(c => 
        CONCENTRATION_EFFECTS.has(c.toLowerCase().trim()) && 
        c.toLowerCase().trim() !== CON_LABEL
      );
      if (remainingConEffects.length === 0) {
        nextChips = nextChips.filter(c => c.toLowerCase().trim() !== CON_LABEL);
      }
    }

    debouncedOnChange(nextChips.join(', '));
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

    const lower = trimmed.toLowerCase();
    if (lower === 'exhaustion 6') {
      toast.warning('Exhaustion 6 — Death', {
        description: 'This creature has died. Remove from combat or mark as Defeated.',
        duration: 12000,
      });
    }

    if (onAddWithTimer) {
      setPendingCondition(trimmed);
      setTimerRounds('');
      setQuery('');
      setOpen(false);
    } else {
      commitChip(trimmed);
    }

    const mechanics = CONDITION_MECHANICS[lower];
    if (mechanics) {
      const remainingChips = chips.filter(c => !(/^exhaustion \d$/i.test(c.trim()) && /^exhaustion \d$/i.test(trimmed)));
      const summary = buildConditionSummary([...remainingChips, trimmed]);
      toast(label, {
        description: summary.lines.join(' • ') || 'No mechanical restrictions.',
        duration: 6000,
      });
    }
  }

  function confirmPendingTimer() {
    if (!pendingCondition) return;
    const rounds = parseInt(timerRounds);
    if (!isNaN(rounds) && rounds > 0 && onAddWithTimer) {
      const isConEffect = CONCENTRATION_EFFECTS.has(pendingCondition.toLowerCase().trim()) && pendingCondition.toLowerCase().trim() !== 'concentrating';
      if (isConEffect && onConcentrationEffectAdded) {
        onConcentrationEffectAdded(pendingCondition);
      }
      onAddWithTimer(pendingCondition, rounds);
    } else {
      commitChip(pendingCondition);
    }
    setPendingCondition(null);
  }

  function skipPendingTimer() {
    if (pendingCondition) {
      commitChip(pendingCondition);
    }
    setPendingCondition(null);
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
        onClick={() => {
          if (!disabled) {
            setOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        {chips.map(chip => (
          <ConditionPopover
            key={chip}
            conditionName={chip}
            category={getCategory(chip)}
          >
            <span
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
          </ConditionPopover>
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
      {open && !disabled && (filtered.length > 0 || showCustomEntry) && typeof document !== 'undefined' && createPortal(
        <div 
          id="condition-chips-dropdown"
          className="bg-white border border-[#e5e1d8] rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto"
          style={dropdownStyle}
        >

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
        </div>,
        document.body
      )}

      {/* Inline duration prompt */}
      {pendingCondition && (
        <div className="mt-2 p-2 bg-[#faf9f6] border border-[#e5e1d8] rounded-xl flex items-center gap-2">
          <span className="text-xs font-bold text-[#5a5a40]">Duration for {pendingCondition}:</span>
          <input
            type="number"
            autoFocus
            min="1"
            placeholder="rounds"
            value={timerRounds}
            onChange={e => setTimerRounds(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') confirmPendingTimer();
              if (e.key === 'Escape') skipPendingTimer();
            }}
            className="w-20 bg-white border border-[#e5e1d8] rounded text-center px-2 py-1 text-xs outline-none focus:border-[#c5b358]"
          />
          <span className="text-[10px] text-[#5a5a40]/60">(optional)</span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={confirmPendingTimer}
            className="px-2 py-1 text-[10px] font-bold uppercase bg-[#c5b358] text-white rounded hover:bg-[#b09e4b]"
          >
            Add
          </button>
          <button
            type="button"
            onClick={skipPendingTimer}
            className="px-2 py-1 text-[10px] font-bold uppercase text-[#5a5a40] hover:bg-[#e5e1d8] rounded"
          >
            Skip
          </button>
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