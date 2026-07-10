import React from 'react';
import { cn } from '../../lib/utils';
import { BadgeProps } from './Badge';

export interface PipTrackerProps {
  max: number;
  remaining: number;
  onChange?: (newValue: number) => void;
  color: BadgeProps['color'];
  size?: 'compact' | 'default' | 'large';
  label?: string;
  className?: string;
  readOnly?: boolean;
}

const filledStyles: Record<BadgeProps['color'], string> = {
  slate: 'bg-slate-500 border-slate-500',
  pink: 'bg-pink-500 border-pink-500',
  orange: 'bg-orange-500 border-orange-500',
  yellow: 'bg-yellow-500 border-yellow-500',
  green: 'bg-green-500 border-green-500',
  gray: 'bg-gray-500 border-gray-500',
  red: 'bg-red-500 border-red-500',
  purple: 'bg-purple-500 border-purple-500',
  emerald: 'bg-emerald-500 border-emerald-500',
  amber: 'bg-amber-500 border-amber-500',
  blue: 'bg-blue-500 border-blue-500',
};

const emptyStyles: Record<BadgeProps['color'], string> = {
  slate: 'bg-slate-100 border-slate-200 hover:bg-slate-200',
  pink: 'bg-pink-50 border-pink-200 hover:bg-pink-100',
  orange: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
  yellow: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
  green: 'bg-green-50 border-green-200 hover:bg-green-100',
  gray: 'bg-gray-100 border-gray-200 hover:bg-gray-200',
  red: 'bg-red-50 border-red-200 hover:bg-red-100',
  purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
  emerald: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
  amber: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
  blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
};

const sizeStyles = {
  compact: 'w-1.5 h-1.5',
  default: 'w-3 h-3',
  large: 'w-5 h-5',
};

export function PipTracker({
  max,
  remaining,
  onChange,
  color,
  size = 'default',
  label,
  className,
  readOnly = false,
}: PipTrackerProps) {
  const baseStyle = cn(
    'rounded-full border transition-all shrink-0',
    !readOnly && 'focus:outline-none cursor-pointer'
  );

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: max }).map((_, i) => {
        const isFilled = i < remaining;
        const ariaLabelText = `${label || 'Pip'} ${i + 1}`;

        let pipStyle = isFilled ? filledStyles[color] : emptyStyles[color];
        if (readOnly) {
          pipStyle = pipStyle.replace(/\bhover:\S+/g, '');
        }

        const classNameString = cn(
          baseStyle,
          sizeStyles[size],
          pipStyle
        );

        if (readOnly) {
          return (
            <div
              key={i}
              className={classNameString}
              aria-hidden="true"
              title={label ? ariaLabelText : undefined}
            />
          );
        }

        return (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onChange) {
                onChange(isFilled ? i : i + 1);
              }
            }}
            className={classNameString}
            aria-label={ariaLabelText}
            title={label ? ariaLabelText : undefined}
          />
        );
      })}
    </div>
  );
}
