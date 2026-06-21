import { toast } from 'sonner';

// Calculates the Constitution save DC for a concentration check.
// DC = max(10, floor(damage / 2))
// damage must be positive (actual damage dealt, after resistances).
export function concentrationCheckDc(damage: number): number {
  if (damage <= 0) return 0;
  return Math.max(10, Math.floor(damage / 2));
}

// Returns true if the conditions string contains the "concentrating" effect.
// Case-insensitive. Handles comma-separated condition strings.
export function isConcentrating(conditions: string): boolean {
  if (!conditions?.trim()) return false;
  return conditions
    .toLowerCase()
    .split(',')
    .map(c => c.trim())
    .includes('concentrating');
}

// Fires a Sonner warning toast with the concentration check details.
// Call this after confirming the creature is concentrating and damage > 0.
export function fireConcentrationAlert(creatureName: string, damageTaken: number): void {
  const dc = concentrationCheckDc(damageTaken);
  const halfDamage = Math.floor(damageTaken / 2);
  
  toast.warning(
    `Concentration Check — ${creatureName}`,
    {
      description: `DC ${dc} Constitution save · took ${damageTaken} damage · half = ${halfDamage}${halfDamage < 10 ? ' (min DC 10)' : ''}`,
      duration: 10000,
      icon: '🎯',
    }
  );
}
