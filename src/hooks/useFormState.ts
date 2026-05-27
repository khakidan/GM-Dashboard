import { useState, useCallback } from 'react';

export function useFormState<T>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  
  const handleChange = useCallback(
    (field: keyof T, value: T[keyof T]) => {
      setValues(prev => ({ ...prev, [field]: value }));
    }, []
  );
  
  const reset = useCallback(
    () => setValues(initialValues), 
    [initialValues]
  );
  
  return { values, handleChange, reset };
}
