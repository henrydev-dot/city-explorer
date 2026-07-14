'use client';

import { useState, useRef, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import CityScene from '../components/CityScene';
import BuildingPanel from '../components/BuildingPanel';
import HUD from '../components/HUD';
import LoadingScreen from '../components/LoadingScreen';
import LiveChat from '../components/LiveChat';
import Toasts from '../components/Toasts';
import DashboardShell from '../components/dashboard/DashboardShell';
import MarketplacePage from '../components/dashboard/MarketplacePage';
import InventoryPage from '../components/dashboard/InventoryPage';
import ProfilePage from '../components/dashboard/ProfilePage';
import VotePage from '../components/dashboard/VotePage';
import ReferralsPage from '../components/dashboard/ReferralsPage';
import { useGame } from '../state/GameContext';

const DASHBOARD_PAGES = {
  marketplace: MarketplacePage,
  inventory: InventoryPage,
  profile: ProfilePage,
  vote: VotePage,
  referrals: ReferralsPage,
};

export default function Home() {
  const { t } = useGame();

  // 3D scene state
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [cameraTarget, setCameraTarget] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [isWalkMode, setIsWalkMode] = useState(false);
  const controlsRef = useRef();

  // Real download/parse progress of the ~12MB city model (drei loader store).
  const { progress: rawProgress } = useProgress();
  const loadProgress = isSceneReady ? 100 : Math.min(99, Math.round(rawProgress));

  // Dashboard routing — pages open instantly (no artificial loading delay).
  const [activePage, setActivePage] = useState(null);

  const handleBuildingClick = useCallback((building) => {
    setSelectedBuilding(building);
    if (building.cameraTarget) setCameraTarget(building.cameraTarget);
  }, []);

  const handleClosePanel = useCallback(() => { setSelectedBuilding(null); setCameraTarget(null); }, []);
  const handleResetCamera = useCallback(() => { setCameraTarget(null); if (controlsRef.current) controlsRef.current.reset(); }, []);
  const handleZoomIn = useCallback(() => { if (controlsRef.current) { controlsRef.current.object.position.multiplyScalar(0.8); controlsRef.current.update(); } }, []);
  const handleZoomOut = useCallback(() => { if (controlsRef.current) { controlsRef.current.object.position.multiplyScalar(1.2); controlsRef.current.update(); } }, []);

  const handleSceneReady = useCallback(() => { setIsSceneReady(true); setTimeout(() => setIsLoaded(true), 600); }, []);

  const ActiveDashboard = activePage ? DASHBOARD_PAGES[activePage] : null;

  return (
    <main style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <LoadingScreen progress={loadProgress} loaded={isLoaded} t={t} />

      <div className="canvas-container">
        <Canvas shadows camera={{ position: [25, 20, 25], fov: 50, near: 0.1, far: 500 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', toneMapping: 3, toneMappingExposure: 1.0 }}
          onCreated={({ gl }) => { gl.setClearColor('#d0e0f5'); }}>
          <Suspense fallback={null}>
            <CityScene onBuildingClick={handleBuildingClick} selectedBuilding={selectedBuilding}
              controlsRef={controlsRef} onSceneReady={handleSceneReady} cameraTarget={cameraTarget}
              isWalkMode={isWalkMode} />
          </Suspense>
        </Canvas>
      </div>

      <HUD onResetCamera={handleResetCamera} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut}
        onOpenModal={setActivePage} isWalkMode={isWalkMode} onToggleWalkMode={() => setIsWalkMode(w => !w)} />

      <BuildingPanel building={selectedBuilding} onClose={handleClosePanel} />

      {ActiveDashboard && (
        <DashboardShell page={activePage} onNavigate={setActivePage} onClose={() => setActivePage(null)} t={t}>
          <ActiveDashboard onNavigate={setActivePage} />
        </DashboardShell>
      )}

      <LiveChat />
      <Toasts />
    </main>
  );
}
