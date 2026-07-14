'use client';

import { useState } from 'react';
import { useGame } from '../../state/GameContext';
import { getAllApartments } from '../../lib/gameState';
import PropertyCard from '../PropertyCard';
import { APPRECIATION_RATE, formatMRT, formatPrice } from '../../lib/constants';

export default function InventoryPage({ onNavigate }) {
  const game = useGame();
  const { t, lang, apartments, listings, economyStats, totalIncome, totalCost, listApartment, cancelListing } = game;
  const [form, setForm] = useState(null); // { aptId, price, currency }

  const owned = getAllApartments(apartments).filter((a) => a.status === 'owned' || a.status === 'listed');

  const submitListing = (apt) => {
    if (!form) return;
    const ok = listApartment(apt.buildingIndex, apt.id, form.price, form.currency);
    if (ok) setForm(null);
  };

  return (
    <div className="inventory-layout">
      {/* Summary strip */}
      <div className="market-stats-strip">
        <div className="mss-item"><span className="mss-num">{economyStats.yours}</span><span className="mss-lbl">{t.totalProperties}</span></div>
        <div className="mss-item"><span className="mss-num" style={{ color: 'var(--green)' }}>+{formatMRT(totalIncome)}</span><span className="mss-lbl">{t.monthlyIncome}</span></div>
        <div className="mss-item"><span className="mss-num" style={{ color: 'var(--red)' }}>−{formatMRT(totalCost)}</span><span className="mss-lbl">{t.yearlyExpense}</span></div>
        <div className="mss-item"><span className="mss-num" style={{ color: 'var(--orange)' }}>+{APPRECIATION_RATE}%</span><span className="mss-lbl">{t.appreciation}</span></div>
      </div>

      {owned.length === 0 ? (
        <div className="empty-state">
          <h3>{lang === 'en' ? 'Your Portfolio is Empty' : 'Portföyünüz Boş'}</h3>
          <p>{t.noProperties}</p>
          <button className="pc-btn" style={{ marginTop: 16 }} onClick={() => onNavigate('marketplace')}>
            {t.goToMarketplace}
          </button>
        </div>
      ) : (
        <div className="property-grid">
          {owned.map((apt) => {
            const listing = listings.find((l) => l.aptId === apt.id && l.buildingIndex === apt.buildingIndex);
            const isListed = apt.status === 'listed' && listing;

            return (
              <PropertyCard key={apt.id} apt={apt} lang={lang} t={t}
                badge={isListed
                  ? <span className="pc-state-badge mine">{t.listed}</span>
                  : <span className="pc-state-badge owned">{t.owned}</span>}
                price={isListed ? listing.price : apt.price}
                currency={isListed ? listing.currency : 'MRT'}>
                {isListed ? (
                  <button className="pc-btn danger" onClick={() => cancelListing(listing.id)}>
                    {t.cancelListing}
                  </button>
                ) : form?.aptId === apt.id ? (
                  <div className="list-form">
                    <div className="list-form-row">
                      <input type="number" min="0" step="any" autoFocus
                        className="list-form-input"
                        placeholder={t.listPriceInput}
                        value={form.price}
                        onKeyDown={(e) => e.key === 'Enter' && submitListing(apt)}
                        onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
                      <select className="list-form-select" value={form.currency}
                        onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
                        <option value="MRT">$MRT</option>
                        <option value="ETH">ETH</option>
                      </select>
                    </div>
                    <div className="list-form-row">
                      <button className="pc-btn confirm" onClick={() => submitListing(apt)}>{t.sell}</button>
                      <button className="pc-btn ghost" onClick={() => setForm(null)}>✕</button>
                    </div>
                  </div>
                ) : (
                  <button className="pc-btn"
                    onClick={() => setForm({ aptId: apt.id, price: String(apt.price), currency: 'MRT' })}>
                    {t.sell}
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
