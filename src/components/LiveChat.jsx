'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useGame } from '../state/GameContext';
import { shortAddr } from '../lib/constants';

function ChatIcon() {
  return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>);
}
function SendIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>);
}

// Simulated city chat. Message transport is local (NPC bot loop in
// GameContext) — swap `sendChat` for a websocket publish to go live.
export default function LiveChat() {
  const { t, lang, chat, sendChat, chatOnline } = useGame();
  const { address } = useAccount();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [seenCount, setSeenCount] = useState(0);
  const bodyRef = useRef(null);

  // Unread badge is derived: messages that arrived since the panel was last open.
  const unread = open ? 0 : Math.min(9, Math.max(0, chat.length - seenCount));

  const toggleOpen = () => {
    setSeenCount(chat.length);
    setOpen((o) => !o);
  };

  // Autoscroll while open.
  useEffect(() => {
    if (!open) return;
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat, open]);

  const submit = (e) => {
    e.preventDefault();
    sendChat(draft, address ? shortAddr(address) : 'You');
    setDraft('');
  };

  const onlineCount = 12 + (chat.length % 7);

  return (
    <>
      <button className={`chat-fab glass ${open ? 'active' : ''}`} onClick={toggleOpen}
        aria-label={t.liveChat}>
        <ChatIcon />
        {!open && unread > 0 && <span className="chat-fab-badge">{unread}</span>}
      </button>

      {open && (
        <div className="chat-panel glass" role="log" aria-label={t.liveChat}>
          <header className="chat-header">
            <div>
              <h4>{t.liveChat}</h4>
              <span className="chat-online">
                <i style={chatOnline ? undefined : { background: 'var(--orange)', boxShadow: '0 0 8px var(--orange)' }} />
                {chatOnline ? `${onlineCount} ${t.online}` : lang === 'tr' ? 'yerel mod' : 'local mode'}
              </span>
            </div>
            <button className="chat-close" onClick={toggleOpen}>✕</button>
          </header>

          <div className="chat-body" ref={bodyRef}>
            {chat.length === 0 ? (
              <p className="chat-empty">{t.chatEmpty}</p>
            ) : (
              chat.map((m) => (
                <div key={m.id} className={`chat-msg ${m.you ? 'you' : ''}`}>
                  {!m.you && <span className="chat-author">{m.author}</span>}
                  <p>{m.text}</p>
                  <time>{new Date(m.ts).toLocaleTimeString(lang === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</time>
                </div>
              ))
            )}
          </div>

          <form className="chat-input-row" onSubmit={submit}>
            <input type="text" value={draft} maxLength={240}
              placeholder={t.chatPlaceholder}
              onChange={(e) => setDraft(e.target.value)} />
            <button type="submit" disabled={!draft.trim()} aria-label={t.chatSend}><SendIcon /></button>
          </form>
        </div>
      )}
    </>
  );
}
