import { io, Socket } from 'socket.io-client';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  PlayerGameState, GameState, RoundResult, GameResult,
  GameNotification, AIDifficulty, PlacementEnd, GameSettings,
} from './types';

const RECONNECT_KEY = 'domino_session';

interface SessionData {
  gameId: string;
  playerId: string;
  playerName: string;
}

function saveSession(data: SessionData) {
  try {
    sessionStorage.setItem(RECONNECT_KEY, JSON.stringify(data));
  } catch {}
}

function loadSession(): SessionData | null {
  try {
    const raw = sessionStorage.getItem(RECONNECT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function clearSession() {
  try {
    sessionStorage.removeItem(RECONNECT_KEY);
  } catch {}
}

export type AppScreen = 'home' | 'lobby' | 'game' | 'spectator';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [screen, setScreen] = useState<AppScreen>('home');
  const [gameState, setGameState] = useState<PlayerGameState | null>(null);
  const [spectatorState, setSpectatorState] = useState<GameState | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [notifications, setNotifications] = useState<GameNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [turnTimer, setTurnTimer] = useState<number | null>(null);
  const [nextRoundLoading, setNextRoundLoading] = useState(false);

  useEffect(() => {
    const socket = io({
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Try to reconnect to existing game
      const session = loadSession();
      if (session) {
        socket.emit('game:reconnect', {
          gameId: session.gameId,
          playerId: session.playerId,
        }, (res: { success: boolean; error?: string }) => {
          if (res.success) {
            setPlayerId(session.playerId);
            setScreen('game');
          } else {
            clearSession();
          }
        });
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('game:state', (state: PlayerGameState) => {
      setGameState(state);
      if (state.phase === 'lobby') setScreen('lobby');
      else if (state.phase === 'playing') {
        setScreen('game');
        setRoundResult(null); // Clear round overlay when new round actually starts
        setNextRoundLoading(false);
      }
      else if (state.phase === 'round-summary') setScreen('game');
      else if (state.phase === 'game-over') setScreen('game');
    });

    socket.on('game:spectatorState', (state: GameState) => {
      setSpectatorState(state);
      setScreen('spectator');
    });

    socket.on('game:roundResult', (result: RoundResult) => {
      setRoundResult(result);
    });

    socket.on('game:gameResult', (result: GameResult) => {
      setGameResult(result);
    });

    socket.on('game:notification', (notification: GameNotification) => {
      setNotifications(prev => [...prev.slice(-99), notification]);
    });

    socket.on('game:error', (message: string) => {
      setError(message);
    });

    socket.on('game:turnTimer', (data: { remainingSeconds: number }) => {
      setTurnTimer(data.remainingSeconds);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createGame = useCallback((playerName: string, settings: Partial<GameSettings>) => {
    socketRef.current?.emit('game:create', { playerName, settings }, (res: any) => {
      if (res.success) {
        setPlayerId(res.playerId);
        saveSession({ gameId: res.gameId, playerId: res.playerId, playerName });
      } else {
        setError(res.error);
      }
    });
  }, []);

  const joinGame = useCallback((joinCode: string, playerName: string) => {
    socketRef.current?.emit('game:join', { joinCode, playerName }, (res: any) => {
      if (res.success) {
        setPlayerId(res.playerId);
        saveSession({ gameId: res.gameId, playerId: res.playerId, playerName });
      } else {
        setError(res.error);
      }
    });
  }, []);

  const spectateGame = useCallback((joinCode: string) => {
    socketRef.current?.emit('game:spectate', { joinCode }, (res: any) => {
      if (!res.success) {
        setError(res.error);
      }
    });
  }, []);

  const addComputer = useCallback((difficulty: AIDifficulty) => {
    socketRef.current?.emit('game:addComputer', { difficulty }, (res: any) => {
      if (!res.success) setError(res.error);
    });
  }, []);

  const removeComputer = useCallback((id: string) => {
    socketRef.current?.emit('game:removeComputer', { playerId: id }, (res: any) => {
      if (!res.success) setError(res.error);
    });
  }, []);

  const kickPlayer = useCallback((id: string) => {
    socketRef.current?.emit('game:kickPlayer', { playerId: id }, (res: any) => {
      if (!res.success) setError(res.error);
    });
  }, []);

  const startGame = useCallback(() => {
    socketRef.current?.emit('game:start', (res: any) => {
      if (!res.success) setError(res.error);
    });
  }, []);

  const placeTile = useCallback((tileId: string, end: PlacementEnd) => {
    socketRef.current?.emit('game:placeTile', { tileId, end }, (res: any) => {
      if (!res.success) setError(res.error);
    });
  }, []);

  const drawTile = useCallback(() => {
    socketRef.current?.emit('game:draw', (res: any) => {
      if (!res.success) setError(res.error);
    });
  }, []);

  const passTurn = useCallback(() => {
    socketRef.current?.emit('game:pass', (res: any) => {
      if (!res.success) setError(res.error);
    });
  }, []);

  const leaveGame = useCallback(() => {
    socketRef.current?.emit('game:leave');
    clearSession();
    setGameState(null);
    setSpectatorState(null);
    setRoundResult(null);
    setGameResult(null);
    setNotifications([]);
    setPlayerId(null);
    setTurnTimer(null);
    setScreen('home');
  }, []);

  const nextRound = useCallback(() => {
    setNextRoundLoading(true);
    socketRef.current?.emit('game:nextRound');
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    connected,
    screen,
    gameState,
    spectatorState,
    roundResult,
    gameResult,
    notifications,
    error,
    playerId,
    turnTimer,
    nextRoundLoading,
    createGame,
    joinGame,
    spectateGame,
    addComputer,
    removeComputer,
    kickPlayer,
    startGame,
    placeTile,
    drawTile,
    passTurn,
    leaveGame,
    nextRound,
    clearError,
  };
}
