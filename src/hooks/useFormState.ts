import { useState, useCallback, useRef } from 'react';

export function useFormState<T>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  
  // Use a ref to capture initial values without triggering dependency updates
  const initialRef = useRef<T>(initialValues);
  
  // Keep the ref updated in case the dynamic template of initial value changes
  initialRef.current = initialValues;
  
  const handleChange = useCallback(
    (field: keyof T, value: T[keyof T]) => {
      setValues(prev => ({ ...prev, [field]: value }));
    }, []
  );
  
  const reset = useCallback(
    () => setValues(initialRef.current), 
    []
  );
  
  return { values, handleChange, reset };
}
