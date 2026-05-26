import React, { useState } from 'react';

export interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string | number;
  onChange: (value: string) => void;
}

export function DebouncedInput({ value, onChange, onBlur, onKeyDown, ...props }: DebouncedInputProps) {
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
      {...props}
    />
  );
}
