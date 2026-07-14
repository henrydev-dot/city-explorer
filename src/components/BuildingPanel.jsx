'use client';

import { BUILDING_ICONS, XIcon, LockIcon } from './Icons';
import { useGame } from '../state/GameContext';
import { getTier } from '../lib/gameState';

export default function BuildingPanel({ building, onClose }) {
  const { t, lang, apartments, balance, ethBalance, buyApartment } = useGame();

  if (!building) return <div className="building-panel glass" />;

  const units = apartments[building.buildingIndex] || [];
  const IconComponent = BUILDING_ICONS[building.id] || BUILDING_ICONS['merkez-tower'];
  const ownedCount = units.filter((a) => a.status === 'owned' || a.status === 'listed').length;
  const availCount = units.filter((a) => a.status === 'available').length;

  return (
    <div className={`building-panel glass ${building ? 'visible' : ''}`}>
      <div className="building-panel-header">
        <button className="building-panel-close" onClick={onClose}><XIcon /></button>
        {IconComponent && <div className="building-panel-icon"><IconComponent size={20} /></div>}
        <h2>{building.name}</h2>
        <span className="subtitle">{building.subtitle}</span>
      </div>

      <div className="building-panel-body">
        <p className="building-panel-description">{building.description}</p>

        <div className="building-stats">
          {building.stats.map((stat) => (
            <div key={stat.label} className="building-stat">
              <div className="building-stat-value">{stat.value}</div>
              <div className="building-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {units.length > 0 && (
          <div className="apartments-section">
            <div className="apartments-title">
              {t.apartments} — {ownedCount} {t.ownedByYou} · {availCount} {t.available}
            </div>
            {units.map((apt) => {
              const unitName = lang === 'en' ? apt.unitEn || apt.unit : apt.unit;
              const tier = getTier(apt.tier);
              const canMrt = apt.currency !== 'ETH';
              const canEth = apt.currency !== 'MRT';
              const isYours = apt.status === 'owned' || apt.status === 'listed';

              return (
                <div key={apt.id} className={`apartment-card ${isYours ? 'owned' : apt.status}`}>
                  <div className="apartment-top">
                    <div className="apartment-info">
                      <h4>{unitName}</h4>
                      <span>{t.floor} {apt.floor} · {lang === 'en' ? tier.label : tier.labelTr} · {apt.sqm} m²</span>
                    </div>
                    <div className="apartment-price">
                      {apt.currency === 'ETH'
                        ? <>{apt.priceEth}<small>ETH</small></>
                        : <>{apt.price.toLocaleString('en-US')}<small>$MRT</small></>}
                    </div>
                  </div>
                  <div className="apartment-meta">
                    <div className="apartment-meta-item">
                      <span className="apartment-meta-value income">+{apt.rentIncome}/{lang === 'en' ? 'mo' : 'ay'}</span>
                      <span className="apartment-meta-label">{t.rent}</span>
                    </div>
                    <div className="apartment-meta-item">
                      <span className="apartment-meta-value expense">−{apt.annualCost}/{lang === 'en' ? 'yr' : 'yıl'}</span>
                      <span className="apartment-meta-label">{t.expense}</span>
                    </div>
                    {apt.currency === 'BOTH' && (
                      <div className="apartment-meta-item">
                        <span className="apartment-meta-value" style={{ color: 'var(--orange)' }}>{apt.priceEth} ETH</span>
                        <span className="apartment-meta-label">{t.acceptsBoth}</span>
                      </div>
                    )}
                  </div>

                  {isYours ? (
                    <div className="apartment-owned-tag">✓ {t.owned}</div>
                  ) : apt.status === 'taken' ? (
                    <div className="apartment-taken-tag">
                      <LockIcon size={12} className="taken-lock-icon" />
                      <span>{t.takenByOther} — {apt.owner}</span>
                    </div>
                  ) : (
                    <div className="apartment-buy-row">
                      {canMrt && (
                        <button
                          className={`apartment-buy-btn ${balance < apt.price ? 'cant-afford' : ''}`}
                          onClick={() => buyApartment(building.buildingIndex, apt.id, 'MRT')}
                          disabled={balance < apt.price}>
                          {balance < apt.price ? t.insufficientBalance : t.buyWithMRT}
                        </button>
                      )}
                      {canEth && (
                        <button
                          className={`apartment-buy-btn eth ${ethBalance < apt.priceEth ? 'cant-afford' : ''}`}
                          onClick={() => buyApartment(building.buildingIndex, apt.id, 'ETH')}
                          disabled={ethBalance < apt.priceEth}>
                          {ethBalance < apt.priceEth ? t.insufficientBalance : t.buyWithETH}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
