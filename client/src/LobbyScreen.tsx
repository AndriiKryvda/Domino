import React, { useState } from 'react';
import { PlayerGameState, AIDifficulty } from './types';
import { useI18n } from './i18n';
import LanguageSwitcher from './LanguageSwitcher';

interface LobbyScreenProps {
  gameState: PlayerGameState;
  playerId: string;
  onAddComputer: (difficulty: AIDifficulty) => void;
  onRemoveComputer: (id: string) => void;
  onKickPlayer: (id: string) => void;
  onStartGame: () => void;
  onLeave: () => void;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({
  gameState, playerId, onAddComputer, onRemoveComputer, onKickPlayer, onStartGame, onLeave,
}) => {
  const { t } = useI18n();
  const me = gameState.players.find(p => p.id === playerId);
  const isHost = me?.isHost ?? false;
  const canStart = gameState.players.length >= 2;
  const canAdd = gameState.players.length < gameState.settings.maxPlayers;
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(gameState.joinCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <div className="lobby-screen">
      <div className="lobby-card">
        <div className="lobby-header">
          <h2>{t('lobby.title')}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="join-code" onClick={copyCode} title="Click to copy code">
              {gameState.joinCode}
            </div>
            {copied && <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{t('lobby.copied')}</span>}
            <LanguageSwitcher />
          </div>
        </div>

        <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
          {t('lobby.shareHint')}{' '}
          {t('lobby.target')}: {gameState.settings.targetScore} pts &middot; {t('lobby.timer')}: {gameState.settings.turnTimeSeconds || '∞'}s
        </p>

        <ul className="player-list">
          {gameState.players.map(player => (
            <li key={player.id} className="player-item">
              <span className="player-name">
                {player.name}
                {player.isHost && <span className="player-badge badge-host">{t('lobby.host')}</span>}
                {player.isComputer && <span className="player-badge badge-computer">CPU ({player.aiDifficulty})</span>}
                {!player.isConnected && <span className="player-badge badge-disconnected">{t('lobby.offline')}</span>}
                {player.id === playerId && <span style={{ fontSize: 12, color: '#999' }}>{t('lobby.you')}</span>}
              </span>
              <span>
                {isHost && player.isComputer && (
                  <button className="btn-danger btn-small" onClick={() => onRemoveComputer(player.id)}>
                    {t('lobby.remove')}
                  </button>
                )}
                {isHost && !player.isComputer && !player.isHost && (
                  <button className="btn-danger btn-small" onClick={() => onKickPlayer(player.id)}>
                    {t('lobby.kick')}
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>

        <div className="lobby-actions">
          {isHost && canAdd && (
            <>
              <button className="btn-secondary btn-small" onClick={() => onAddComputer('easy')}>{t('lobby.easyBot')}</button>
              <button className="btn-secondary btn-small" onClick={() => onAddComputer('medium')}>{t('lobby.mediumBot')}</button>
              <button className="btn-secondary btn-small" onClick={() => onAddComputer('hard')}>{t('lobby.hardBot')}</button>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          {isHost && (
            <button
              className="btn-primary"
              style={{ flex: 1 }}
              onClick={onStartGame}
              disabled={!canStart}
            >
              {canStart ? t('lobby.startGame') : t('lobby.needPlayers')}
            </button>
          )}
          <button className="btn-danger" onClick={onLeave}>
            {t('lobby.leave')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LobbyScreen;
