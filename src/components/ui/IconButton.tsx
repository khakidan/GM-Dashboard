import React from 'react';
import { cn } from '../../lib/utils';

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  icon: React.ReactNode;
  intent?: 'neutral' | 'destructive';
  onDark?: boolean;
  'aria-label': string;
}

const baseStyle = "p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const styleMap = {
  neutral: {
    light: "text-stone-400 hover:text-stone-700 hover:bg-stone-100",
    dark: "text-white/50 hover:text-white hover:bg-white/10"
  },
  destructive: {
    light: "text-stone-400 hover:text-red-600 hover:bg-red-50",
    // Note: This combination (destructive on dark) is currently unvalidated against real usage.
    // Revisit the styling if/when a real instance is found in the application.
    dark: "text-red-300 hover:text-red-100 hover:bg-red-500/20"
  }
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  intent = 'neutral',
  onDark = false,
  className,
  'aria-label': ariaLabel,
  ...props
}) => {
  return (
    <button
      aria-label={ariaLabel}
      className={cn(baseStyle, styleMap[intent][onDark ? 'dark' : 'light'], className)}
      {...props}
    >
      {icon}
    </button>
  );
};
