import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  value: string | number;
  onChange: (value: string) => void;
  className?: string;
  size?: 'compact' | 'prominent';
  immediate?: boolean;
}

export function DebouncedInput({ value, onChange, onBlur, onKeyDown, className, size = 'compact', immediate = false, ...props }: DebouncedInputProps) {
  const [localValue, setLocalValue] = useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const commit = () => {
    if (localValue !== value) onChange(String(localValue));
  };

  const inputStyleClass = size === 'prominent'
    ? "bg-white border border-[#e2e8f0] rounded-xl text-[#0f172a] placeholder:text-[#8d8db9] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] focus:outline-none w-full px-4 py-3 text-sm transition-colors"
    : "bg-white border border-[#e2e8f0] rounded-xl text-[#0f172a] placeholder:text-[#8d8db9] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/50 focus:outline-none w-full px-3 py-2 text-sm transition-colors";

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
