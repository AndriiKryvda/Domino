import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameNotification } from './types';
import { useI18n } from './i18n';

interface ActivityLogProps {
  notifications: GameNotification[];
}

const iconMap: Record<string, string> = {
  'player-joined': '➕',
  'player-left': '➖',
  'player-disconnected': '⚡',
  'player-reconnected': '🔄',
  'your-turn': '👉',
  'round-started': '🎲',
  'round-ended': '🏁',
  'game-ended': '🏆',
  'tile-placed': '🁣',
  'tile-drawn': '📥',
  'turn-passed': '⏭',
  'computer-replaced': '🤖',
};

function useTranslatedMessage() {
  const { t } = useI18n();
  return (n: GameNotification): { text: string; playerName?: string } => {
    const name = n.playerName || '';
    const data = n.data || {};
    let key = `notif.${n.type}`;

    // Special cases
    if (n.type === 'round-ended') {
      key = n.playerName ? 'notif.round-ended-win' : 'notif.round-ended-draw';
    } else if (n.type === 'turn-passed' && n.message.includes('timed out')) {
      key = 'notif.turn-passed-timeout';
    } else if (n.type === 'player-left' && n.message.includes('removed')) {
      key = 'notif.player-left-removed';
    }

    const text = t(key, { name, ...data as Record<string, string | number> });
    // If translation key wasn't found (returns the key itself), fall back to server message
    if (text === key) return { text: n.message, playerName: n.playerName };
    return { text, playerName: n.playerName };
  };
}

function RenderMessage({ text, playerName }: { text: string; playerName?: string }) {
  if (playerName && text.includes(playerName)) {
    const idx = text.indexOf(playerName);
    const before = text.slice(0, idx);
    const after = text.slice(idx + playerName.length);
    return <>{before}<strong>{playerName}</strong>{after}</>;
  }
  return <>{text}</>;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ notifications }) => {
  const [collapsed, setCollapsed] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const { t } = useI18n();
  const translateMsg = useTranslatedMessage();

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [notifications]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.activity-log-drag-handle')) return;

    e.preventDefault();
    const rect = containerRef.current!.getBoundingClientRect();
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: rect.left,
      origY: rect.top,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setPos({ x: dragState.current.origX + dx, y: dragState.current.origY + dy });
  }, []);

  const onPointerUp = useCallback(() => {
    dragState.current = null;
  }, []);

  const posStyle = pos
    ? { position: 'fixed' as const, left: pos.x, top: pos.y, right: 'auto' as const }
    : {};

  return (
    <div
      className={`activity-log${collapsed ? ' collapsed' : ''}`}
      ref={containerRef}
      style={posStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="activity-log-header">
        <span className="activity-log-drag-handle" title="Drag to move">⠿</span>
        <span className="activity-log-title" onClick={() => setCollapsed(c => !c)}>
          {t('log.title')} ({notifications.length})
        </span>
        <span className="activity-log-toggle" onClick={() => setCollapsed(c => !c)}>
          {collapsed ? '▲' : '▼'}
        </span>
      </div>
      {!collapsed && (
        <div className="activity-log-list" ref={listRef}>
          {notifications.length === 0 && (
            <div className="activity-log-empty">{t('log.empty')}</div>
          )}
          {notifications.map((n, i) => {
            const { text, playerName } = translateMsg(n);
            return (
              <div key={i} className="activity-log-item">
                <span className="activity-log-icon">{iconMap[n.type] || '•'}</span>
                <span className="activity-log-message">
                  <RenderMessage text={text} playerName={playerName} />
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
