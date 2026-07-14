export const OVERLAY_DURATIONS = {
  death: 10000,
  damage: 5000,
  heal: 5000,
  unconscious: 5000,
  rage: 5000,
  initiative: 8000,
} as const;

export const OVERLAY_CLEAR_BUFFER_MS = 500;

export const ANIMATION_TIMING = {
  deathExit: 8500,
  deathExitDuration: 1500,
  damageExit: 4700,
  damageExitDuration: 800,
  healExit: 4600,
  healExitDuration: 900,
  rageExit: 4800,
  rageExitDuration: 700,
  unconsciousExit: 4300,
  unconsciousExitDuration: 1200,
  initiativeExit: 7500,
  initiativeExitDuration: 1000,
} as const;

export const DEATH_SAVES = {
  failuresForDeath: 3,
  successesForStability: 3,
} as const;

export const RECHARGE_THRESHOLDS = {
  onSix: 6,
  onFiveOrSix: 5,
  onFourToSix: 4,
} as const;

export const RECHARGE_DIE_SIDES = 6;

export const SHEET_RANGES = {
  characters: 'Characters!A2:Z',
  npcs: 'NPCs!A2:V',
  encounters: 'Encounters!A2:G',
  encounterCombatants: 'Encounter_Combatants!A2:N',
  statuses: 'Status!A2:B',
  difficulties: 'Difficulty_Level!A2:B',
} as const;

export const WRITE_QUEUE = {
  maxRetryItems: 50,
  debounceMs: 600,
  retryLocalStorageKey: 'gm_write_retry_queue',
  queuePollIntervalMs: 3000,
} as const;

export const STORAGE_KEYS = {
  appState: 'gm_dashboard_state',
  lastActiveTab: 'gm_last_active_tab',
  sidebarOpen: 'gm_sidebar_open',
  writeRetryQueue: 'gm_write_retry_queue',
  visualStyle: 'gm_visual_style',
  googleAccessToken: 'GM_GOOGLE_ACCESS_TOKEN',
  googleRefreshToken: 'GM_GOOGLE_REFRESH_TOKEN',
  spreadsheetId: 'GM_DATA_SPREADSHEET_ID',
  diceRollerExpanded: 'dice_roller_expanded',
  ambientVolume: 'gm_ambient_volume',
  effectVolume: 'gm_effect_volume',
  soundboardLayout: 'gm_soundboard_layout',
  instructionsDismissed: 'gm_instructions_dismissed',
  moodPresets: 'gm_mood_presets',
  campaigns: 'gm_campaigns',
  activeCampaignId: 'gm_active_campaign_id',
  activeCampaignSpreadsheetId: 'gm_active_campaign_spreadsheet_id',
  oauthState: 'gm_oauth_state',
} as const;

// Returns a campaign-scoped storage key.
// campaignKey('gm_mood_presets', 'abc123')
// → 'gm_mood_presets_abc123'
export function campaignKey(
  baseKey: string,
  campaignId: string
): string {
  return `${baseKey}_${campaignId}`;
}

export const MOODS = [
  { 
    id: 'sweet', 
    label: 'Sweet', 
    emoji: '🌸',
    color: 'pink'
  },
  { 
    id: 'adventuring', 
    label: 'Adventuring', 
    emoji: '⚔️',
    color: 'amber'
  },
  { 
    id: 'tense', 
    label: 'Tense', 
    emoji: '⚠️',
    color: 'orange'
  },
  { 
    id: 'scary', 
    label: 'Scary', 
    emoji: '👻',
    color: 'purple'
  },
  { 
    id: 'combat', 
    label: 'Combat', 
    emoji: '🔥',
    color: 'red'
  },
] as const;

export type MoodId = typeof MOODS[number]['id'];

export const TIMERS = {
  // AudioLibrary preview duration
  audioPreviewMs: 3000,
  // AuthRelay polling and timeout
  authRelayPollingMs: 500,
  authRelayTimeoutMs: 2000,
  // DiceRoller animation bounds
  diceRollerTickMs: 15000,
  diceRollerSettleMs: 4000,
  // Write queue polling
  writeQueuePollingMs: 2000,
} as const;

export const AUDIO = {
  crossfadeDurationSec: 5,
  ambientDefaultVolume: 0.7,
  effectDefaultVolume: 0.8,
} as const;

export const DEFAULT_STATUSES: Record<string, string> = {
  '1': 'Active',
  '2': 'Inactive',
  '3': 'Deceased',
};
