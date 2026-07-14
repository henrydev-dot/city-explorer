'use client';

import { BUILDING_ICONS, XIcon, LockIcon } from './Icons';

export default function BuildingPanel({ building, onClose, apartments = [], onBuy, balance, t, lang }) {
  if (!building) return <div className="building-panel glass" />;

  const IconComponent = BUILDING_ICONS[building.id] || BUILDING_ICONS['merkez-tower'];
  const ownedCount = apartments.filter(a => a.status === 'owned').length;
  const availCount = apartments.filter(a => a.status === 'available').length;

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

        {apartments.length > 0 && (
          <div className="apartments-section">
            <div className="apartments-title">
              {t.apartments} — {ownedCount} {t.ownedByYou} · {availCount} {t.available}
            </div>
            {apartments.map((apt) => {
              const unitName = lang === 'en' ? (apt.unitEn || apt.unit) : apt.unit;
              return (
                <div key={apt.id} className={`apartment-card ${apt.status}`}>
                  <div className="apartment-top">
                    <div className="apartment-info">
                      <h4>{unitName}</h4>
                      <span>{t.floor} {apt.floor}</span>
                    </div>
                    <div className="apartment-price">
                      {apt.price.toLocaleString('tr-TR')}<small>$MRT</small>
                    </div>
                  </div>
                  <div className="apartment-meta">
                    <div className="apartment-meta-item">
                      <span className="apartment-meta-value income">+{apt.rentIncome}/ay</span>
                      <span className="apartment-meta-label">{t.rent}</span>
                    </div>
                    <div className="apartment-meta-item">
                      <span className="apartment-meta-value expense">−{apt.annualCost}/yıl</span>
                      <span className="apartment-meta-label">{t.expense}</span>
                    </div>
                  </div>
                  {apt.status === 'owned' ? (
                    <div className="apartment-owned-tag">{t.owned}</div>
                  ) : apt.status === 'taken' ? (
                    <div className="apartment-taken-tag">
                      <LockIcon size={12} className="taken-lock-icon" />
                      <span>{t.takenByOther} — {apt.owner}</span>
                    </div>
                  ) : (
                    <button
                      className={`apartment-buy-btn ${balance < apt.price ? 'cant-afford' : ''}`}
                      onClick={() => onBuy(apt.id)}
                      disabled={balance < apt.price}
                    >
                      {balance < apt.price ? t.insufficientBalance : t.buy}
                    </button>
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
