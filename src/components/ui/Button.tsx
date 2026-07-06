import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Future extensions planned:
 * - Icon-only buttons will live in a separate IconButton.tsx component, not here,
 *   as they have a completely different prop shape (no text children, mandatory aria-label, etc.).
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  intent?: 'primary' | 'secondary' | 'tertiary' | 'destructive';
  size?: 'large' | 'small';
}

export function Button({
  children,
  intent = 'primary',
  size = 'small',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const isTertiary = intent === 'tertiary';
  
  const baseStyle = cn(
    "transition-all disabled:cursor-not-allowed motion-safe:active:scale-95 disabled:active:scale-100",
    !isTertiary && "font-bold uppercase tracking-widest text-xs rounded-xl"
  );
  
  const sizeStyles = {
    small: "px-4 py-2",
    large: "px-6 py-3 flex-1 justify-center",
  };
  
  const intentStyles = {
    primary: "bg-[#2563eb] text-white hover:bg-[#567eff] disabled:bg-[#e2e8f0] disabled:text-[#8d8db9] disabled:opacity-60 shadow-sm",
    secondary: "bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#0f172a] disabled:opacity-60",
    tertiary: "text-sm text-stone-500 hover:text-stone-700 px-2 py-1 transition-colors",
    destructive: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 disabled:opacity-60",
  };

  return (
    <button
      type={type}
      className={cn(baseStyle, !isTertiary && sizeStyles[size], intentStyles[intent], className)}
      {...props}
    >
      {children}
    </button>
  );
}
