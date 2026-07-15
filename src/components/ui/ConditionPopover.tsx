import React, { useState, useRef, useEffect } from 'react';
import { getConditionDescription } from '../../lib/conditions';
import { CONDITION_OPTIONS, SPELL_EFFECT_OPTIONS } from '../../lib/irvOptions';

export interface ConditionPopoverProps {
  conditionName: string;
  category: 'condition' | 'effect' | 'custom';
  children: React.ReactNode;
}

export const ConditionPopover: React.FC<ConditionPopoverProps> = ({
  conditionName,
  category,
  children,
}) => {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState<{ x: 'right' | 'left'; y: 'below' | 'above' }>({
    x: 'right',
    y: 'below',
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  const calculatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // If center of trigger is past half the screen, place popover on the left; otherwise right.
    const x = rect.left + rect.width / 2 > viewportWidth / 2 ? 'left' : 'right';
    // If trigger bottom is near screen bottom, place popover above; otherwise below.
    const y = rect.bottom + 180 > viewportHeight ? 'above' : 'below';

    setCoords({ x, y });
  };

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    calculatePosition();
    timerRef.current = setTimeout(() => {
      setShow(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShow(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    calculatePosition();
    setShow(prev => !prev);
  };

  useEffect(() => {
    if (!show) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShow(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [show]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const desc = getConditionDescription(conditionName);

  const capitalize = (str: string) => {
    return str
      .split(' ')
      .map(w => {
        if (!w) return '';
        // handle cases with quotes or brackets gracefully
        let prefix = '';
        let body = w;
        if (body.startsWith('(')) {
          prefix = '(';
          body = body.slice(1);
        }
        return prefix + body.charAt(0).toUpperCase() + body.slice(1);
      })
      .join(' ');
  };

  const displayCategory = (() => {
    if (category === 'custom') return 'Custom';
    const lowerName = conditionName.toLowerCase().trim();

    if (CONDITION_OPTIONS.includes(lowerName)) {
      return 'Condition';
    }

    if (SPELL_EFFECT_OPTIONS.includes(lowerName)) {
      return 'Spell';
    }

    return category === 'effect' ? 'Effect' : 'Condition';
  })();

  const arrowClass =
    coords.x === 'right'
      ? 'left-[-4px] top-3 border-r-stone-800 border-y-transparent border-l-transparent'
      : 'right-[-4px] top-3 border-l-stone-800 border-y-transparent border-r-transparent';

  const positionClasses = [
    'absolute z-50 w-72 max-w-[280px]',
    coords.x === 'right' ? 'left-full ml-2' : 'right-full mr-2',
    coords.y === 'below' ? 'top-0' : 'bottom-0',
  ].join(' ');

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      id={`popover-container-${conditionName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
    >
      {children}

      {show && (
        <div
          className={positionClasses}
          onClick={e => e.stopPropagation()}
          data-testid="condition-popover-content"
        >
          {/* Popover Arrow */}
          <div className={`absolute w-0 h-0 border-4 ${arrowClass} pointer-events-none`} />

          <div className="bg-stone-800 border border-stone-600 text-stone-100 rounded-lg shadow-xl p-3 select-none text-left">
            {/* Header row */}
            <div className="flex items-center justify-between gap-2 border-b border-stone-700 pb-1.5 mb-1.5">
              <span className="text-sm font-bold text-amber-300">
                {capitalize(conditionName)}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-700 text-stone-400 font-semibold uppercase tracking-wide">
                {displayCategory}
              </span>
            </div>

            {desc ? (
              <>
                {/* Summary */}
                <p className="text-xs italic text-stone-300 mb-2 leading-relaxed">
                  {desc.summary}
                </p>

                {/* Rules bulletins */}
                <ul className="text-xs text-stone-200 space-y-1.5">
                  {desc.rules.map((rule, idx) => (
                    <li key={idx} className="flex gap-1.5 items-start">
                      <span className="text-amber-400 text-[10px] mt-0.5 flex-shrink-0">•</span>
                      <span className="leading-tight">{rule}</span>
                    </li>
                  ))}
                </ul>

                {/* Note */}
                {desc.note && (
                  <div className="text-[10px] text-amber-400/80 mt-2 border-t border-stone-700 pt-2 flex gap-1 items-start leading-normal">
                    <span className="flex-shrink-0">⚠️</span>
                    <span>{desc.note}</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-stone-400 italic leading-relaxed">
                Custom status — no official rules text available.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
