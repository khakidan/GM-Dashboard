import React from 'react';
import { cn } from '../../lib/utils';
import { BadgeProps, colorStyles, sizeStyles } from './Badge';

export interface ToggleBadgeProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
  activeColor: BadgeProps['color'];
  inactiveColor: BadgeProps['color'];
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  size?: 'compact' | 'default';
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function ToggleBadge({
  active,
  activeColor,
  inactiveColor,
  onClick,
  disabled = false,
  size = 'default',
  children,
  className,
  id,
  ...props
}: ToggleBadgeProps) {
  const baseStyle = 'inline-flex items-center justify-center rounded-full border font-bold uppercase tracking-wide cursor-pointer transition-all disabled:cursor-not-allowed disabled:opacity-50 select-none';

  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseStyle,
        sizeStyles[size],
        colorStyles[active ? activeColor : inactiveColor],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
