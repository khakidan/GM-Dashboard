import React from 'react';

interface CardNumberInputProps {
  value: number;
  onChange: (val: number) => void;
  fallback?: number;
  min?: number;
  max?: number;
  className?: string;
  disabled?: boolean;
  title?: string;
  placeholder?: string;
}

export function CardNumberInput({
  value,
  onChange,
  fallback = 0,
  min,
  max,
  className,
  disabled,
  title,
  placeholder,
}: CardNumberInputProps) {
  const [local, setLocal] = React.useState(String(value));

  React.useEffect(() => {
    setLocal(String(value));
  }, [value]);

  const commit = () => {
    const parsed = parseInt(local, 10);
    if (!isNaN(parsed)) {
      const clamped = min !== undefined
        ? Math.max(min, max !== undefined ? Math.min(max, parsed) : parsed)
        : (max !== undefined ? Math.min(max, parsed) : parsed);
      onChange(clamped);
    } else {
      setLocal(String(value));
    }
  };

  return (
    <input
      type="number"
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
        }
      }}
      onFocus={e => e.target.select()}
      className={className}
      disabled={disabled}
      title={title}
      placeholder={placeholder}
      min={min}
      max={max}
    />
  );
}
