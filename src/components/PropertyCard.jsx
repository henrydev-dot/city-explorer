'use client';

import { getTier, BUILDINGS } from '../lib/gameState';
import { formatMRT } from '../lib/constants';

// Decorative building silhouette drawn per-card (deterministic from the id).
function CardArt({ apt }) {
  const tier = getTier(apt.tier);
  const seed = apt.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const bars = Array.from({ length: 7 }, (_, i) => {
    const h = 22 + ((seed * (i + 3)) % 46);
    return { h, w: 10 + ((seed + i) % 6), x: 4 + i * 14 };
  });
  return (
    <div className="pc-art" style={{ '--pc-hue': tier.hue }}>
      <svg viewBox="0 0 110 64" preserveAspectRatio="xMidYMax meet" aria-hidden>
        {bars.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={64 - b.h} width={b.w} height={b.h} rx="1" className="pc-art-tower" />
            {Array.from({ length: Math.floor(b.h / 9) }, (_, w) => (
              <rect key={w} x={b.x + 2} y={64 - b.h + 4 + w * 9} width={b.w - 4} height="3" rx="0.5" className="pc-art-win" />
            ))}
          </g>
        ))}
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
