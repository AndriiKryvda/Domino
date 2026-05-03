// Shared types for Domino game (used by both server and client)

export interface Tile {
  left: number;
  right: number;
  id: string; // e.g. "3-5"
}

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export type GamePhase = 'lobby' | 'playing' | 'round-summary' | 'game-over';

export type PlacementEnd = 'left' | 'right';

export interface PlayerInfo {
  id: string;
  name: string;
  isComputer: boolean;
  aiDifficulty?: AIDifficulty;
  isHost: boolean;
  isConnected: boolean;
  tileCount: number;
  score: number;
}

export interface GameSettings {
  targetScore: number;
  maxPlayers: number;
  turnTimeSeconds: number; // 0 = unlimited
  autoDrawWhenBlocked: boolean;
}

export interface GameState {
  gameId: string;
  joinCode: string;
  phase: GamePhase;
  settings: GameSettings;
  players: PlayerInfo[];
  currentPlayerIndex: number;
  board: Tile[];
  boardLeftEnd: number;
  boardRightEnd: number;
  boneyardCount: number;
  roundNumber: number;
  spectatorCount: number;
  turnStartedAt: number | null;
}

export interface PlayerGameState extends GameState {
  hand: Tile[];
  validMoves: ValidMove[];
}

export interface ValidMove {
  tileId: string;
  end: PlacementEnd;
}

export interface RoundResult {
  winnerId: string | null; // null if draw
  winnerName: string | null;
  pointsScored: number;
  playerResults: {
    playerId: string;
    playerName: string;
    remainingTiles: Tile[];
    pipCount: number;
    totalScore: number;
  }[];
}

export interface GameResult {
  winnerId: string;
  winnerName: string;
  playerResults: {
    playerId: string;
    playerName: string;
    finalScore: number;
    rank: number;
  }[];
}

// Socket.IO event types
export interface ServerToClientEvents {
  'game:state': (state: PlayerGameState) => void;
  'game:spectatorState': (state: GameState) => void;
  'game:roundResult': (result: RoundResult) => void;
  'game:gameResult': (result: GameResult) => void;
  'game:error': (message: string) => void;
  'game:notification': (notification: GameNotification) => void;
  'game:turnTimer': (data: { remainingSeconds: number }) => void;
}

export interface ClientToServerEvents {
  'game:create': (data: { playerName: string; settings: Partial<GameSettings> }, callback: (res: { success: boolean; gameId?: string; joinCode?: string; playerId?: string; error?: string }) => void) => void;
  'game:join': (data: { joinCode: string; playerName: string }, callback: (res: { success: boolean; gameId?: string; playerId?: string; error?: string }) => void) => void;
  'game:spectate': (data: { joinCode: string }, callback: (res: { success: boolean; error?: string }) => void) => void;
  'game:addComputer': (data: { difficulty: AIDifficulty }, callback: (res: { success: boolean; error?: string }) => void) => void;
  'game:removeComputer': (data: { playerId: string }, callback: (res: { success: boolean; error?: string }) => void) => void;
  'game:kickPlayer': (data: { playerId: string }, callback: (res: { success: boolean; error?: string }) => void) => void;
  'game:start': (callback: (res: { success: boolean; error?: string }) => void) => void;
  'game:placeTile': (data: { tileId: string; end: PlacementEnd }, callback: (res: { success: boolean; error?: string }) => void) => void;
  'game:draw': (callback: (res: { success: boolean; error?: string }) => void) => void;
  'game:pass': (callback: (res: { success: boolean; error?: string }) => void) => void;
  'game:leave': () => void;
  'game:reconnect': (data: { gameId: string; playerId: string }, callback: (res: { success: boolean; error?: string }) => void) => void;
  'game:nextRound': () => void;
}

export interface GameNotification {
  type: 'player-joined' | 'player-left' | 'player-disconnected' | 'player-reconnected' |
        'your-turn' | 'round-started' | 'round-ended' | 'game-ended' |
        'tile-placed' | 'tile-drawn' | 'turn-passed' | 'computer-replaced';
  message: string;
  playerId?: string;
  playerName?: string;
  data?: Record<string, unknown>;
}

export const DEFAULT_SETTINGS: GameSettings = {
  targetScore: 100,
  maxPlayers: 4,
  turnTimeSeconds: 30,
  autoDrawWhenBlocked: false,
};

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 5;
export const RECONNECT_GRACE_SECONDS = 60;
export const IDLE_TIMEOUT_MINUTES = 30;
