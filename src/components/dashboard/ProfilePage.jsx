'use client';

import { useAccount, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useGame } from '../../state/GameContext';
import { FlashIcon } from '../Icons';
import { MRT_TOKEN_ADDRESS, formatMRT, shortAddr } from '../../lib/constants';
import { ESTATE_ADDRESS, ACTIVE_CHAIN, isOnchainEnabled } from '../../lib/contracts';

function SparkleIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>);
}

export default function ProfilePage() {
  const game = useGame();
  const { t, lang, balance, ethBalance, totalIncome, netMonthly, portfolioValue, activity, economyStats, resetGame } = game;
  const { address, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();

  const dailyReturn = Math.round((netMonthly * 12) / 365);
  const hourlyReturn = Math.round(dailyReturn / 24);
  const perSecond = (netMonthly / 60).toFixed(2); // game month = 60s

  return (
    <div className="profile-layout">
      {/* Left: identity & balances */}
      <section className="db-card">
        <div className="db-card-title"><SparkleIcon /><span>{t.investorLedger}</span></div>

        <div className="profile-id-row">
          <div className="profile-avatar">M</div>
          <div>
            <h4>{t.landRegistry}</h4>
            <span className="profile-id-sub">{t.accountActive} · {economyStats.yours} {t.properties}</span>
          </div>
        </div>

        {isConnected ? (
          <div className="profile-wallet-box connected">
            <span className="profile-wallet-provider">{t.connected}{connector?.name ? ` · ${connector.name}` : ''}</span>
            <code>{address}</code>
            <button className="link-btn" onClick={() => disconnect()}>{t.disconnect}</button>
          </div>
        ) : (
          <div className="profile-wallet-box">
            <p>{t.walletNotConnected}</p>
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button className="pc-btn" onClick={openConnectModal}>{t.connectWallet}</button>
              )}
            </ConnectButton.Custom>
          </div>
        )}

        <div className="profile-balances">
          <div className="stat-tile">
            <span className="stat-tile-lbl">$MRT {t.balance.toUpperCase()}</span>
            <span className="stat-tile-val">{Math.round(balance).toLocaleString('en-US')}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-tile-lbl">ETH {t.balance.toUpperCase()}</span>
            <span className="stat-tile-val eth">{ethBalance.toFixed(3)}</span>
          </div>
        </div>

        <div className="token-info-box">
          <span className="stat-tile-lbl">{t.tokenInfo}</span>
          <code title={MRT_TOKEN_ADDRESS}>{shortAddr(MRT_TOKEN_ADDRESS)}</code>
        </div>

        <div className="token-info-box">
          <span className="stat-tile-lbl">
            {isOnchainEnabled()
              ? `MonacoEstate · ${ACTIVE_CHAIN.name}`
              : lang === 'tr' ? 'Zincir modu: kapalı (simülasyon)' : 'Chain mode: off (simulation)'}
          </span>
          {isOnchainEnabled()
            ? <code title={ESTATE_ADDRESS}>{shortAddr(ESTATE_ADDRESS)}</code>
            : <code style={{ color: 'var(--text-muted)' }}>npm run chain:deploy:testnet</code>}
        </div>

        <button className="pc-btn ghost danger-text" onClick={resetGame}>{t.resetGame}</button>
      </section>

      {/* Right: returns + activity */}
      <section className="db-card">
        <div className="db-card-title"><FlashIcon size={18} /><span>{t.liveReturns}</span></div>

        <div className="yield-rows">
          <div className="yield-row"><span>{t.realtimeReturn}</span><strong className="income">+{perSecond} $MRT/s</strong></div>
          <div className="yield-row"><span>{t.hourlyReturn}</span><strong className="income">+{formatMRT(hourlyReturn)}</strong></div>
          <div className="yield-row"><span>{t.dailyReturn}</span><strong className="income">+{formatMRT(dailyReturn)}</strong></div>
          <div className="yield-row"><span>{t.monthlyIncome}</span><strong className="income">+{formatMRT(totalIncome)}</strong></div>
          <div className="yield-row"><span>{t.netMonthly}</span><strong className="income">+{formatMRT(netMonthly)}</strong></div>
        </div>
        <p className="fine-print">{t.gameTime}</p>

        <div className="book-value">
          <span className="stat-tile-lbl">{t.bookValue}</span>
          <div className="book-value-row">
            <span className="book-value-num">{formatMRT(portfolioValue)}</span>
            <span className="fine-print">{t.estimated}</span>
          </div>
        </div>

        <div className="activity-block">
          <span className="stat-tile-lbl">{t.activityLog}</span>
          {activity.length === 0 ? (
            <p className="fine-print" style={{ marginTop: 8 }}>{t.noActivity}</p>
          ) : (
            <ul className="activity-list">
              {activity.slice(0, 12).map((a) => (
                <li key={a.id} className={`activity-item ${a.type}`}>
                  <span>{lang === 'en' ? a.text : a.textTr || a.text}</span>
                  <time>{new Date(a.ts).toLocaleTimeString(lang === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
