import React, { useState } from 'react';
import { GameSettings } from './types';
import { useI18n } from './i18n';
import LanguageSwitcher from './LanguageSwitcher';

interface HomeScreenProps {
  onCreateGame: (playerName: string, settings: Partial<GameSettings>) => void;
  onJoinGame: (joinCode: string, playerName: string) => void;
  onSpectate: (joinCode: string) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onCreateGame, onJoinGame, onSpectate }) => {
  const { t } = useI18n();
  const [playerName, setPlayerName] = useState(() => {
    try { return localStorage.getItem('domino_name') || ''; } catch { return ''; }
  });
  const [joinCode, setJoinCode] = useState('');
  const [targetScore, setTargetScore] = useState(100);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [turnTime, setTurnTime] = useState(30);
  const [validationError, setValidationError] = useState<string | null>(null);

  const saveName = (name: string) => {
    setPlayerName(name);
    setValidationError(null);
    try { localStorage.setItem('domino_name', name); } catch {};
  };

  const handleCreate = () => {
    if (!playerName.trim()) {
      setValidationError(t('home.nameRequired'));
      return;
    }
    onCreateGame(playerName.trim(), {
      targetScore,
      maxPlayers,
      turnTimeSeconds: turnTime,
    });
  };

  const handleJoin = () => {
    if (!playerName.trim()) {
      setValidationError(t('home.nameRequired'));
      return;
    }
    if (!joinCode.trim()) {
      setValidationError(t('home.codeRequired'));
      return;
    }
    onJoinGame(joinCode.trim().toUpperCase(), playerName.trim());
  };

  const handleSpectate = () => {
    if (!joinCode.trim()) {
      setValidationError(t('home.codeRequired'));
      return;
    }
    onSpectate(joinCode.trim().toUpperCase());
  };

  return (
    <div className="home-screen">
      <LanguageSwitcher className="on-home" />
      <h1 className="home-title">{t('home.title')}</h1>
      <p className="home-subtitle">{t('home.subtitle')}</p>

      <div className="home-card" style={{ marginBottom: 0 }}>
        <div className="form-group">
          <label>{t('home.yourName')}</label>
          <input
            type="text"
            value={playerName}
            onChange={e => saveName(e.target.value)}
            placeholder={t('home.namePlaceholder')}
            maxLength={20}
          />
        </div>
      </div>

      <div className="home-card">
        <h2>{t('home.createGame')}</h2>
        <div className="settings-grid">
          <div>
            <label>{t('home.targetScore')}</label>
            <select value={targetScore} onChange={e => setTargetScore(Number(e.target.value))}>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={150}>150</option>
              <option value={200}>200</option>
            </select>
          </div>
          <div>
            <label>{t('home.maxPlayers')}</label>
            <select value={maxPlayers} onChange={e => setMaxPlayers(Number(e.target.value))}>
              {[2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{n} {t('home.players')}</option>
              ))}
            </select>
          </div>
          <div>
            <label>{t('home.turnTimer')}</label>
            <select value={turnTime} onChange={e => setTurnTime(Number(e.target.value))}>
              <option value={30}>30 {t('home.sec')}</option>
              <option value={60}>60 {t('home.sec')}</option>
              <option value={90}>90 {t('home.sec')}</option>
              <option value={0}>{t('home.unlimited')}</option>
            </select>
          </div>
        </div>
        <button className="btn-primary" style={{ width: '100%' }} onClick={handleCreate}>
          {t('home.createBtn')}
        </button>
      </div>

      <div className="divider">{t('home.orJoin')}</div>

      <div className="join-row">
        <input
          type="text"
          value={joinCode}
          onChange={e => { setJoinCode(e.target.value.toUpperCase()); setValidationError(null); }}
          placeholder={t('home.codePlaceholder')}
          maxLength={6}
          style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}
        />
        <button className="btn-primary" onClick={handleJoin}>{t('home.joinBtn')}</button>
        <button className="btn-secondary" onClick={handleSpectate} title="Watch the game">👁</button>
      </div>

      {validationError && (
        <div style={{ color: '#d32f2f', fontSize: 13, textAlign: 'center', marginTop: 8 }}>
          {validationError}
        </div>
      )}
    </div>
  );
};

export default HomeScreen;
