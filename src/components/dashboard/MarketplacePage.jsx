'use client';

import { useMemo, useState } from 'react';
import { useGame } from '../../state/GameContext';
import { getAllApartments, getApartment } from '../../lib/gameState';
import PropertyCard from '../PropertyCard';
import { TrendingUpIcon } from '../Icons';
import { APPRECIATION_RATE, MRT_PER_ETH } from '../../lib/constants';

export default function MarketplacePage() {
  const game = useGame();
  const { t, lang, apartments, listings, balance, ethBalance, economyStats, buyApartment, buyListing, cancelListing } = game;

  const [scope, setScope] = useState('all');      // all | primary | p2p | mine
  const [currency, setCurrency] = useState('all'); // all | MRT | ETH
  const [sort, setSort] = useState('priceAsc');    // priceAsc | priceDesc | yield

  // Normalize primary sales + P2P listings into one card list.
  const entries = useMemo(() => {
    const primary = getAllApartments(apartments)
      .filter((a) => a.status === 'available')
      .map((apt) => ({
        key: `primary-${apt.id}`,
        kind: 'primary',
        apt,
        priceMrtEquivalent: apt.currency === 'ETH' ? apt.priceEth * MRT_PER_ETH : apt.price,
      }));

    const p2p = listings.map((l) => {
      const apt = getApartment(apartments, l.buildingIndex, l.aptId);
      if (!apt) return null;
      return {
        key: `p2p-${l.id}`,
        kind: l.seller === 'You' ? 'mine' : 'p2p',
        apt,
        listing: l,
        priceMrtEquivalent: l.currency === 'ETH' ? l.price * MRT_PER_ETH : l.price,
      };
    }).filter(Boolean);

    let all = [...primary, ...p2p];

    if (scope === 'primary') all = all.filter((e) => e.kind === 'primary');
    if (scope === 'p2p') all = all.filter((e) => e.kind === 'p2p');
    if (scope === 'mine') all = all.filter((e) => e.kind === 'mine');
    if (currency !== 'all') {
      all = all.filter((e) => {
        const c = e.listing ? e.listing.currency : e.apt.currency;
        return c === currency || c === 'BOTH';
      });
    }

    all.sort((a, b) => {
      if (sort === 'priceAsc') return a.priceMrtEquivalent - b.priceMrtEquivalent;
      if (sort === 'priceDesc') return b.priceMrtEquivalent - a.priceMrtEquivalent;
      const yieldOf = (e) => (e.apt.rentIncome * 12 - e.apt.annualCost) / e.priceMrtEquivalent;
      return yieldOf(b) - yieldOf(a);
    });
    return all;
  }, [apartments, listings, scope, currency, sort]);

  const scopes = [
    ['all', t.filterAll],
    ['primary', t.filterPrimary],
    ['p2p', t.filterP2P],
    ['mine', t.filterMine],
  ];

  return (
    <div className="market-layout">
      {/* Stats strip */}
      <div className="market-stats-strip">
        <div className="mss-item"><span className="mss-num">{economyStats.total}</span><span className="mss-lbl">{t.totalUnits}</span></div>
        <div className="mss-item"><span className="mss-num" style={{ color: 'var(--red)' }}>{economyStats.sold}</span><span className="mss-lbl">{t.soldUnits}</span></div>
        <div className="mss-item"><span className="mss-num" style={{ color: 'var(--green)' }}>{economyStats.available}</span><span className="mss-lbl">{t.availableUnits}</span></div>
        <div className="mss-item"><span className="mss-num" style={{ color: 'var(--orange)' }}>{economyStats.yours}</span><span className="mss-lbl">{t.yourUnits}</span></div>
        <div className="mss-item mss-appreciation">
          <TrendingUpIcon size={16} style={{ color: 'var(--green)' }} />
          <span>Monaco Index <strong>+{APPRECIATION_RATE}%</strong>/yr</span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="market-toolbar">
        <div className="market-tabs" role="tablist">
          {scopes.map(([key, label]) => (
            <button key={key} role="tab" aria-selected={scope === key}
              className={`market-tab ${scope === key ? 'active' : ''}`}
              onClick={() => setScope(key)}>
              {label}
            </button>
          ))}
        </div>

        <div className="market-toolbar-right">
          <div className="market-tabs small">
            {[['all', t.filterAll.split(' ')[0]], ['MRT', t.filterMRT], ['ETH', t.filterETH]].map(([key, label]) => (
              <button key={key} className={`market-tab ${currency === key ? 'active' : ''}`} onClick={() => setCurrency(key)}>
                {label}
              </button>
            ))}
          </div>
          <select className="market-sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t.sortLabel}>
            <option value="priceAsc">{t.sortPriceAsc}</option>
            <option value="priceDesc">{t.sortPriceDesc}</option>
            <option value="yield">{t.sortYield}</option>
          </select>
        </div>
      </div>

      {/* Cards grid */}
      {entries.length === 0 ? (
        <div className="empty-state">
          <h3>{t.emptyMarket}</h3>
        </div>
      ) : (
        <div className="property-grid">
          {entries.map((e) => {
            if (e.kind === 'primary') {
              const { apt } = e;
              const canMrt = apt.currency !== 'ETH';
              const canEth = apt.currency !== 'MRT';
              return (
                <PropertyCard key={e.key} apt={apt} lang={lang} t={t}
                  badge={<span className="pc-state-badge primary">{t.primarySale}</span>}
                  price={apt.currency === 'ETH' ? apt.priceEth : apt.price}
                  currency={apt.currency === 'ETH' ? 'ETH' : 'MRT'}>
                  {canMrt && (
                    <button className="pc-btn" disabled={balance < apt.price}
                      onClick={() => buyApartment(apt.buildingIndex, apt.id, 'MRT')}>
                      {balance < apt.price ? t.noFunds : t.buyWithMRT}
                    </button>
                  )}
                  {canEth && (
                    <button className="pc-btn eth" disabled={ethBalance < apt.priceEth}
                      onClick={() => buyApartment(apt.buildingIndex, apt.id, 'ETH')}>
                      {ethBalance < apt.priceEth ? t.noFunds : `${t.buyWithETH} · ${apt.priceEth}`}
                    </button>
                  )}
                </PropertyCard>
              );
            }

            const { apt, listing } = e;
            const isEth = listing.currency === 'ETH';
            const afford = isEth ? ethBalance >= listing.price : balance >= listing.price;
            return (
              <PropertyCard key={e.key} apt={apt} lang={lang} t={t}
                badge={e.kind === 'mine'
                  ? <span className="pc-state-badge mine">{t.yourListing}</span>
                  : <span className="pc-state-badge p2p">{t.p2pSale}</span>}
                seller={listing.seller === 'You' ? null : listing.seller}
                price={listing.price} currency={listing.currency}>
                {e.kind === 'mine' ? (
                  <button className="pc-btn danger" onClick={() => cancelListing(listing.id)}>
                    {t.cancelListing}
                  </button>
                ) : (
                  <button className={`pc-btn ${isEth ? 'eth' : ''}`} disabled={!afford}
                    onClick={() => buyListing(listing.id)}>
                    {afford ? (isEth ? t.buyWithETH : t.buyWithMRT) : t.noFunds}
                  </button>
                )}
              </PropertyCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
