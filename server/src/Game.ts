import { v4 as uuidv4 } from 'uuid';
import {
  Tile, AIDifficulty, GamePhase, PlacementEnd, GameSettings, GameState,
  PlayerGameState, PlayerInfo, ValidMove, RoundResult, GameResult,
  DEFAULT_SETTINGS, MIN_PLAYERS, MAX_PLAYERS, RECONNECT_GRACE_SECONDS,
} from './types';
import {
  dealTiles, findStartingPlayer, getValidMoves, placeTile, totalPipCount,
} from './gameLogic';
import { computeAIMove } from './ai';

function generateJoinCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

interface InternalPlayer {
  id: string;
  name: string;
  isComputer: boolean;
  aiDifficulty?: AIDifficulty;
  isHost: boolean;
  isConnected: boolean;
  socketId: string | null;
  hand: Tile[];
  score: number;
  disconnectTimer?: NodeJS.Timeout;
}

export class Game {
  id: string;
  joinCode: string;
  phase: GamePhase = 'lobby';
  settings: GameSettings;
  players: InternalPlayer[] = [];
  currentPlayerIndex: number = 0;
  board: Tile[] = [];
  boardLeftEnd: number = 0;
  boardRightEnd: number = 0;
  boneyard: Tile[] = [];
  roundNumber: number = 0;
  spectatorSockets: Set<string> = new Set();
  turnTimer: NodeJS.Timeout | null = null;
  turnStartedAt: number | null = null;
  lastActivity: number = Date.now();
  roundStarterIndex: number = -1;

  private onStateChange: () => void;
  private onNotify: (notification: { type: string; message: string; playerId?: string; playerName?: string; data?: Record<string, unknown> }) => void;
  private onRoundEnd: (result: RoundResult) => void;
  private onGameEnd: (result: GameResult) => void;
  private onTurnTimer: (seconds: number) => void;
  private onAbandoned: () => void;

  constructor(
    hostName: string,
    hostSocketId: string,
    settings: Partial<GameSettings>,
    callbacks: {
      onStateChange: () => void;
      onNotify: (notification: { type: string; message: string; playerId?: string; playerName?: string; data?: Record<string, unknown> }) => void;
      onRoundEnd: (result: RoundResult) => void;
      onGameEnd: (result: GameResult) => void;
      onTurnTimer: (seconds: number) => void;
      onAbandoned: () => void;
    }
  ) {
    this.id = uuidv4();
    this.joinCode = generateJoinCode();
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.onStateChange = callbacks.onStateChange;
    this.onNotify = callbacks.onNotify;
    this.onRoundEnd = callbacks.onRoundEnd;
    this.onGameEnd = callbacks.onGameEnd;
    this.onTurnTimer = callbacks.onTurnTimer;
    this.onAbandoned = callbacks.onAbandoned;

    const hostPlayer: InternalPlayer = {
      id: uuidv4(),
      name: this.sanitizeName(hostName),
      isComputer: false,
      isHost: true,
      isConnected: true,
      socketId: hostSocketId,
      hand: [],
      score: 0,
    };
    this.players.push(hostPlayer);
  }

  private sanitizeName(name: string): string {
    // Strip HTML tags and limit length
    return name.replace(/<[^>]*>/g, '').trim().substring(0, 20) || 'Player';
  }

  touch() {
    this.lastActivity = Date.now();
  }

  // --- Lobby actions ---

  addPlayer(name: string, socketId: string): { success: boolean; playerId?: string; error?: string } {
    if (this.phase !== 'lobby') return { success: false, error: 'Game already started' };
    if (this.players.length >= this.settings.maxPlayers) return { success: false, error: 'Game is full' };

    const player: InternalPlayer = {
      id: uuidv4(),
      name: this.sanitizeName(name),
      isComputer: false,
      isHost: false,
      isConnected: true,
      socketId,
      hand: [],
      score: 0,
    };
    this.players.push(player);
    this.touch();
    this.onNotify({ type: 'player-joined', message: `${player.name} joined the game`, playerId: player.id, playerName: player.name });
    this.onStateChange();
    return { success: true, playerId: player.id };
  }

  addComputer(difficulty: AIDifficulty, requesterId: string): { success: boolean; error?: string } {
    if (this.phase !== 'lobby') return { success: false, error: 'Game already started' };
    const requester = this.players.find(p => p.id === requesterId);
    if (!requester?.isHost) return { success: false, error: 'Only host can add computers' };
    if (this.players.length >= this.settings.maxPlayers) return { success: false, error: 'Game is full' };

    const computerNames = ['Bot Alice', 'Bot Bob', 'Bot Carol', 'Bot Dave', 'Bot Eve', 'Bot Frank'];
    const usedNames = new Set(this.players.map(p => p.name));
    const name = computerNames.find(n => !usedNames.has(n)) || `Bot ${this.players.length + 1}`;

    const player: InternalPlayer = {
      id: uuidv4(),
      name,
      isComputer: true,
      aiDifficulty: difficulty,
      isHost: false,
      isConnected: true,
      socketId: null,
      hand: [],
      score: 0,
    };
    this.players.push(player);
    this.touch();
    this.onStateChange();
    return { success: true };
  }

  removeComputer(playerId: string, requesterId: string): { success: boolean; error?: string } {
    if (this.phase !== 'lobby') return { success: false, error: 'Game already started' };
    const requester = this.players.find(p => p.id === requesterId);
    if (!requester?.isHost) return { success: false, error: 'Only host can remove computers' };
    const target = this.players.find(p => p.id === playerId);
    if (!target?.isComputer) return { success: false, error: 'Player is not a computer' };

    this.players = this.players.filter(p => p.id !== playerId);
    this.touch();
    this.onStateChange();
    return { success: true };
  }

  kickPlayer(playerId: string, requesterId: string): { success: boolean; error?: string } {
    if (this.phase !== 'lobby') return { success: false, error: 'Game already started' };
    const requester = this.players.find(p => p.id === requesterId);
    if (!requester?.isHost) return { success: false, error: 'Only host can kick players' };
    const target = this.players.find(p => p.id === playerId);
    if (!target || target.isHost) return { success: false, error: 'Cannot kick this player' };

    this.players = this.players.filter(p => p.id !== playerId);
    this.touch();
    this.onNotify({ type: 'player-left', message: `${target.name} was removed`, playerId: target.id, playerName: target.name });
    this.onStateChange();
    return { success: true };
  }

  // --- Game start ---

  startGame(requesterId: string): { success: boolean; error?: string } {
    const requester = this.players.find(p => p.id === requesterId);
    if (!requester?.isHost) return { success: false, error: 'Only host can start the game' };
    if (this.phase !== 'lobby') return { success: false, error: 'Game already started' };
    if (this.players.length < MIN_PLAYERS) return { success: false, error: `Need at least ${MIN_PLAYERS} players` };

    this.startRound();
    return { success: true };
  }

  private startRound() {
    this.roundNumber++;
    this.phase = 'playing';
    this.board = [];
    this.boardLeftEnd = 0;
    this.boardRightEnd = 0;

    const { hands, boneyard } = dealTiles(this.players.length);
    this.boneyard = boneyard;
    for (let i = 0; i < this.players.length; i++) {
      this.players[i].hand = hands[i];
    }

    // First round: highest double starts. Later rounds: previous round winner
    if (this.roundStarterIndex === -1) {
      this.currentPlayerIndex = findStartingPlayer(hands);
    } else {
      this.currentPlayerIndex = this.roundStarterIndex;
    }

    this.touch();
    this.onNotify({ type: 'round-started', message: `Round ${this.roundNumber} started`, data: { roundNumber: this.roundNumber } });
    this.onStateChange();
    this.startTurnTimer();
    this.scheduleComputerMoveIfNeeded();
  }

  // --- Turn management ---

  private startTurnTimer() {
    this.clearTurnTimer();
    this.turnStartedAt = Date.now();

    if (this.settings.turnTimeSeconds <= 0) return;

    let remaining = this.settings.turnTimeSeconds;
    this.onTurnTimer(remaining);

    this.turnTimer = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        this.clearTurnTimer();
        this.handleTimeout();
      } else {
        this.onTurnTimer(remaining);
      }
    }, 1000);
  }

  private clearTurnTimer() {
    if (this.turnTimer) {
      clearInterval(this.turnTimer);
      this.turnTimer = null;
    }
    this.turnStartedAt = null;
  }

  private handleTimeout() {
    const player = this.players[this.currentPlayerIndex];
    this.onNotify({ type: 'turn-passed', message: `${player.name}'s turn timed out`, playerId: player.id, playerName: player.name });

    const validMoves = getValidMoves(player.hand, this.boardLeftEnd, this.boardRightEnd, this.board.length === 0);

    if (validMoves.length > 0) {
      // Auto-play: pick the best move using AI heuristics
      const opponentCounts = this.players
        .filter(p => p.id !== player.id)
        .map(p => p.hand.length);
      const aiMove = computeAIMove(
        player.hand, this.boardLeftEnd, this.boardRightEnd,
        this.board.length === 0, 'medium', opponentCounts
      );
      if (aiMove) {
        this.placeTileAction(player.id, aiMove.tileId, aiMove.end);
      } else {
        this.placeTileAction(player.id, validMoves[0].tileId, validMoves[0].end);
      }
    } else if (this.boneyard.length > 0) {
      // No valid moves — draw a tile, then auto-play if possible
      this.autoDrawAndPlay(player);
    } else {
      // No valid moves and no boneyard — pass
      this.advanceTurn();
    }
  }

  private autoDrawAndPlay(player: InternalPlayer) {
    if (this.boneyard.length === 0) {
      this.advanceTurn();
      return;
    }

    const drawnTile = this.boneyard.pop()!;
    player.hand.push(drawnTile);
    this.onNotify({ type: 'tile-drawn', message: `${player.name} drew a tile`, playerId: player.id, playerName: player.name });

    const validMoves = getValidMoves(player.hand, this.boardLeftEnd, this.boardRightEnd, this.board.length === 0);
    if (validMoves.length > 0) {
      const opponentCounts = this.players
        .filter(p => p.id !== player.id)
        .map(p => p.hand.length);
      const aiMove = computeAIMove(
        player.hand, this.boardLeftEnd, this.boardRightEnd,
        this.board.length === 0, 'medium', opponentCounts
      );
      if (aiMove) {
        this.placeTileAction(player.id, aiMove.tileId, aiMove.end);
      } else {
        this.placeTileAction(player.id, validMoves[0].tileId, validMoves[0].end);
      }
    } else {
      // Drawn tile is not playable — pass
      this.advanceTurn();
    }
  }

  private advanceTurn() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;

    // Check if round is blocked (no one can play and boneyard empty)
    if (this.isRoundBlocked()) {
      this.endRound();
      return;
    }

    this.touch();
    this.onStateChange();
    this.startTurnTimer();
    this.scheduleComputerMoveIfNeeded();
  }

  private isRoundBlocked(): boolean {
    if (this.boneyard.length > 0) return false;
    return this.players.every(p => {
      const moves = getValidMoves(p.hand, this.boardLeftEnd, this.boardRightEnd, this.board.length === 0);
      return moves.length === 0;
    });
  }

  private scheduleComputerMoveIfNeeded() {
    const current = this.players[this.currentPlayerIndex];
    if (!current.isComputer && current.isConnected) return;

    // Check if the bot/disconnected player must pass (no moves, empty boneyard)
    const validMoves = getValidMoves(current.hand, this.boardLeftEnd, this.boardRightEnd, this.board.length === 0);
    if (validMoves.length === 0 && this.boneyard.length === 0) {
      // Pass immediately — no reason to wait
      setTimeout(() => this.makeComputerMove(current), 200);
      return;
    }

    // Artificial delay for natural feel
    setTimeout(() => this.makeComputerMove(current), 1000 + Math.random() * 1000);
  }

  private makeComputerMove(player: InternalPlayer) {
    if (this.phase !== 'playing') return;
    if (this.players[this.currentPlayerIndex]?.id !== player.id) return;

    const validMoves = getValidMoves(player.hand, this.boardLeftEnd, this.boardRightEnd, this.board.length === 0);

    if (validMoves.length === 0) {
      if (this.boneyard.length > 0) {
        this.drawTile(player.id);
      } else {
        this.onNotify({ type: 'turn-passed', message: `${player.name} passed`, playerId: player.id, playerName: player.name });
        this.advanceTurn();
      }
      return;
    }

    const difficulty = player.aiDifficulty || 'medium';
    const opponentCounts = this.players
      .filter(p => p.id !== player.id)
      .map(p => p.hand.length);

    const aiMove = computeAIMove(
      player.hand,
      this.boardLeftEnd,
      this.boardRightEnd,
      this.board.length === 0,
      difficulty,
      opponentCounts
    );

    if (aiMove) {
      this.placeTileAction(player.id, aiMove.tileId, aiMove.end);
    } else if (this.boneyard.length > 0) {
      this.drawTile(player.id);
    } else {
      this.onNotify({ type: 'turn-passed', message: `${player.name} passed`, playerId: player.id, playerName: player.name });
      this.advanceTurn();
    }
  }

  // --- Player actions ---

  placeTileAction(playerId: string, tileId: string, end: PlacementEnd): { success: boolean; error?: string } {
    if (this.phase !== 'playing') return { success: false, error: 'Game not in play' };
    const playerIdx = this.players.findIndex(p => p.id === playerId);
    if (playerIdx === -1) return { success: false, error: 'Player not found' };
    if (playerIdx !== this.currentPlayerIndex) return { success: false, error: 'Not your turn' };

    const player = this.players[playerIdx];
    const tile = player.hand.find(t => t.id === tileId);
    if (!tile) return { success: false, error: 'Tile not in hand' };

    const validMoves = getValidMoves(player.hand, this.boardLeftEnd, this.boardRightEnd, this.board.length === 0);
    const isValid = validMoves.some(m => m.tileId === tileId && m.end === end);
    if (!isValid) return { success: false, error: 'Invalid move' };

    this.clearTurnTimer();

    const result = placeTile(tile, end, this.board, this.boardLeftEnd, this.boardRightEnd);
    this.board = result.board;
    this.boardLeftEnd = result.boardLeftEnd;
    this.boardRightEnd = result.boardRightEnd;

    player.hand = player.hand.filter(t => t.id !== tileId);

    this.onNotify({ type: 'tile-placed', message: `${player.name} played [${tile.left}|${tile.right}]`, playerId: player.id, playerName: player.name, data: { tileLeft: tile.left, tileRight: tile.right } });

    // Check if player wins the round
    if (player.hand.length === 0) {
      this.endRound(playerIdx);
      return { success: true };
    }

    this.advanceTurn();
    return { success: true };
  }

  passTurn(playerId: string): { success: boolean; error?: string } {
    if (this.phase !== 'playing') return { success: false, error: 'Game not in play' };
    const playerIdx = this.players.findIndex(p => p.id === playerId);
    if (playerIdx === -1) return { success: false, error: 'Player not found' };
    if (playerIdx !== this.currentPlayerIndex) return { success: false, error: 'Not your turn' };

    const player = this.players[playerIdx];
    const validMoves = getValidMoves(player.hand, this.boardLeftEnd, this.boardRightEnd, this.board.length === 0);
    if (validMoves.length > 0) return { success: false, error: 'You have valid moves' };
    if (this.boneyard.length > 0) return { success: false, error: 'You must draw from the boneyard first' };

    this.clearTurnTimer();
    this.onNotify({ type: 'turn-passed', message: `${player.name} passed`, playerId: player.id, playerName: player.name });
    this.advanceTurn();
    return { success: true };
  }

  drawTile(playerId: string): { success: boolean; error?: string } {
    if (this.phase !== 'playing') return { success: false, error: 'Game not in play' };
    const playerIdx = this.players.findIndex(p => p.id === playerId);
    if (playerIdx === -1) return { success: false, error: 'Player not found' };
    if (playerIdx !== this.currentPlayerIndex) return { success: false, error: 'Not your turn' };
    if (this.boneyard.length === 0) return { success: false, error: 'Boneyard is empty' };

    const player = this.players[playerIdx];
    const drawnTile = this.boneyard.pop()!;
    player.hand.push(drawnTile);

    this.onNotify({ type: 'tile-drawn', message: `${player.name} drew a tile`, playerId: player.id, playerName: player.name });

    // Check if drawn tile can be played
    const validMoves = getValidMoves(player.hand, this.boardLeftEnd, this.boardRightEnd, this.board.length === 0);
    if (validMoves.length > 0) {
      // If computer or disconnected human, auto-play
      if (player.isComputer || !player.isConnected) {
        setTimeout(() => this.makeComputerMove(player), 500 + Math.random() * 500);
        this.onStateChange();
        return { success: true };
      }
      // Human player gets to choose
      this.onStateChange();
      return { success: true };
    }

    // Can't play the drawn tile, pass turn
    this.advanceTurn();
    return { success: true };
  }

  // --- Round / Game end ---

  private endRound(winnerIndex?: number) {
    this.clearTurnTimer();
    this.phase = 'round-summary';

    let winnerId: string | null = null;
    let winnerName: string | null = null;

    if (winnerIndex !== undefined) {
      winnerId = this.players[winnerIndex].id;
      winnerName = this.players[winnerIndex].name;
    } else {
      // Blocked game: lowest pip total wins
      let minPips = Infinity;
      let minIdx = -1;
      let tie = false;
      for (let i = 0; i < this.players.length; i++) {
        const pips = totalPipCount(this.players[i].hand);
        if (pips < minPips) {
          minPips = pips;
          minIdx = i;
          tie = false;
        } else if (pips === minPips) {
          tie = true;
        }
      }
      if (!tie && minIdx >= 0) {
        winnerId = this.players[minIdx].id;
        winnerName = this.players[minIdx].name;
        winnerIndex = minIdx;
      }
    }

    // Calculate points
    let pointsScored = 0;
    if (winnerId) {
      for (const p of this.players) {
        if (p.id !== winnerId) {
          pointsScored += totalPipCount(p.hand);
        }
      }
      const winner = this.players.find(p => p.id === winnerId)!;
      winner.score += pointsScored;
      this.roundStarterIndex = winnerIndex!;
    }

    const roundResult: RoundResult = {
      winnerId,
      winnerName,
      pointsScored,
      playerResults: this.players.map(p => ({
        playerId: p.id,
        playerName: p.name,
        remainingTiles: [...p.hand],
        pipCount: totalPipCount(p.hand),
        totalScore: p.score,
      })),
    };

    this.touch();
    this.onNotify({ type: 'round-ended', message: winnerName ? `${winnerName} won the round (+${pointsScored} pts)` : 'Round ended in a draw', playerName: winnerName || undefined, data: { pointsScored } });
    this.onStateChange();
    this.onRoundEnd(roundResult);

    // Check if anyone reached target score
    const gameWinner = this.players.find(p => p.score >= this.settings.targetScore);
    if (gameWinner) {
      this.endGame(gameWinner);
    }
  }

  private endGame(winner: InternalPlayer) {
    this.phase = 'game-over';
    this.clearTurnTimer();

    const sorted = [...this.players].sort((a, b) => b.score - a.score);
    const result: GameResult = {
      winnerId: winner.id,
      winnerName: winner.name,
      playerResults: sorted.map((p, i) => ({
        playerId: p.id,
        playerName: p.name,
        finalScore: p.score,
        rank: i + 1,
      })),
    };

    this.onNotify({ type: 'game-ended', message: `${winner.name} won the game!`, playerName: winner.name });
    this.onStateChange();
    this.onGameEnd(result);
  }

  nextRound() {
    if (this.phase !== 'round-summary') return;
    // Check if game should have ended
    const gameWinner = this.players.find(p => p.score >= this.settings.targetScore);
    if (gameWinner) {
      this.endGame(gameWinner);
      return;
    }
    this.startRound();
  }

  // --- Player disconnect / reconnect ---

  handleDisconnect(socketId: string): InternalPlayer | null {
    const player = this.players.find(p => p.socketId === socketId && !p.isComputer);
    if (!player) return null;

    player.isConnected = false;
    player.socketId = null;
    this.onNotify({ type: 'player-disconnected', message: `${player.name} disconnected`, playerId: player.id, playerName: player.name });

    // Start grace period
    player.disconnectTimer = setTimeout(() => {
      this.replaceWithComputer(player);
    }, RECONNECT_GRACE_SECONDS * 1000);

    this.onStateChange();

    // If it's this player's turn and they're disconnected, let computer play
    if (this.phase === 'playing' && this.players[this.currentPlayerIndex]?.id === player.id) {
      this.scheduleComputerMoveIfNeeded();
    }

    // Check if all humans are gone
    const humanPlayers = this.players.filter(p => !p.isComputer);
    if (humanPlayers.every(p => !p.isConnected)) {
      // If in lobby, just remove disconnected players
      if (this.phase === 'lobby') {
        return player;
      }
      // In game: leave timers running, game will auto-terminate via idle timeout
    }

    return player;
  }

  handleReconnect(playerId: string, socketId: string): { success: boolean; error?: string } {
    const player = this.players.find(p => p.id === playerId && !p.isComputer);
    if (!player) return { success: false, error: 'Player not found or has been replaced' };
    if (player.isConnected) return { success: false, error: 'Player is already connected' };

    // Clear disconnect timer
    if (player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
      player.disconnectTimer = undefined;
    }

    player.isConnected = true;
    player.socketId = socketId;

    this.onNotify({ type: 'player-reconnected', message: `${player.name} reconnected`, playerId: player.id, playerName: player.name });
    this.onStateChange();
    return { success: true };
  }

  private replaceWithComputer(player: InternalPlayer) {
    player.isComputer = true;
    player.aiDifficulty = 'medium';
    player.isConnected = true;
    player.name = `Bot (${player.name})`;
    player.disconnectTimer = undefined;

    this.onNotify({ type: 'computer-replaced', message: `${player.name} is now controlled by computer`, playerId: player.id, playerName: player.name });
    this.onStateChange();

    // If it's this player's turn, make a computer move
    if (this.phase === 'playing' && this.players[this.currentPlayerIndex]?.id === player.id) {
      this.scheduleComputerMoveIfNeeded();
    }

    // If no human players remain, notify manager to clean up
    if (!this.hasHumanPlayers()) {
      this.onAbandoned();
    }
  }

  removePlayer(playerId: string) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return;

    if (player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
    }

    if (this.phase === 'lobby') {
      this.players = this.players.filter(p => p.id !== playerId);
      // If host left, assign new host
      if (player.isHost && this.players.length > 0) {
        const newHost = this.players.find(p => !p.isComputer) || this.players[0];
        newHost.isHost = true;
      }
    } else {
      // During game, replace with computer
      this.replaceWithComputer(player);
    }

    this.onNotify({ type: 'player-left', message: `${player.name} left the game`, playerId: player.id, playerName: player.name });
    this.onStateChange();
  }

  // --- State getters ---

  getPlayerState(playerId: string): PlayerGameState | null {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return null;

    const validMoves = this.phase === 'playing' && this.players[this.currentPlayerIndex]?.id === playerId
      ? getValidMoves(player.hand, this.boardLeftEnd, this.boardRightEnd, this.board.length === 0)
      : [];

    return {
      ...this.getPublicState(),
      hand: player.hand,
      validMoves,
    };
  }

  getPublicState(): GameState {
    return {
      gameId: this.id,
      joinCode: this.joinCode,
      phase: this.phase,
      settings: this.settings,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        isComputer: p.isComputer,
        aiDifficulty: p.aiDifficulty,
        isHost: p.isHost,
        isConnected: p.isConnected,
        tileCount: p.hand.length,
        score: p.score,
      })),
      currentPlayerIndex: this.currentPlayerIndex,
      board: this.board,
      boardLeftEnd: this.boardLeftEnd,
      boardRightEnd: this.boardRightEnd,
      boneyardCount: this.boneyard.length,
      roundNumber: this.roundNumber,
      spectatorCount: this.spectatorSockets.size,
      turnStartedAt: this.turnStartedAt,
    };
  }

  hasHumanPlayers(): boolean {
    return this.players.some(p => !p.isComputer && p.isConnected);
  }

  cleanup() {
    this.clearTurnTimer();
    for (const player of this.players) {
      if (player.disconnectTimer) {
        clearTimeout(player.disconnectTimer);
      }
    }
  }
}
