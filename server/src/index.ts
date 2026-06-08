import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { GameManager } from './GameManager';
import { socketLimiter } from './socketLimiter';
import {
  validateCreateGameInput,
  validateJoinGameInput,
  validateSpectateInput,
  validateAddComputerInput,
  validateRemoveComputerInput,
  validateKickPlayerInput,
  validatePlaceTileInput,
  validateGameId,
  validatePlayerId,
} from './validation';

const PORT = parseInt(process.env.PORT || '3002', 10);
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 10000,
  pingInterval: 5000,
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many requests, please try again later.',
});
app.use(limiter);
app.use(cors());

// Serve static client files in production
const clientPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientPath));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Game Manager
const gameManager = new GameManager({
  emitToGame: (gameId, event, data) => {
    io.to(gameId).emit(event, data);
  },
  emitToSocket: (socketId, event, data) => {
    io.to(socketId).emit(event, data);
  },
  joinRoom: (socketId, room) => {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) socket.join(room);
  },
  leaveRoom: (socketId, room) => {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) socket.leave(room);
  },
});

// Helper: check rate limit and return early if exceeded
function checkRateLimit(socketId: string, callback?: (err: any) => void): boolean {
  const result = socketLimiter.allow(socketId);
  if (!result) {
    console.warn(`[rateLimit] Socket ${socketId} exceeded event limit`);
    if (callback) callback({ success: false, error: 'Too many requests. Please wait a moment.' });
    return false;
  }
  return true;
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  if (LOG_LEVEL === 'debug') {
    console.log(`Socket connected: ${socket.id}`);
  }

  socket.on('game:create', (data, callback) => {
    if (!checkRateLimit(socket.id, callback)) return;
    const v = validateCreateGameInput(data?.playerName, data?.settings);
    if (!v.success) return callback({ success: false, error: v.error });
    try {
      const result = gameManager.createGame(socket.id, data.playerName, data.settings || {});
      callback(result);
    } catch (err) {
      console.error('Error creating game:', err);
      callback({ success: false, error: 'Internal error' });
    }
  });

  socket.on('game:join', (data, callback) => {
    if (!checkRateLimit(socket.id, callback)) return;
    const v = validateJoinGameInput(data?.joinCode, data?.playerName);
    if (!v.success) return callback({ success: false, error: v.error });
    try {
      const result = gameManager.joinGame(socket.id, data.joinCode, data.playerName);
      callback(result);
    } catch (err) {
      console.error('Error joining game:', err);
      callback({ success: false, error: 'Internal error' });
    }
  });

  socket.on('game:spectate', (data, callback) => {
    if (!checkRateLimit(socket.id, callback)) return;
    const v = validateSpectateInput(data?.joinCode);
    if (!v.success) return callback({ success: false, error: v.error });
    try {
      const result = gameManager.spectateGame(socket.id, data.joinCode);
      callback(result);
    } catch (err) {
      console.error('Error spectating game:', err);
      callback({ success: false, error: 'Internal error' });
    }
  });

  socket.on('game:addComputer', (data, callback) => {
    if (!checkRateLimit(socket.id, callback)) return;
    const v = validateAddComputerInput(data?.difficulty);
    if (!v.success) return callback({ success: false, error: v.error });
    try {
      const result = gameManager.addComputer(socket.id, data.difficulty);
      callback(result);
    } catch (err) {
      console.error('Error adding computer:', err);
      callback({ success: false, error: 'Internal error' });
    }
  });

  socket.on('game:removeComputer', (data, callback) => {
    if (!checkRateLimit(socket.id, callback)) return;
    const v = validateRemoveComputerInput(data?.playerId);
    if (!v.success) return callback({ success: false, error: v.error });
    try {
      const result = gameManager.removeComputer(socket.id, data.playerId);
      callback(result);
    } catch (err) {
      console.error('Error removing computer:', err);
      callback({ success: false, error: 'Internal error' });
    }
  });

  socket.on('game:kickPlayer', (data, callback) => {
    if (!checkRateLimit(socket.id, callback)) return;
    const v = validateKickPlayerInput(data?.playerId);
    if (!v.success) return callback({ success: false, error: v.error });
    try {
      const result = gameManager.kickPlayer(socket.id, data.playerId);
      callback(result);
    } catch (err) {
      console.error('Error kicking player:', err);
      callback({ success: false, error: 'Internal error' });
    }
  });

  socket.on('game:start', (callback) => {
    if (!checkRateLimit(socket.id, callback)) return;
    try {
      const result = gameManager.startGame(socket.id);
      callback(result);
    } catch (err) {
      console.error('Error starting game:', err);
      callback({ success: false, error: 'Internal error' });
    }
  });

  socket.on('game:placeTile', (data, callback) => {
    if (!checkRateLimit(socket.id, callback)) return;
    const v = validatePlaceTileInput(data?.tileId, data?.end);
    if (!v.success) return callback({ success: false, error: v.error });
    try {
      const result = gameManager.placeTile(socket.id, data.tileId, data.end);
      callback(result);
    } catch (err) {
      console.error('Error placing tile:', err);
      callback({ success: false, error: 'Internal error' });
    }
  });

  socket.on('game:draw', (callback) => {
    if (!checkRateLimit(socket.id, callback)) return;
    try {
      const result = gameManager.draw(socket.id);
      callback(result);
    } catch (err) {
      console.error('Error drawing tile:', err);
      callback({ success: false, error: 'Internal error' });
    }
  });

  socket.on('game:pass', (callback) => {
    if (!checkRateLimit(socket.id, callback)) return;
    try {
      const result = gameManager.pass(socket.id);
      callback(result);
    } catch (err) {
      console.error('Error passing turn:', err);
      callback({ success: false, error: 'Internal error' });
    }
  });

  socket.on('game:leave', () => {
    if (!checkRateLimit(socket.id)) return;
    try {
      gameManager.leaveGame(socket.id);
    } catch (err) {
      console.error('Error leaving game:', err);
    }
  });

  socket.on('game:reconnect', (data, callback) => {
    if (!checkRateLimit(socket.id, callback)) return;
    const gv = validateGameId(data?.gameId);
    if (!gv.success) return callback({ success: false, error: gv.error });
    const pv = validatePlayerId(data?.playerId);
    if (!pv.success) return callback({ success: false, error: pv.error });
    try {
      const result = gameManager.reconnect(socket.id, data.gameId, data.playerId);
      callback(result);
    } catch (err) {
      console.error('Error reconnecting:', err);
      callback({ success: false, error: 'Internal error' });
    }
  });

  socket.on('game:nextRound', () => {
    if (!checkRateLimit(socket.id)) return;
    try {
      gameManager.nextRound(socket.id);
    } catch (err) {
      console.error('Error advancing round:', err);
    }
  });

  socket.on('disconnect', () => {
    if (LOG_LEVEL === 'debug') {
      console.log(`Socket disconnected: ${socket.id}`);
    }
    try {
      gameManager.handleDisconnect(socket.id);
    } catch (err) {
      console.error('Error handling disconnect:', err);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Domino server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  gameManager.shutdown();
  server.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  gameManager.shutdown();
  server.close();
  process.exit(0);
});
