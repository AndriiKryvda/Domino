import React, { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useI18n } from './i18n';
import HomeScreen from './HomeScreen';
import LobbyScreen from './LobbyScreen';
import GameBoard from './GameBoard';
import SpectatorView from './SpectatorView';

const App: React.FC = () => {
  const { t } = useI18n();
  const {
    connected, screen, gameState, spectatorState,
    roundResult, gameResult, notifications, error,
    playerId, turnTimer, nextRoundLoading,
    createGame, joinGame, spectateGame,
    addComputer, removeComputer, kickPlayer,
    startGame, placeTile, drawTile, passTurn,
    leaveGame, nextRound, clearError,
  } = useSocket();

  // Handle URL join code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      // Remove code from URL to avoid re-joining
      window.history.replaceState({}, '', window.location.pathname);
      // Pre-fill will be handled by the home screen
    }
  }, []);

  return (
    <>
      {!connected && (
        <div className="connection-status">
          {t('connection.reconnecting')}
        </div>
      )}

      {screen === 'home' && (
        <HomeScreen
          onCreateGame={createGame}
          onJoinGame={joinGame}
          onSpectate={spectateGame}
        />
      )}

      {screen === 'lobby' && gameState && playerId && (
        <LobbyScreen
          gameState={gameState}
          playerId={playerId}
          onAddComputer={addComputer}
          onRemoveComputer={removeComputer}
          onKickPlayer={kickPlayer}
          onStartGame={startGame}
          onLeave={leaveGame}
        />
      )}

      {(screen === 'game') && gameState && playerId && (
        <GameBoard
          gameState={gameState}
          playerId={playerId}
          turnTimer={turnTimer}
          roundResult={roundResult}
          gameResult={gameResult}
          onPlaceTile={placeTile}
          onDraw={drawTile}
          onPass={passTurn}
          onLeave={leaveGame}
          onNextRound={nextRound}
          nextRoundLoading={nextRoundLoading}
          notifications={notifications}
        />
      )}

      {screen === 'spectator' && spectatorState && (
        <SpectatorView
          gameState={spectatorState}
          onLeave={leaveGame}
          notifications={notifications}
        />
      )}

      {/* Error toast */}
      {error && (
        <div className="error-toast" onClick={clearError}>
          {error}
        </div>
      )}
    </>
  );
};

export default App;
