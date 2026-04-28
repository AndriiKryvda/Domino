import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type Lang = 'en' | 'uk';

const STORAGE_KEY = 'domino_lang';

function loadLang(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'uk') return 'uk';
  } catch {}
  return 'en';
}

const translations = {
  // Home screen
  'home.title': { en: '🁣 Domino', uk: '🁣 Доміно' },
  'home.subtitle': { en: 'Multiplayer card & board game', uk: 'Мультиплеєрна настільна гра' },
  'home.createGame': { en: 'Create a Game', uk: 'Створити гру' },
  'home.yourName': { en: 'Your Name', uk: "Ваше ім'я" },
  'home.namePlaceholder': { en: 'Enter your name', uk: "Введіть ваше ім'я" },
  'home.targetScore': { en: 'Target Score', uk: 'Цільовий рахунок' },
  'home.maxPlayers': { en: 'Max Players', uk: 'Макс. гравців' },
  'home.turnTimer': { en: 'Turn Timer', uk: 'Таймер ходу' },
  'home.players': { en: 'players', uk: 'гравців' },
  'home.sec': { en: 'sec', uk: 'сек' },
  'home.unlimited': { en: 'Unlimited', uk: 'Без обмежень' },
  'home.createBtn': { en: 'Create Game', uk: 'Створити гру' },
  'home.orJoin': { en: 'or join an existing game', uk: 'або приєднатися до існуючої гри' },
  'home.codePlaceholder': { en: 'Enter game code', uk: 'Введіть код гри' },
  'home.joinBtn': { en: 'Join', uk: 'Увійти' },
  'home.nameRequired': { en: 'Please enter your name first', uk: "Будь ласка, введіть ваше ім'я" },
  'home.codeRequired': { en: 'Please enter the game code', uk: 'Будь ласка, введіть код гри' },

  // Lobby screen
  'lobby.title': { en: 'Game Lobby', uk: 'Лобі гри' },
  'lobby.shareHint': { en: 'Share the code or click it to copy the invite link.', uk: 'Поділіться кодом або натисніть, щоб скопіювати посилання.' },
  'lobby.target': { en: 'Target', uk: 'Ціль' },
  'lobby.timer': { en: 'Timer', uk: 'Таймер' },
  'lobby.host': { en: 'Host', uk: 'Хост' },
  'lobby.offline': { en: 'Offline', uk: 'Офлайн' },
  'lobby.you': { en: '(you)', uk: '(ви)' },
  'lobby.remove': { en: 'Remove', uk: 'Видалити' },
  'lobby.kick': { en: 'Kick', uk: 'Вигнати' },
  'lobby.easyBot': { en: '+ Easy Bot', uk: '+ Легкий бот' },
  'lobby.mediumBot': { en: '+ Medium Bot', uk: '+ Середній бот' },
  'lobby.hardBot': { en: '+ Hard Bot', uk: '+ Складний бот' },
  'lobby.copyCode': { en: 'Copy Code', uk: 'Копіювати код' },
  'lobby.startGame': { en: 'Start Game', uk: 'Почати гру' },
  'lobby.needPlayers': { en: 'Need 2+ players', uk: 'Потрібно 2+ гравців' },
  'lobby.leave': { en: 'Leave', uk: 'Вийти' },
  'lobby.copied': { en: 'Copied!', uk: 'Скопійовано!' },
  'lobby.copyFailed': { en: 'Copy failed', uk: 'Не вдалося скопіювати' },

  // Game board
  'game.round': { en: 'Round', uk: 'Раунд' },
  'game.leave': { en: 'Leave', uk: 'Вийти' },
  'game.turnBeepOn': { en: 'Beep: On', uk: 'Сигнал: увімк.' },
  'game.turnBeepOff': { en: 'Beep: Off', uk: 'Сигнал: вимк.' },
  'game.yourTurn': { en: 'Your turn!', uk: 'Ваш хід!' },
  'game.playerTurn': { en: "'s turn", uk: ' ходить' },
  'game.playTileToStart': { en: 'Play a tile to start!', uk: 'Покладіть кістку, щоб почати!' },
  'game.waitingFor': { en: 'Waiting for', uk: 'Очікування на' },
  'game.yourHand': { en: 'Your hand', uk: 'Ваша рука' },
  'game.tiles': { en: 'tiles', uk: 'кісток' },
  'game.noMovesDraw': { en: 'No valid moves — draw a tile', uk: 'Немає ходів — візьміть кістку' },
  'game.noMovesPass': { en: 'No moves available — passing', uk: 'Немає ходів — пас' },
  'game.drawBoneyard': { en: 'Draw from Boneyard', uk: 'Взяти з базару' },
  'game.left': { en: 'left', uk: 'залишилось' },
  'game.passTurn': { en: 'Pass Turn', uk: 'Пас' },
  'game.winsRound': { en: 'wins the round!', uk: 'виграє раунд!' },
  'game.roundDraw': { en: 'Round ended in a draw', uk: 'Раунд закінчився нічиєю' },
  'game.points': { en: 'points', uk: 'очок' },
  'game.player': { en: 'Player', uk: 'Гравець' },
  'game.remaining': { en: 'Remaining', uk: 'Залишок' },
  'game.pips': { en: 'Pips', uk: 'Очки' },
  'game.totalScore': { en: 'Total Score', uk: 'Загальний рахунок' },
  'game.nextRound': { en: 'Next Round', uk: 'Наступний раунд' },
  'game.starting': { en: 'Starting...', uk: 'Починаємо...' },
  'game.wins': { en: 'wins!', uk: 'перемагає!' },
  'game.score': { en: 'Score', uk: 'Рахунок' },
  'game.backHome': { en: 'Back to Home', uk: 'На головну' },

  // Spectator
  'spectator.banner': { en: 'Spectating — you are watching this game', uk: 'Перегляд — ви спостерігаєте за грою' },
  'spectator.waitStart': { en: 'Game has not started yet', uk: 'Гра ще не почалася' },
  'spectator.playersInLobby': { en: 'players in lobby', uk: 'гравців в лобі' },

  // Activity log
  'log.title': { en: 'Activity Log', uk: 'Журнал подій' },
  'log.empty': { en: 'No activity yet', uk: 'Поки нема подій' },

  // Connection
  'connection.reconnecting': { en: 'Reconnecting to server...', uk: "З'єднання з сервером..." },

  // Notifications (client-side translation)
  'notif.player-joined': { en: '{name} joined the game', uk: '{name} приєднався до гри' },
  'notif.player-left': { en: '{name} left the game', uk: '{name} вийшов з гри' },
  'notif.player-left-removed': { en: '{name} was removed', uk: '{name} був видалений' },
  'notif.player-disconnected': { en: '{name} disconnected', uk: "{name} від'єднався" },
  'notif.player-reconnected': { en: '{name} reconnected', uk: "{name} під'єднався" },
  'notif.computer-replaced': { en: '{name} is now controlled by computer', uk: "{name} тепер під керуванням комп'ютера" },
  'notif.round-started': { en: 'Round {roundNumber} started', uk: 'Раунд {roundNumber} почався' },
  'notif.tile-placed': { en: '{name} played [{tileLeft}|{tileRight}]', uk: '{name} поклав [{tileLeft}|{tileRight}]' },
  'notif.tile-drawn': { en: '{name} drew a tile', uk: '{name} взяв кістку' },
  'notif.turn-passed': { en: '{name} passed', uk: '{name} — пас' },
  'notif.turn-passed-timeout': { en: "{name}'s turn timed out", uk: 'У {name} вийшов час' },
  'notif.round-ended-win': { en: '{name} won the round (+{pointsScored} pts)', uk: '{name} виграв раунд (+{pointsScored} очок)' },
  'notif.round-ended-draw': { en: 'Round ended in a draw', uk: 'Раунд закінчився нічиєю' },
  'notif.game-ended': { en: '{name} won the game!', uk: '{name} виграв гру!' },
} as const;

type TranslationKey = keyof typeof translations;

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, params?: Record<string, string | number | undefined>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(loadLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number | undefined>): string => {
    const entry = translations[key as TranslationKey];
    let text = entry ? (entry[lang] || entry.en) : key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n() {
  return useContext(I18nContext);
}
