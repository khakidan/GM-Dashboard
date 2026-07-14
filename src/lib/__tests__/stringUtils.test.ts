import { describe, it, expect } from 'vitest';
import { formatNames } from '../stringUtils';

describe('formatNames', () => {
  it('returns empty string for empty array', () => {
    expect(formatNames([])).toBe('');
  });

  it('formats a single name', () => {
    expect(formatNames(['Alice'])).toBe('Alice');
  });

  it('formats two names with "and"', () => {
    expect(formatNames(['Alice', 'Bob'])).toBe('Alice and Bob');
  });

  it('formats three names with commas and an Oxford comma', () => {
    expect(formatNames(['Alice', 'Bob', 'Charlie'])).toBe('Alice, Bob, and Charlie');
  });

  it('formats more than three names with commas and an Oxford comma', () => {
    expect(formatNames(['Alice', 'Bob', 'Charlie', 'Diana'])).toBe('Alice, Bob, Charlie, and Diana');
  });
});
