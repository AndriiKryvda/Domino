import { Game } from './Game';
import { AIDifficulty, GameSettings, IDLE_TIMEOUT_MINUTES } from './types';

interface SocketMapping {
  gameId: string;
  playerId: string;
  isSpectator: boolean;
}

export class GameManager {
  private games: Map<string, Game> = new Map(); // gameId -> Game
  private joinCodes: Map<string, string> = new Map(); // joinCode -> gameId
  private socketMap: Map<string, SocketMapping> = new Map(); // socketId -> mapping

  private emitToGame: (gameId: string, event: string, data: any) => void;
  private emitToSocket: (socketId: string, event: string, data: any) => void;
  private joinRoom: (socketId: string, room: string) => void;
  private leaveRoom: (socketId: string, room: string) => void;

  private idleChecker: NodeJS.Timeout;

  constructor(io: {
    emitToGame: (gameId: string, event: string, data: any) => void;
    emitToSocket: (socketId: string, event: string, data: any) => void;
    joinRoom: (socketId: string, room: string) => void;
    leaveRoom: (socketId: string, room: string) => void;
  }) {
    this.emitToGame = io.emitToGame;
    this.emitToSocket = io.emitToSocket;
    this.joinRoom = io.joinRoom;
    this.leaveRoom = io.leaveRoom;

    // Periodically clean up idle games
    this.idleChecker = setInterval(() => this.cleanupIdleGames(), 60 * 1000);
  }

  createGame(socketId: string, playerName: string, settings: Partial<GameSettings>): { success: boolean; gameId?: string; joinCode?: string; playerId?: string; error?: string } {
    const game = new Game(playerName, socketId, settings, {
      onStateChange: () => this.broadcastState(game.id),
      onNotify: (n) => this.emitToGame(game.id, 'game:notification', n),
      onRoundEnd: (r) => this.emitToGame(game.id, 'game:roundResult', r),
      onGameEnd: (r) => this.emitToGame(game.id, 'game:gameResult', r),
      onTurnTimer: (s) => this.emitToGame(game.id, 'game:turnTimer', { remainingSeconds: s }),
      onAbandoned: () => this.handleAbandoned(game.id),
    });

    this.games.set(game.id, game);
    this.joinCodes.set(game.joinCode, game.id);

    const playerId = game.players[0].id;
    this.socketMap.set(socketId, { gameId: game.id, playerId, isSpectator: false });
    this.joinRoom(socketId, game.id);

    this.broadcastState(game.id);

    return { success: true, gameId: game.id, joinCode: game.joinCode, playerId };
  }

  joinGame(socketId: string, joinCode: string, playerName: string): { success: boolean; gameId?: string; playerId?: string; error?: string } {
    const gameId = this.joinCodes.get(joinCode.toUpperCase());
    if (!gameId) return { success: false, error: 'Game not found' };

    const game = this.games.get(gameId);
    if (!game) return { success: false, error: 'Game not found' };

    const result = game.addPlayer(playerName, socketId);
    if (!result.success) return result;

    this.socketMap.set(socketId, { gameId, playerId: result.playerId!, isSpectator: false });
    this.joinRoom(socketId, gameId);

    return { success: true, gameId, playerId: result.playerId };
  }

  spectateGame(socketId: string, joinCode: string): { success: boolean; error?: string } {
    const gameId = this.joinCodes.get(joinCode.toUpperCase());
    if (!gameId) return { success: false, error: 'Game not found' };

    const game = this.games.get(gameId);
    if (!game) return { success: false, error: 'Game not found' };

    game.spectatorSockets.add(socketId);
    this.socketMap.set(socketId, { gameId, playerId: '', isSpectator: true });
    this.joinRoom(socketId, gameId);

    // Send spectator state
    this.emitToSocket(socketId, 'game:spectatorState', game.getPublicState());
    // Also broadcast updated spectator count
    this.broadcastState(gameId);

    return { success: true };
  }

  addComputer(socketId: string, difficulty: AIDifficulty): { success: boolean; error?: string } {
    const mapping = this.socketMap.get(socketId);
    if (!mapping || mapping.isSpectator) return { success: false, error: 'Not in a game' };

    const game = this.games.get(mapping.gameId);
    if (!game) return { success: false, error: 'Game not found' };

    return game.addComputer(difficulty, mapping.playerId);
  }

  removeComputer(socketId: string, playerId: string): { success: boolean; error?: string } {
    const mapping = this.socketMap.get(socketId);
    if (!mapping || mapping.isSpectator) return { success: false, error: 'Not in a game' };

    const game = this.games.get(mapping.gameId);
    if (!game) return { success: false, error: 'Game not found' };

    return game.removeComputer(playerId, mapping.playerId);
  }

  kickPlayer(socketId: string, playerId: string): { success: boolean; error?: string } {
    const mapping = this.socketMap.get(socketId);
    if (!mapping || mapping.isSpectator) return { success: false, error: 'Not in a game' };

    const game = this.games.get(mapping.gameId);
    if (!game) return { success: false, error: 'Game not found' };

    return game.kickPlayer(playerId, mapping.playerId);
  }

  startGame(socketId: string): { success: boolean; error?: string } {
    const mapping = this.socketMap.get(socketId);
    if (!mapping || mapping.isSpectator) return { success: false, error: 'Not in a game' };

    const game = this.games.get(mapping.gameId);
    if (!game) return { success: false, error: 'Game not found' };

    return game.startGame(mapping.playerId);
  }

  placeTile(socketId: string, tileId: string, end: 'left' | 'right'): { success: boolean; error?: string } {
    const mapping = this.socketMap.get(socketId);
    if (!mapping || mapping.isSpectator) return { success: false, error: 'Not in a game' };

    const game = this.games.get(mapping.gameId);
    if (!game) return { success: false, error: 'Game not found' };

    return game.placeTileAction(mapping.playerId, tileId, end);
  }

  draw(socketId: string): { success: boolean; error?: string } {
    const mapping = this.socketMap.get(socketId);
    if (!mapping || mapping.isSpectator) return { success: false, error: 'Not in a game' };

    const game = this.games.get(mapping.gameId);
    if (!game) return { success: false, error: 'Game not found' };

    return game.drawTile(mapping.playerId);
  }

  pass(socketId: string): { success: boolean; error?: string } {
    const mapping = this.socketMap.get(socketId);
    if (!mapping || mapping.isSpectator) return { success: false, error: 'Not in a game' };

    const game = this.games.get(mapping.gameId);
    if (!game) return { success: false, error: 'Game not found' };

    return game.passTurn(mapping.playerId);
  }

  leaveGame(socketId: string) {
    const mapping = this.socketMap.get(socketId);
    if (!mapping) return;

    const game = this.games.get(mapping.gameId);
    if (!game) {
      this.socketMap.delete(socketId);
      return;
    }

    if (mapping.isSpectator) {
      game.spectatorSockets.delete(socketId);
      this.broadcastState(game.id);
    } else {
      game.removePlayer(mapping.playerId);
      if (game.players.length === 0) {
        this.destroyGame(game);
        this.leaveRoom(socketId, mapping.gameId);
        this.socketMap.delete(socketId);
        return;
      }
    }

    this.leaveRoom(socketId, mapping.gameId);
    this.socketMap.delete(socketId);

    // Check if game is abandoned (no humans connected as players or spectators)
    if (this.isGameAbandoned(game)) {
      this.destroyGame(game);
    }
  }

  handleDisconnect(socketId: string) {
    const mapping = this.socketMap.get(socketId);
    if (!mapping) return;

    const game = this.games.get(mapping.gameId);
    if (!game) {
      this.socketMap.delete(socketId);
      return;
    }

    if (mapping.isSpectator) {
      game.spectatorSockets.delete(socketId);
      this.broadcastState(game.id);
      this.socketMap.delete(socketId);

      // If no humans left at all, destroy
      if (this.isGameAbandoned(game)) {
        this.destroyGame(game);
      }
      return;
    }

    const player = game.handleDisconnect(socketId);
    if (player && game.phase === 'lobby') {
      game.removePlayer(player.id);
      if (game.players.length === 0) {
        this.destroyGame(game);
      }
    }
    // Don't delete socket mapping — needed for reconnect
    // Note: for in-game disconnects, the replaceWithComputer timer
    // will call onAbandoned if no humans remain after replacement.
  }

  reconnect(socketId: string, gameId: string, playerId: string): { success: boolean; error?: string } {
    const game = this.games.get(gameId);
    if (!game) return { success: false, error: 'Game not found' };

    const result = game.handleReconnect(playerId, socketId);
    if (result.success) {
      // Clean up old socketMap entry for this player
      for (const [oldSocketId, mapping] of this.socketMap.entries()) {
        if (mapping.playerId === playerId && oldSocketId !== socketId) {
          this.socketMap.delete(oldSocketId);
        }
      }
      this.socketMap.set(socketId, { gameId, playerId, isSpectator: false });
      this.joinRoom(socketId, gameId);
    }
    return result;
  }

  nextRound(socketId: string) {
    const mapping = this.socketMap.get(socketId);
    if (!mapping || mapping.isSpectator) return;

    const game = this.games.get(mapping.gameId);
    if (!game) return;

    game.nextRound();
  }

  private isGameAbandoned(game: Game): boolean {
    // Game is abandoned if no connected human players AND no spectators
    return !game.hasHumanPlayers() && game.spectatorSockets.size === 0;
  }

  private handleAbandoned(gameId: string) {
    const game = this.games.get(gameId);
    if (!game) return;
    if (this.isGameAbandoned(game)) {
      this.destroyGame(game);
    }
  }

  private broadcastState(gameId: string) {
    const game = this.games.get(gameId);
    if (!game) return;

    // Send personalized state to each player
    for (const player of game.players) {
      if (player.socketId && !player.isComputer) {
        const state = game.getPlayerState(player.id);
        if (state) {
          this.emitToSocket(player.socketId, 'game:state', state);
        }
      }
    }

    // Send public state to spectators
    const publicState = game.getPublicState();
    for (const spectatorSocket of game.spectatorSockets) {
      this.emitToSocket(spectatorSocket, 'game:spectatorState', publicState);
    }
  }

  private destroyGame(game: Game) {
    game.cleanup();
    this.joinCodes.delete(game.joinCode);
    this.games.delete(game.id);

    // Clean up socket mappings
    for (const [socketId, mapping] of this.socketMap.entries()) {
      if (mapping.gameId === game.id) {
        this.socketMap.delete(socketId);
      }
    }
  }

  private cleanupIdleGames() {
    const now = Date.now();
    const timeout = IDLE_TIMEOUT_MINUTES * 60 * 1000;

    for (const [, game] of this.games) {
      if (now - game.lastActivity > timeout) {
        this.emitToGame(game.id, 'game:notification', {
          type: 'game-ended',
          message: 'Game terminated due to inactivity',
        });
        this.destroyGame(game);
      }
    }
  }

  shutdown() {
    clearInterval(this.idleChecker);
    for (const [, game] of this.games) {
      game.cleanup();
    }
  }
}
