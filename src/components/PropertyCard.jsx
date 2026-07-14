'use client';

import { getTier, BUILDINGS } from '../lib/gameState';
import { formatMRT } from '../lib/constants';

// ── Monaco motifs ─────────────────────────────────────────────────────
// Hand-drawn flat SVG scenes (110×64) themed on the building's district:
// casino dome, yacht marina, Larvotto beach, F1 pit straight, Prince's
// palace, exotic gardens, promenade boutiques. Tinted by tier hue.

function MotifCasino() { // Monte Carlo Casino — dome, entrance, fountain
  return (
    <g>
      <ellipse cx="55" cy="62" rx="40" ry="3" className="ma-ground" />
      <rect x="30" y="34" width="50" height="26" rx="1.5" className="ma-body" />
      <path d="M39 34v-8a16 16 0 0 1 32 0v8z" className="ma-accent" />
      <circle cx="55" cy="14" r="4.5" className="ma-hi" />
      <rect x="35" y="40" width="8" height="14" rx="1" className="ma-win" />
      <rect x="51" y="40" width="8" height="20" rx="1" className="ma-win" />
      <rect x="67" y="40" width="8" height="14" rx="1" className="ma-win" />
      <rect x="26" y="30" width="6" height="30" rx="1" className="ma-accent" />
      <rect x="78" y="30" width="6" height="30" rx="1" className="ma-accent" />
      <path d="M12 60c0-6 4-8 4-12 0 4 4 6 4 12z" className="ma-hi" />
      <circle cx="16" cy="43" r="1.6" className="ma-hi" />
      <path d="M90 60c0-6 4-8 4-12 0 4 4 6 4 12z" className="ma-hi" />
      <circle cx="94" cy="43" r="1.6" className="ma-hi" />
    </g>
  );
}

function MotifBeach() { // Larvotto — sun, sea, palm, parasol
  return (
    <g>
      <circle cx="86" cy="16" r="8" className="ma-hi" />
      <path d="M0 46h110v18H0z" className="ma-accent" opacity="0.5" />
      <path d="M0 46q14-4 27 0t27 0 27 0 29 0" className="ma-win" />
      <path d="M22 52c-1-12 0-22 3-30" className="ma-body" strokeWidth="3" fill="none" stroke="currentColor" />
      <path d="M25 22c-7-5-14-5-19-2 6 0 10 2 13 5zM25 22c1-8 5-13 11-15-3 5-4 9-4 14zM25 22c8-3 14-1 18 3-6-1-11-1-15 2z" className="ma-leaf" />
      <path d="M62 34l12 0-6 0zM68 34v20" stroke="currentColor" strokeWidth="2" className="ma-body" fill="none" />
      <path d="M54 36a14 8 0 0 1 28 0z" className="ma-hi" />
    </g>
  );
}

function MotifYacht() { // Port Hercule — yacht on waves
  return (
    <g>
      <path d="M0 52h110v12H0z" className="ma-accent" opacity="0.5" />
      <path d="M0 52q14-4 27 0t27 0 27 0 29 0" className="ma-win" />
      <path d="M22 48l8-26 3 10 14-14 -2 14 8-6 -3 22z" className="ma-hi" opacity="0.9" />
      <path d="M14 50c4-3 10-4 16-4h46c8 0 12 2 14 4l-6 8H22z" className="ma-body" />
      <rect x="40" y="38" width="30" height="9" rx="2.5" className="ma-accent" />
      <rect x="46" y="40" width="5" height="3" rx="1" className="ma-win" />
      <rect x="55" y="40" width="5" height="3" rx="1" className="ma-win" />
      <rect x="64" y="40" width="4" height="3" rx="1" className="ma-win" />
    </g>
  );
}

function MotifF1() { // La Condamine — Monaco GP pit straight
  return (
    <g>
      <path d="M0 50h110v14H0z" className="ma-body" opacity="0.8" />
      <path d="M0 50h110" stroke="currentColor" strokeDasharray="7 5" strokeWidth="1.5" className="ma-win" fill="none" />
      <path d="M20 44c3-6 8-8 15-8h12l7-6c2-1.6 5-2 8-1l12 4c5 1.5 9 4 11 8l2 4z" className="ma-hi" />
      <circle cx="33" cy="46" r="6" className="ma-accent" /><circle cx="33" cy="46" r="2.6" className="ma-win" />
      <circle cx="77" cy="46" r="6" className="ma-accent" /><circle cx="77" cy="46" r="2.6" className="ma-win" />
      <path d="M12 44h10l-3 4H12zM88 40h14l3 5H92z" className="ma-accent" />
      <g className="ma-win">
        {[0, 1, 2, 3].map((i) => <rect key={i} x={90 + i * 4} y={12} width="3" height="3" opacity={i % 2 ? 1 : 0.25} />)}
        {[0, 1, 2, 3].map((i) => <rect key={i} x={90 + i * 4} y={15} width="3" height="3" opacity={i % 2 ? 0.25 : 1} />)}
      </g>
      <rect x="88" y="10" width="1.5" height="26" className="ma-body" />
    </g>
  );
}

function MotifPalace() { // Grimaldi — Prince's Palace tower + flag
  return (
    <g>
      <ellipse cx="55" cy="62" rx="42" ry="3" className="ma-ground" />
      <path d="M20 60V36l8-6 8 6v24z" className="ma-body" />
      <path d="M74 60V36l8-6 8 6v24z" className="ma-body" />
      <rect x="36" y="40" width="38" height="20" className="ma-accent" />
      <path d="M36 40l4-5h30l4 5z" className="ma-body" />
      <rect x="51" y="20" width="8" height="25" className="ma-body" />
      <path d="M50 20h10l-5-6z" className="ma-accent" />
      <path d="M55 8v8" stroke="currentColor" strokeWidth="1.5" className="ma-win" fill="none" />
      <path d="M55 8h9l-2.5 2.5L64 13h-9z" className="ma-hi" />
      <rect x="42" y="46" width="6" height="14" rx="3" className="ma-win" />
      <rect x="62" y="46" width="6" height="14" rx="3" className="ma-win" />
      <rect x="25" y="42" width="5" height="7" rx="2.5" className="ma-win" />
      <rect x="79" y="42" width="5" height="7" rx="2.5" className="ma-win" />
    </g>
  );
}

function MotifGarden() { // Jardin Exotique — hillside palms & cacti over the sea
  return (
    <g>
      <path d="M0 64l38-26 26 12 46-22v36z" className="ma-body" opacity="0.75" />
      <path d="M0 58h110v6H0z" className="ma-accent" opacity="0.5" />
      <path d="M30 52c-1-10 0-16 2-22" stroke="currentColor" strokeWidth="2.5" className="ma-body" fill="none" />
      <path d="M32 30c-6-4-12-4-16-1 5 0 9 1 11 4zM32 30c2-6 5-10 10-11-3 4-4 7-4 11zM32 30c7-2 12 0 15 3-5-1-9 0-12 2z" className="ma-leaf" />
      <path d="M70 54v-16m0 6c0-4 3-6 6-6m-6 2c0-4-3-6-6-6" stroke="currentColor" strokeWidth="2.5" className="ma-leaf" fill="none" />
      <circle cx="92" cy="14" r="6" className="ma-hi" />
    </g>
  );
}

function MotifPromenade() { // Princess Grace — boutique awnings & palms
  return (
    <g>
      <ellipse cx="55" cy="62" rx="42" ry="3" className="ma-ground" />
      <rect x="24" y="30" width="62" height="30" rx="1.5" className="ma-body" />
      <g className="ma-hi">
        <path d="M28 30h12v4q-3 3-6 0t-6 0z" /><path d="M49 30h12v4q-3 3-6 0t-6 0z" /><path d="M70 30h12v4q-3 3-6 0t-6 0z" />
      </g>
      <rect x="30" y="40" width="8" height="12" rx="1" className="ma-win" />
      <rect x="51" y="40" width="8" height="20" rx="1" className="ma-win" />
      <rect x="72" y="40" width="8" height="12" rx="1" className="ma-win" />
      <path d="M12 58c-1-9 0-15 2-20" stroke="currentColor" strokeWidth="2" className="ma-body" fill="none" />
      <path d="M14 38c-5-3-10-3-13 0 4 0 7 1 9 3zM14 38c2-5 5-8 9-9-3 3-4 6-4 9z" className="ma-leaf" />
      <circle cx="97" cy="12" r="5" className="ma-hi" />
    </g>
  );
}

// buildingIndex → motif (see BUILDINGS order in lib/gameState.js)
const MOTIFS = [MotifCasino, MotifBeach, MotifCasino, MotifYacht, MotifPalace, MotifF1, MotifGarden, MotifPromenade];

function CardArt({ apt }) {
  const tier = getTier(apt.tier);
  const Motif = MOTIFS[apt.buildingIndex % MOTIFS.length] || MotifCasino;
  return (
    <div className="pc-art" style={{ '--pc-hue': tier.hue }}>
      <svg viewBox="0 0 110 64" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <Motif />
      </svg>
      <div className="pc-art-glow" />
    </div>
  );
}

function CurrencyBadge({ apt, t }) {
  if (apt.currency === 'ETH') return <span className="pc-cur-badge eth">Ξ {t.ethOnly}</span>;
  if (apt.currency === 'BOTH') return <span className="pc-cur-badge both">{t.acceptsBoth}</span>;
  return <span className="pc-cur-badge mrt">{t.mrtOnly}</span>;
}

/**
 * Shared property card used by the marketplace, inventory and building panel
 * pages. `price`/`currency` describe what is shown in the footer (listing or
 * primary price); `badge` + `footer` slots customize per page.
 */
export default function PropertyCard({ apt, lang, t, badge, seller, price, currency, children, dimmed }) {
  const tier = getTier(apt.tier);
  const building = BUILDINGS[apt.buildingIndex];
  const unitName = lang === 'en' ? apt.unitEn || apt.unit : apt.unit;
  const isEth = currency === 'ETH';

  return (
    <article className={`property-card ${dimmed ? 'dimmed' : ''}`} style={{ '--pc-hue': tier.hue }}>
      <div className="pc-visual">
        <CardArt apt={apt} />
        <div className="pc-visual-top">
          <span className="pc-tier-badge">{lang === 'en' ? tier.label : tier.labelTr}</span>
          {badge}
        </div>
      </div>

      <div className="pc-body">
        <header className="pc-header">
          <div>
            <h3 className="pc-title">{unitName}</h3>
            <p className="pc-sub">{building?.name} · {building?.district}</p>
          </div>
          <CurrencyBadge apt={apt} t={t} />
        </header>

        <ul className="pc-meta">
          <li><span className="pc-meta-val">{apt.floor}</span><span className="pc-meta-lbl">{t.floor}</span></li>
          <li><span className="pc-meta-val">{apt.sqm} m²</span><span className="pc-meta-lbl">{t.size}</span></li>
          <li><span className="pc-meta-val">{lang === 'en' ? apt.view : apt.viewTr}</span><span className="pc-meta-lbl">{t.view}</span></li>
        </ul>

        <div className="pc-yield-row">
          <div className="pc-yield">
            <span className="pc-yield-val income">+{formatMRT(apt.rentIncome)}</span>
            <span className="pc-yield-lbl">{t.rent}</span>
          </div>
          <div className="pc-yield">
            <span className="pc-yield-val expense">−{formatMRT(apt.annualCost)}</span>
            <span className="pc-yield-lbl">{t.expense}</span>
          </div>
        </div>

        {seller && (
          <p className="pc-seller">{t.seller}: <strong>{seller}</strong></p>
        )}

        <footer className="pc-footer">
          {price != null && (
            <div className={`pc-price ${isEth ? 'eth' : 'mrt'}`}>
              {isEth ? Number(price).toLocaleString('en-US', { maximumFractionDigits: 4 }) : Math.round(price).toLocaleString('en-US')}
              <small>{isEth ? 'ETH' : '$MRT'}</small>
            </div>
          )}
          <div className="pc-actions">{children}</div>
        </footer>
      </div>
    </article>
  );
}
