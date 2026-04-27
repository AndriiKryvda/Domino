import React from 'react';
import { GameState, GameNotification } from './types';
import { useI18n } from './i18n';
import LanguageSwitcher from './LanguageSwitcher';
import DominoTile from './DominoTile';
import ActivityLog from './ActivityLog';
import SnakeBoard from './SnakeBoard';

interface SpectatorViewProps {
  gameState: GameState;
  onLeave: () => void;
  notifications: GameNotification[];
}

const SpectatorView: React.FC<SpectatorViewProps> = ({ gameState, onLeave, notifications }) => {
  const { t } = useI18n();
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <div className="game-screen">
      <div className="spectator-banner">
        {t('spectator.banner')}
      </div>

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
              className={`score-item${i === gameState.currentPlayerIndex ? ' current' : ''}`}
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
              {gameState.phase === 'lobby'
                ? `${t('spectator.waitStart')}...`
                : `${t('game.waitingFor')} ${currentPlayer?.name}...`}
            </span>
          </div>
        ) : (
          <SnakeBoard board={gameState.board} />
        )}
      </div>

      {/* Turn indicator */}
      {gameState.phase === 'playing' && currentPlayer && (
        <div style={{
          textAlign: 'center',
          padding: '8px',
          background: 'rgba(0,0,0,0.3)',
          color: 'white',
          fontSize: 14,
          fontWeight: 600,
        }}>
          {currentPlayer.name}{t('game.playerTurn')}
        </div>
      )}

      {gameState.phase === 'lobby' && (
        <div style={{
          textAlign: 'center',
          padding: '16px',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 16,
        }}>
          {t('spectator.waitStart')} ({gameState.players.length} {t('spectator.playersInLobby')})
        </div>
      )}
    </div>
  );
};

export default SpectatorView;
