export function formatNames(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) 
    return `${names[0]} and ${names[1]}`;
  const last = names[names.length - 1];
  const rest = names.slice(0, -1).join(', ');
  return `${rest}, and ${last}`;
}

// Formats a numeric modifier/bonus with an explicit sign.
// Zero displays as '+0'. Uses a true minus sign (−) for negatives, not a hyphen.
export function formatBonus(val: number): string {
  if (val >= 0) return `+${val}`;
  return `\u2212${Math.abs(val)}`;
}