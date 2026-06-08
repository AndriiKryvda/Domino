// Input validation for socket event data
import { GameSettings, MAX_PLAYERS, MIN_PLAYERS } from './types';

// Regex patterns
const NAME_PATTERN = /^[a-zA-Z0-9_\- ]{1,20}$/;
const JOIN_CODE_PATTERN = /^[A-Z0-9]{6}$/;
const UUID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const TILE_ID_PATTERN = /^\d+-\d+$/;

// Validation result type
export interface ValidationResult {
  success: boolean;
  error?: string;
}

// --- Generic validators ---

export function validatePlayerName(name: unknown): ValidationResult {
  if (typeof name !== 'string' || name.length === 0) {
    return { success: false, error: 'Invalid player name' };
  }
  if (!NAME_PATTERN.test(name)) {
    return { success: false, error: 'Player name must be 1-20 alphanumeric characters, spaces, underscores, or hyphens' };
  }
  return { success: true };
}

export function validateJoinCode(code: unknown): ValidationResult {
  if (typeof code !== 'string' || !JOIN_CODE_PATTERN.test(code.toUpperCase())) {
    return { success: false, error: 'Invalid join code' };
  }
  return { success: true };
}

export function validatePlayerId(id: unknown): ValidationResult {
  if (typeof id !== 'string' || !UUID_PATTERN.test(id)) {
    return { success: false, error: 'Invalid player ID' };
  }
  return { success: true };
}

export function validateTileId(id: unknown): ValidationResult {
  if (typeof id !== 'string' || !TILE_ID_PATTERN.test(id)) {
    return { success: false, error: 'Invalid tile ID' };
  }
  return { success: true };
}

export function validatePlacementEnd(end: unknown): ValidationResult {
  if (end !== 'left' && end !== 'right') {
    return { success: false, error: 'Invalid placement end' };
  }
  return { success: true };
}

export function validateDifficulty(difficulty: unknown): ValidationResult {
  if (!['easy', 'medium', 'hard'].includes(difficulty as string)) {
    return { success: false, error: 'Invalid difficulty' };
  }
  return { success: true };
}

export function validateGameId(id: unknown): ValidationResult {
  if (typeof id !== 'string' || !UUID_PATTERN.test(id)) {
    return { success: false, error: 'Invalid game ID' };
  }
  return { success: true };
}

// --- Settings validator ---

export function validateGameSettings(settings: unknown): Partial<GameSettings> {
  if (settings == null || typeof settings !== 'object') {
    return {};
  }

  const s = settings as Record<string, unknown>;
  const result: Partial<GameSettings> = {};

  // targetScore
  if (s.targetScore !== undefined) {
    const val = Number(s.targetScore);
    if (Number.isFinite(val) && val >= 50 && val <= 500) {
      result.targetScore = val;
    }
  }

  // maxPlayers
  if (s.maxPlayers !== undefined) {
    const val = Number(s.maxPlayers);
    if (Number.isFinite(val) && val >= MIN_PLAYERS && val <= MAX_PLAYERS) {
      result.maxPlayers = val;
    }
  }

  // turnTimeSeconds
  if (s.turnTimeSeconds !== undefined) {
    const val = Number(s.turnTimeSeconds);
    if (Number.isFinite(val) && (val === 0 || (val >= 10 && val <= 600))) {
      result.turnTimeSeconds = val;
    }
  }

  // autoDrawWhenBlocked
  if (s.autoDrawWhenBlocked !== undefined) {
    if (typeof s.autoDrawWhenBlocked === 'boolean') {
      result.autoDrawWhenBlocked = s.autoDrawWhenBlocked;
    }
  }

  return result;
}

// --- Per-event validators (returns early on failure) ---

export function validateCreateGameInput(playerName: unknown, settings: unknown): ValidationResult {
  const nameResult = validatePlayerName(playerName);
  if (!nameResult.success) return nameResult;

  // Settings are optional and merged with defaults — only validate if provided
  const s = settings;
  if (s != null && typeof s === 'object') {
    const rec = s as Record<string, unknown>;
    if (rec.maxPlayers !== undefined) {
      const val = Number(rec.maxPlayers);
      if (!(Number.isFinite(val) && val >= MIN_PLAYERS && val <= MAX_PLAYERS)) {
        return { success: false, error: 'Invalid maxPlayers setting' };
      }
    }
    if (rec.targetScore !== undefined) {
      const val = Number(rec.targetScore);
      if (!(Number.isFinite(val) && val >= 50 && val <= 500)) {
        return { success: false, error: 'Invalid targetScore setting' };
      }
    }
    if (rec.turnTimeSeconds !== undefined) {
      const val = Number(rec.turnTimeSeconds);
      if (!(Number.isFinite(val) && (val === 0 || (val >= 10 && val <= 600)))) {
        return { success: false, error: 'Invalid turnTimeSeconds setting' };
      }
    }
  }

  return { success: true };
}

export function validateJoinGameInput(joinCode: unknown, playerName: unknown): ValidationResult {
  const codeResult = validateJoinCode(joinCode);
  if (!codeResult.success) return codeResult;
  return validatePlayerName(playerName);
}

export function validateSpectateInput(joinCode: unknown): ValidationResult {
  return validateJoinCode(joinCode);
}

export function validateAddComputerInput(difficulty: unknown): ValidationResult {
  return validateDifficulty(difficulty);
}

export function validateRemoveComputerInput(playerId: unknown): ValidationResult {
  return validatePlayerId(playerId);
}

export function validateKickPlayerInput(playerId: unknown): ValidationResult {
  return validatePlayerId(playerId);
}

export function validatePlaceTileInput(tileId: unknown, end: unknown): ValidationResult {
  const tileResult = validateTileId(tileId);
  if (!tileResult.success) return tileResult;
  return validatePlacementEnd(end);
}