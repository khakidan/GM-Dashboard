import { z } from 'zod';

/**
 * Validates the core structural requirements of state objects.
 * Strict on 'id' presence and type, permissive on all other fields.
 */
const StateObjectSchema = z.object({
  id: z.string().min(1),
}).passthrough();

/**
 * Schema for campaign data backup/import.
 * Matches the structure produced by handleExportJSON in useSettings.ts.
 * Atomic validation: if any present field is malformed, the whole backup is rejected.
 */
export const CampaignBackupSchema = z.object({
  campaignName: z.string().optional().nullable(),
  characters: z.array(StateObjectSchema).optional(),
  npcs: z.array(StateObjectSchema).optional(),
  encounters: z.array(StateObjectSchema).optional(),
  encounterCombatants: z.array(StateObjectSchema).optional(),
});

export type CampaignBackup = z.infer<typeof CampaignBackupSchema>;
