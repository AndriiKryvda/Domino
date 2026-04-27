import React, { useState } from 'react';
import { PlayerGameState, PlacementEnd, RoundResult, GameResult, GameNotification } from './types';
import { useI18n } from './i18n';
import LanguageSwitcher from './LanguageSwitcher';
import DominoTile from './DominoTile';
import ActivityLog from './ActivityLog';
import SnakeBoard from './SnakeBoard';

interface GameBoardProps {
  gameState: PlayerGameState;
  playerId: string;
  turnTimer: number | null;
  roundResult: RoundResult | null;
  gameResult: GameResult | null;
  onPlaceTile: (tileId: string, end: PlacementEnd) => void;
  onDraw: () => void;
  onPass: () => void;
  onLeave: () => void;
  onNextRound: () => void;
  nextRoundLoading: boolean;
  notifications: GameNotification[];
}

const GameBoard: React.FC<GameBoardProps> = ({
  gameState, playerId, turnTimer, roundResult, gameResult,
  onPlaceTile, onDraw, onPass, onLeave, onNextRound, nextRoundLoading, notifications,
}) => {
  const { t } = useI18n();
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);

  const me = gameState.players.find(p => p.id === playerId);
  const isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === playerId;
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  const selectedTileMoves = selectedTileId
    ? gameState.validMoves.filter(m => m.tileId === selectedTileId)
    : [];

  const canPlayLeft = selectedTileMoves.some(m => m.end === 'left');
  const canPlayRight = selectedTileMoves.some(m => m.end === 'right');
  const hasValidMoves = gameState.validMoves.length > 0;
  const canDraw = !hasValidMoves && gameState.boneyardCount > 0;
  const canPass = isMyTurn && !hasValidMoves && gameState.boneyardCount === 0;

  const handleTileClick = (tileId: string) => {
    if (!isMyTurn || gameState.phase !== 'playing') return;

    const moves = gameState.validMoves.filter(m => m.tileId === tileId);
    if (moves.length === 0) return;

    // Auto-play if only one valid end, or if it's the last tile in hand (round ends anyway)
    if (moves.length === 1 || gameState.hand.length === 1) {
      onPlaceTile(tileId, moves[0].end);
      setSelectedTileId(null);
    } else {
      // Can play on both ends — select and let user choose
      setSelectedTileId(tileId);
    }
  };

  const handleEndClick = (end: PlacementEnd) => {
    if (selectedTileId) {
      onPlaceTile(selectedTileId, end);
      setSelectedTileId(null);
    }
  };

  return (
    <div className="game-screen">
      {/* Header */}
      <div className="game-header">
        <div className="game-header-left">
          <span className="round-badge">{t('game.round')} {gameState.roundNumber}</span>
          <div className="boneyard-indicator">
            <div className="boneyard-icon" />
            <span>{gameState.boneyardCount}</span>
          </div>
          {gameState.spectatorCount > 0 && (
            <span style={{ opacity: 0.7 }}>👁 {gameState.spectatorCount}</span>
          )}
        </div>
        <div className="game-header-right">
          {turnTimer !== null && gameState.phase === 'playing' && (
            <span className={`timer-badge${turnTimer <= 10 ? ' urgent' : ''}`}>
              {turnTimer}s
            </span>
          )}
          <LanguageSwitcher />
          <button className="btn-danger btn-small" onClick={onLeave}>{t('game.leave')}</button>
        </div>
      </div>

      {/* Scoreboard */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 8px', background: 'rgba(0,0,0,0.2)' }}>
        <div className="scoreboard">
          {gameState.players.map((p, i) => (
            <span
              key={p.id}
              className={`score-item${i === gameState.currentPlayerIndex ? ' current' : ''}${p.id === playerId ? ' is-me' : ''}`}
            >
              {p.name}: {p.score} ({p.tileCount})
            </span>
          ))}
        </div>
      </div>

      {/* Board */}
      <div className="board-area">
        <ActivityLog notifications={notifications} />
        {gameState.board.length === 0 ? (
          <div className="board-container">
            <span className="board-empty-message">
              {isMyTurn ? t('game.playTileToStart') : `${t('game.waitingFor')} ${currentPlayer?.name}...`}
            </span>
          </div>
        ) : (
          <SnakeBoard
            board={gameState.board}
            leftMarker={selectedTileId && canPlayLeft ? (
              <div className="end-marker" onClick={() => handleEndClick('left')}>
                <span className="end-marker-label">←</span>
              </div>
            ) : undefined}
            rightMarker={selectedTileId && canPlayRight ? (
              <div className="end-marker" onClick={() => handleEndClick('right')}>
                <span className="end-marker-label">→</span>
              </div>
            ) : undefined}
          />
        )}
      </div>

      {/* Turn indicator */}
      {gameState.phase === 'playing' && (
        <div style={{
          textAlign: 'center',
          padding: '4px',
          background: isMyTurn ? 'var(--accent)' : 'rgba(0,0,0,0.3)',
          color: 'white',
          fontSize: 13,
          fontWeight: 600,
        }}>
          {isMyTurn ? t('game.yourTurn') : `${currentPlayer?.name}${t('game.playerTurn')}`}
        </div>
      )}

      {/* Player hand */}
      <div className="hand-area">
        <div className="hand-info">
          <span>{t('game.yourHand')} ({gameState.hand.length} {t('game.tiles')})</span>
          {isMyTurn && !hasValidMoves && canDraw && (
            <span style={{ color: 'var(--warning)' }}>{t('game.noMovesDraw')}</span>
          )}
          {isMyTurn && !hasValidMoves && !canDraw && gameState.boneyardCount === 0 && (
            <span style={{ color: 'var(--warning)' }}>{t('game.noMovesPass')}</span>
          )}
        </div>
        <div className="hand-tiles">
          {gameState.hand.map(tile => {
            const isPlayable = isMyTurn && gameState.validMoves.some(m => m.tileId === tile.id);
            const isDisabled = isMyTurn && !isPlayable;
            return (
              <DominoTile
                key={tile.id}
                tile={tile}
                selected={selectedTileId === tile.id}
                playable={isPlayable}
                disabled={isDisabled}
                onClick={() => isPlayable ? handleTileClick(tile.id) : undefined}
              />
            );
          })}
        </div>
        {isMyTurn && canDraw && (
          <div className="hand-actions">
            <button className="btn-secondary" onClick={onDraw}>
              {t('game.drawBoneyard')} ({gameState.boneyardCount} {t('game.left')})
            </button>
          </div>
        )}
        {canPass && (
          <div className="hand-actions">
            <button className="btn-primary" onClick={onPass}>
              {t('game.passTurn')}
            </button>
          </div>
        )}
      </div>

      {/* Round Summary Overlay */}
      {roundResult && gameState.phase === 'round-summary' && (
        <div className="overlay">
          <div className="overlay-card">
            <h2>
              {roundResult.winnerName
                ? `${roundResult.winnerName} ${t('game.winsRound')}`
                : t('game.roundDraw')}
            </h2>
            {roundResult.pointsScored > 0 && (
              <p style={{ textAlign: 'center', marginBottom: 16, color: 'var(--accent)', fontWeight: 700, fontSize: 18 }}>
                +{roundResult.pointsScored} {t('game.points')}
              </p>
            )}
            <table className="result-table">
              <thead>
                <tr>
                  <th>{t('game.player')}</th>
                  <th>{t('game.remaining')}</th>
                  <th>{t('game.pips')}</th>
                  <th>{t('game.totalScore')}</th>
                </tr>
              </thead>
              <tbody>
                {roundResult.playerResults.map(r => (
                  <tr key={r.playerId} className={r.playerId === roundResult.winnerId ? 'winner' : ''}>
                    <td>{r.playerName}{r.playerId === playerId ? ` ${t('lobby.you')}` : ''}</td>
                    <td>{r.remainingTiles.length} {t('game.tiles')}</td>
                    <td>{r.pipCount}</td>
                    <td style={{ fontWeight: 700 }}>{r.totalScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="overlay-actions">
              <button className="btn-primary" onClick={onNextRound} disabled={nextRoundLoading}>
                {nextRoundLoading ? t('game.starting') : t('game.nextRound')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameResult && (
        <div className="overlay">
          <div className="overlay-card">
            <h2>🏆 {gameResult.winnerName} {t('game.wins')}</h2>
            <table className="result-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('game.player')}</th>
                  <th>{t('game.score')}</th>
                </tr>
              </thead>
              <tbody>
                {gameResult.playerResults.map(r => (
                  <tr key={r.playerId} className={r.rank === 1 ? 'winner' : ''}>
                    <td>{r.rank}</td>
                    <td>{r.playerName}{r.playerId === playerId ? ` ${t('lobby.you')}` : ''}</td>
                    <td style={{ fontWeight: 700 }}>{r.finalScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="overlay-actions">
              <button className="btn-primary" onClick={onLeave}>{t('game.backHome')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
