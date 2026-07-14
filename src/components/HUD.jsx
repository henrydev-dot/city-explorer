'use client';

import { PlusIcon, MinusIcon, RefreshIcon, MouseIcon, ScrollIcon, CursorClickIcon, MoveIcon, TrendingUpIcon } from './Icons';
import { ConnectButton } from '@rainbow-me/rainbowkit';

function MarketplaceIcon() {
  return (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l1.5-5h15L21 9" /><path d="M3 9a3 3 0 003 3 3 3 0 003-3" /><path d="M9 9a3 3 0 003 3 3 3 0 003-3" /><path d="M15 9a3 3 0 003 3 3 3 0 003-3" /><path d="M4 12v8h16v-8" /><path d="M10 16h4v4h-4z" /></svg>);
}
function InventoryIcon() {
  return (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>);
}
function ProfileIcon() {
  return (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-7 8-7s8 3 8 7" /></svg>);
}
function WalletIcon() {
  return (<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 10h20" /><circle cx="17" cy="15" r="1.5" /></svg>);
}
function GlobeIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15 15 0 014 10 15 15 0 01-4 10 15 15 0 01-4-10A15 15 0 0112 2z" /></svg>);
}
function VoteIcon() {
  return (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>);
}
function ReferralsIcon() {
  return (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>);
}

export default function HUD({ onResetCamera, onZoomIn, onZoomOut, balance, ethBalance, totalIncome, totalCost, ownedCount, onOpenModal, t, lang, onToggleLang, economyStats, appreciationRate }) {
  return (
    <div className="hud-overlay">
      <div className="hud-sidebar">
        {/* Logo */}
        <div className="hud-logo-box glass">
          <img src="/logo.png" alt="Mortgage" />
        </div>

        {/* Wallet + Lang (Using Real RainbowKit ConnectButton) */}
        <div className="hud-wallet-row">
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openConnectModal,
              mounted,
            }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              return (
                <div style={{ display: 'flex', flex: 1 }} {...(!ready && {
                  'aria-hidden': true,
                  style: {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}>
                  {(() => {
                    if (!connected) {
                      return (
                        <button className="wallet-btn glass" onClick={openConnectModal} type="button" style={{ width: '100%' }}>
                           <WalletIcon />
                           <span>{t.connectWallet}</span>
                        </button>
                      );
                    }

                    return (
                      <button className="wallet-btn glass connected" onClick={openAccountModal} type="button" style={{ width: '100%' }}>
                        <WalletIcon />
                        <span>{account.displayName}</span>
                      </button>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
          
          <button className="lang-btn glass" onClick={onToggleLang} title="Language">
            <GlobeIcon />
            <span>{lang.toUpperCase()}</span>
          </button>
        </div>

        {/* Balance */}
        <div className="hud-balance glass">
          <div className="hud-balance-main">
            <span className="hud-balance-amount">{(balance || 0).toLocaleString('tr-TR')}</span>
            <span className="hud-balance-currency">$MRT</span>
          </div>
          <div className="hud-balance-sub" style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '-4px', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <span className="hud-balance-amount-eth" style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-secondary)' }}>{(ethBalance || 0).toFixed(3)}</span>
            <span className="hud-balance-currency-eth" style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>ETH</span>
          </div>
          <div className="hud-balance-stats">
            <div className="hud-balance-stat">
              <span className="hud-balance-stat-value income">+{(totalIncome || 0).toLocaleString('tr-TR')}</span>
              <span className="hud-balance-stat-label">{t.monthlyRent}</span>
            </div>
            <div className="hud-balance-stat">
              <span className="hud-balance-stat-value expense">−{(totalCost || 0).toLocaleString('tr-TR')}</span>
              <span className="hud-balance-stat-label">{t.annualCost}</span>
            </div>
          </div>
          <div className="hud-owned-badge"><strong>{ownedCount || 0}</strong> {t.properties}</div>
          <div className="hud-appreciation-badge" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--green)', marginTop: '8px', fontWeight: '700' }}>
            <TrendingUpIcon size={16} style={{ color: 'var(--green)', strokeWidth: '2.5px' }} />
            <span>Monaco Index: +{appreciationRate || 14.6}% / yr</span>
          </div>
        </div>

        {/* Economy minibar */}
        <div className="hud-economy glass">
          <div className="hud-economy-title">{t.mapEconomy}</div>
          <div className="hud-economy-bar">
            <div className="econ-fill taken" style={{ width: `${((economyStats?.sold || 0) / (economyStats?.total || 1)) * 100}%` }} />
          </div>
          <div className="hud-economy-nums">
            <span>{economyStats?.available || 0} {t.availableUnits}</span>
            <span>{economyStats?.total || 0} {t.totalUnits}</span>
          </div>
        </div>

        {/* Menu */}
        <div className="hud-menu glass">
          <button className="hud-menu-btn" onClick={() => onOpenModal('marketplace')}>
            <MarketplaceIcon /><span>{t.marketplace}</span>
          </button>
          <button className="hud-menu-btn" onClick={() => onOpenModal('inventory')}>
            <InventoryIcon /><span>{t.inventory}</span>
          </button>
          <button className="hud-menu-btn" onClick={() => onOpenModal('profile')}>
            <ProfileIcon /><span>{t.profile}</span>
          </button>
          <button className="hud-menu-btn" onClick={() => onOpenModal('vote')}>
            <VoteIcon /><span>{t.vote}</span>
          </button>
          <button className="hud-menu-btn" onClick={() => onOpenModal('referrals')}>
            <ReferralsIcon /><span>{t.referrals}</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="hud-controls">
        <button className="hud-btn" onClick={onZoomIn}><PlusIcon /></button>
        <button className="hud-btn" onClick={onZoomOut}><MinusIcon /></button>
        <button className="hud-btn" onClick={onResetCamera}><RefreshIcon /></button>
      </div>

      {/* Hints */}
      <div className="hud-hints glass">
        <div className="hud-hint"><MouseIcon /><span>{t.rotate}</span></div>
        <div className="hud-hint"><MoveIcon /><span>{t.pan}</span></div>
        <div className="hud-hint"><ScrollIcon /><span>{t.zoom}</span></div>
        <div className="hud-hint"><CursorClickIcon /><span>{t.buildingInfo}</span></div>
      </div>
    </div>
  );
}
