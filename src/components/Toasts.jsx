'use client';

import { useGame } from '../state/GameContext';

export default function Toasts() {
  const { notifications } = useGame();
  return (
    <div className="toast-container" aria-live="polite">
      {notifications.map((n) => (
        <div key={n.id} className={`toast-notification ${n.type}`}>
          {n.type === 'success' && <span className="toast-icon success">✓</span>}
          {n.type === 'error' && <span className="toast-icon error">✕</span>}
          <span>{n.text}</span>
        </div>
      ))}
    </div>
  );
}
