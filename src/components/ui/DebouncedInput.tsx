import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  value: string | number;
  onChange: (value: string) => void;
  className?: string;
  size?: 'compact' | 'prominent';
  variant?: 'boxed' | 'inline';
  immediate?: boolean;
}

export function DebouncedInput({ 
  value, 
  onChange, 
  onBlur, 
  onKeyDown, 
  className, 
  size = 'compact', 
  variant = 'boxed',
  immediate = false, 
  ...props 
}: DebouncedInputProps) {
  const [localValue, setLocalValue] = useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const commit = () => {
    if (localValue !== value) onChange(String(localValue));
  };

  const boxedStyle = size === 'prominent'
    ? "bg-white border border-[#e2e8f0] rounded-xl text-[#0f172a] placeholder:text-[#8d8db9] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] focus:outline-none w-full px-4 py-3 text-sm transition-colors"
    : "bg-white border border-[#e2e8f0] rounded-xl text-[#0f172a] placeholder:text-[#8d8db9] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/50 focus:outline-none w-full px-3 py-2 text-sm transition-colors";

  const inlineStyle = "bg-transparent border border-transparent rounded hover:bg-[#f9f8ff] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none px-2 py-1 -ml-2 transition-all";

  const inputStyleClass = variant === 'inline' ? inlineStyle : boxedStyle;

  return (
    <input
      value={localValue}
      onChange={e => {
        const nextVal = e.target.value;
        setLocalValue(nextVal);
        if (immediate) {
          onChange(nextVal);
        }
      }}
      onBlur={e => {
        commit();
        if (onBlur) onBlur(e);
      }}
      onKeyDown={e => {
        if (e.key === 'Enter') commit();
        if (onKeyDown) onKeyDown(e);
      }}
      className={cn(
        inputStyleClass,
        className
      )}
      {...props}
    />
  );
}
