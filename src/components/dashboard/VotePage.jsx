'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useGame } from '../../state/GameContext';

function VoteCheckIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" /></svg>);
}

export default function VotePage() {
  const game = useGame();
  const { t, lang, balance, economyStats, proposals, castVote } = game;
  const { isConnected } = useAccount();

  const votePower = Math.round(balance) + economyStats.yours * 10000;

  return (
    <div className="vote-layout">
      {/* Left: voting power */}
      <section className="db-card vote-power-card">
        <div className="db-card-title"><VoteCheckIcon /><span>{t.votePower}</span></div>

        <div className="vote-power-hero">
          <span className="stat-tile-lbl">{lang === 'en' ? 'YOUR VOTING WEIGHT' : 'OY GÜCÜNÜZ'}</span>
          <span className="vote-power-num">{votePower.toLocaleString('en-US')}</span>
        </div>

        <p className="vote-rules">{t.votingRules}</p>
        <div className="vote-rules-box">
          <span>1 $MRT = 1 {lang === 'en' ? 'point' : 'puan'}</span>
          <span>1 {lang === 'en' ? 'property' : 'mülk'} = 10,000 {lang === 'en' ? 'points' : 'puan'}</span>
        </div>

        {!isConnected && (
          <div className="vote-connect-box">
            <p>{t.connectToVote}</p>
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button className="pc-btn" onClick={openConnectModal}>{t.connectWallet}</button>
              )}
            </ConnectButton.Custom>
          </div>
        )}
      </section>

      {/* Right: proposals */}
      <section className="proposals-list">
        {proposals.map((prop) => {
          const total = prop.votesYes + prop.votesNo + prop.votesAbstain;
          const pct = (n) => (total > 0 ? ((n / total) * 100).toFixed(1) : '0.0');
          const rows = [
            ['yes', t.yes, prop.votesYes],
            ['no', t.no, prop.votesNo],
            ['abstain', t.abstain, prop.votesAbstain],
          ];

          return (
            <article key={prop.id} className="prop-card">
              <div className="prop-badge-row">
                <span className="prop-badge active">{lang === 'en' ? 'Active Proposal' : 'Aktif Teklif'}</span>
                <span className="prop-badge muted">{t.endsIn} {prop.endsInDays} {t.days}</span>
                {prop.userVote && <span className="prop-badge voted">{t.alreadyVoted}: {prop.userVote.toUpperCase()}</span>}
              </div>

              <h3>{lang === 'en' ? prop.title : prop.titleTr || prop.title}</h3>
              <p className="prop-desc">{lang === 'en' ? prop.description : prop.descriptionTr || prop.description}</p>

              <div className="prop-results-grid">
                {rows.map(([key, label, votes]) => (
                  <div key={key} className="prop-result-row">
                    <div className="prop-result-info">
                      <span>{label}</span>
                      <span>{pct(votes)}% · {votes.toLocaleString('en-US')}</span>
                    </div>
                    <div className="prop-progress-bar">
                      <div className={`prop-progress-fill ${key}`} style={{ width: `${pct(votes)}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {isConnected ? (
                <div className="prop-vote-actions">
                  {rows.map(([key, label]) => (
                    <button key={key}
                      className={`prop-vote-btn ${prop.userVote === key ? 'selected' : ''}`}
                      disabled={!!prop.userVote}
                      onClick={() => castVote(prop.id, key, isConnected)}>
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="prop-connect-note">{t.connectToVote}</div>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
