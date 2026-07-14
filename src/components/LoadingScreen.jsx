'use client';

import Image from 'next/image';

export default function LoadingScreen({ progress, loaded, t }) {
  return (
    <div className={`loading-screen ${loaded ? 'loaded' : ''}`}>
      <Image src="/logo.png" alt="Mortgage" className="loading-logo-img" width={4004} height={465} priority />
      <div className="loading-bar-container">
        <div className="loading-bar" style={{ width: `${progress}%` }} />
      </div>
      <div className="loading-text">{progress < 100 ? (t?.loading || 'Yükleniyor...') : (t?.ready || 'Hazır')}</div>
    </div>
  );
}
