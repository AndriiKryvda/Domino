// Client-side type definitions (mirroring server types)

export interface Tile {
  left: number;
  right: number;
  id: string;
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
  turnTimeSeconds: number;
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
  winnerId: string | null;
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

export interface GameNotification {
  type: string;
  message: string;
  playerId?: string;
  playerName?: string;
  data?: Record<string, unknown>;
}
