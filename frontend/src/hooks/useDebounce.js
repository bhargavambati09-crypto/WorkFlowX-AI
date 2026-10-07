import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any value (e.g., search inputs, filter values).
 * Delays updating the debounced value until after the specified delay has elapsed
 * since the last time the value was changed.
 *
 * @template T
 * @param {T} value - The input value to debounce
 * @param {number} delay - The delay in milliseconds (default: 300ms)
 * @returns {T} - The debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
