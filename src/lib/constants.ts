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
  characters: 'Characters!A2:T',
  npcs: 'NPCs!A2:N',
  encounters: 'Encounters!A2:G',
  encounterCombatants: 'Encounter_Combatants!A2:K',
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
  soundsEnabled: 'gm_sounds_enabled',
  writeRetryQueue: 'gm_write_retry_queue',
  visualStyle: 'gm_visual_style',
  googleAccessToken: 'GM_GOOGLE_ACCESS_TOKEN',
  googleRefreshToken: 'GM_GOOGLE_REFRESH_TOKEN',
  spreadsheetId: 'GM_DATA_SPREADSHEET_ID',
  diceRollerExpanded: 'dice_roller_expanded',
  ambientVolume: 'gm_ambient_volume',
  effectVolume: 'gm_effect_volume',
  soundboardLayout: 'gm_soundboard_layout',
} as const;

export const AUDIO = {
  crossfadeDurationSec: 5,
  ambientDefaultVolume: 0.7,
  effectDefaultVolume: 0.8,
} as const;
