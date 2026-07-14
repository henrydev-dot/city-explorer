'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useGame } from '../../state/GameContext';
import { FlashIcon } from '../Icons';
import { shortAddr } from '../../lib/constants';

function CopyIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>);
}
function SparkleIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>);
}

export default function ReferralsPage() {
  const game = useGame();
  const { t, lang, referrals, refEarnMRT, refEarnETH, refLogs, referredBy, addReferral, simulateReferralSpend } = game;
  const { address } = useAccount();

  const [simAddress, setSimAddress] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const refLink = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${address || '0xYourWalletAddress'}`
    : '';

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(refLink).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, [refLink]);

  const handleAdd = () => {
    if (addReferral(simAddress)) setSimAddress('');
  };

  return (
    <div className="referrals-layout">
      {/* Left: link + simulation */}
      <section className="db-card">
        <div className="db-card-title"><CopyIcon /><span>{t.referralLink}</span></div>

        <p className="fine-print" style={{ marginBottom: 12 }}>{t.referralHint}</p>
        <div className="ref-input-group">
          <input type="text" readOnly className="ref-input" value={refLink} />
          <button className={`ref-copy-btn ${isCopied ? 'copied' : ''}`} onClick={handleCopy}>
            {isCopied ? t.copied : t.copyLink}
          </button>
        </div>

        {referredBy && (
          <p className="ref-referrer-note">
            {lang === 'en' ? 'You were invited by' : 'Sizi davet eden'}: <code>{shortAddr(referredBy)}</code>
          </p>
        )}

        <div className="ref-sim-block">
          <span className="stat-tile-lbl">{t.referralSimTitle}</span>
          <p className="fine-print">{t.referralSimHint}</p>
          <div className="ref-input-group">
            <input type="text" className="ref-input" placeholder="0x…" value={simAddress}
              onChange={(e) => setSimAddress(e.target.value.trim())}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
            <button className="ref-copy-btn secondary" onClick={handleAdd}>{t.add}</button>
          </div>
          <button className="pc-btn" style={{ marginTop: 10, width: '100%' }} onClick={simulateReferralSpend}>
            <SparkleIcon /> <span style={{ marginLeft: 6 }}>{t.simulateReferralSpend}</span>
          </button>
        </div>
      </section>

      {/* Right: earnings */}
      <section className="db-card">
        <div className="db-card-title"><FlashIcon size={18} /><span>{lang === 'en' ? 'Earnings Dashboard' : 'Kazanç Paneli'}</span></div>

        <div className="ref-stats-row">
          <div className="stat-tile"><span className="stat-tile-val">{referrals.length}</span><span className="stat-tile-lbl">{t.totalReferrals}</span></div>
          <div className="stat-tile"><span className="stat-tile-val income">{refEarnMRT.toLocaleString('en-US')}</span><span className="stat-tile-lbl">$MRT</span></div>
          <div className="stat-tile"><span className="stat-tile-val eth">{refEarnETH.toFixed(3)}</span><span className="stat-tile-lbl">ETH</span></div>
        </div>

        <span className="stat-tile-lbl" style={{ display: 'block', marginBottom: 10 }}>{t.referralActivity}</span>
        {refLogs.length === 0 ? (
          <p className="fine-print">{lang === 'en' ? 'No referral spending yet.' : 'Henüz referans harcaması yok.'}</p>
        ) : (
          <div className="ref-logs-list">
            {refLogs.map((log) => (
              <div key={log.id} className="ref-log-item">
                <span className="ref-log-address">{log.address}</span>
                <span className="ref-log-amount">{log.amount}</span>
                <span className="ref-log-value">+{log.commission}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
