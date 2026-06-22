import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string | number;
  onChange: (value: string) => void;
  className?: string;
}

export function DebouncedInput({ value, onChange, onBlur, onKeyDown, className, ...props }: DebouncedInputProps) {
  const [localValue, setLocalValue] = useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const commit = () => {
    if (localValue !== value) onChange(String(localValue));
  };

  return (
    <input
      value={localValue}
      onChange={e => setLocalValue(e.target.value)}
      onBlur={e => {
        commit();
        if (onBlur) onBlur(e);
      }}
      onKeyDown={e => {
        if (e.key === 'Enter') commit();
        if (onKeyDown) onKeyDown(e);
      }}
      className={cn(
        "bg-white border border-[#e5e1d8] rounded-xl text-[#2c2c26] placeholder:text-[#5a5a40] focus:border-[#c5b358] focus:ring-1 focus:ring-[#c5b358]/50 focus:outline-none w-full px-3 py-2 text-sm transition-colors",
        className
      )}
      {...props}
    />
  );
}
