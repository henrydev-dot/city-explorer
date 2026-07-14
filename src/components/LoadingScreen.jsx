'use client';

export default function LoadingScreen({ progress, loaded, t }) {
  return (
    <div className={`loading-screen ${loaded ? 'loaded' : ''}`}>
      <img src="/logo.png" alt="Mortgage" className="loading-logo-img" />
      <div className="loading-bar-container">
        <div className="loading-bar" style={{ width: `${progress}%` }} />
      </div>
      <div className="loading-text">{progress < 100 ? (t?.loading || 'Yükleniyor...') : (t?.ready || 'Hazır')}</div>
    </div>
  );
}
