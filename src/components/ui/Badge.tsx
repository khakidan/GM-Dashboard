import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps {
  color: 'slate' | 'pink' | 'orange' | 'yellow' | 'green' | 'gray' | 'red' | 'purple' | 'emerald' | 'amber' | 'blue';
  size?: 'compact' | 'default' | 'large';
  children: React.ReactNode;
  className?: string;
}

export const colorStyles: Record<BadgeProps['color'], string> = {
  slate: 'bg-slate-50 text-slate-700 border-slate-200',
  pink: 'bg-pink-50 text-pink-700 border-pink-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  gray: 'bg-gray-50 text-gray-700 border-gray-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
};

export const sizeStyles = {
  compact: 'text-[9px] px-1.5 py-[2px]',
  default: 'text-xs px-2 py-0.5',
  large: 'text-lg px-4 py-1.5',
};

export function Badge({ color, size = 'default', children, className }: BadgeProps) {
  const baseStyle = 'inline-flex items-center justify-center rounded-full border font-bold uppercase tracking-wide';

  return (
    <span className={cn(baseStyle, sizeStyles[size], colorStyles[color], className)}>
      {children}
    </span>
  );
}
