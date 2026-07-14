'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

// Building name pool
const BUILDING_NAMES = [
  { name: 'Monte Carlo Casino', subtitle: 'Entertainment & Gaming', desc: 'The historic and world-famous Monaco landmark. Premier entertainment and gaming venue built in 1863.' },
  { name: 'Larvotto Beach Tower', subtitle: 'Luxury Waterfront Residence', desc: 'Waterfront residential tower overlooking the sandy Larvotto coast, featuring premium luxury penthouses.' },
  { name: 'Hôtel de Paris Block', subtitle: 'Premium Hotels & Suites', desc: 'Luxury grand hotel suites situated next to Casino Square. Built in 1864 with iconic architectural design.' },
  { name: 'Port Hercule Residence', subtitle: 'Marinafront Estates', desc: 'Prime real estate directly facing the yacht marina. Houses exclusive grand balconies with F1 circuit views.' },
  { name: 'Grimaldi Plaza', subtitle: 'Conventions & Arts', desc: 'The business, convention, and cultural center of Monaco. A state-of-the-art eco-building.' },
  { name: 'La Condamine Offices', subtitle: 'Commercial District', desc: 'Modern commercial and retail workspace block in the historic market district.' },
  { name: 'Jardin Exotique Heights', subtitle: 'Scenic View Apartments', desc: 'Residential heights built close to the exotic gardens, offering complete panoramic views of the sea.' },
  { name: 'Princess Grace Plaza', subtitle: 'High-end Luxury Retail', desc: 'Prestige residences and luxury designer boutiques along the famous avenue.' }
];

// ── Building Label ────────────────────────────────────────
function BuildingLabel({ building, onClick, isSelected }) {
  return (
    <Html position={building.labelPosition} center distanceFactor={25} style={{ pointerEvents: 'auto' }}>
      <div className="building-label" onClick={(e) => { e.stopPropagation(); onClick(building); }}>
        <div className="building-label-ring">
          <div className="building-label-dot" style={isSelected ? { background: '#ccc' } : undefined} />
        </div>
        <div className="building-label-name" style={isSelected ? { borderColor: 'rgba(255,255,255,0.25)', background: 'rgba(0,0,0,0.95)' } : undefined}>
          {building.name}
        </div>
      </div>
    </Html>
  );
}

// ── Clickable Building Mesh ───────────────────────────────
function ClickableBuilding({ meshRef, building, onClick, isSelected, isHovered, onHover }) {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0,
    side: THREE.FrontSide, depthWrite: false,
  }), []);

  useFrame(() => {
    // Imperative three.js animation outside the React render cycle.
    // eslint-disable-next-line react-hooks/immutability
    mat.opacity += ((isHovered ? 0.14 : isSelected ? 0.08 : 0) - mat.opacity) * 0.12;
  });

  if (!meshRef) return null;

  return (
    <mesh
      geometry={meshRef.geometry}
      position={meshRef.position}
      rotation={meshRef.rotation}
      scale={meshRef.scale}
      material={mat}
      onClick={(e) => { e.stopPropagation(); onClick(building); }}
      onPointerOver={(e) => { e.stopPropagation(); onHover(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); onHover(false); document.body.style.cursor = 'default'; }}
    />
  );
}

// ── Particles ─────────────────────────────────────────────
function Particles() {
  const ref = useRef();
  const count = 80;
  const positions = useMemo(() => {
    // Deterministic scatter (stable across renders, no Math.random in render).
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.sin(i * 12.9898) * 43758.5453;
      const b = Math.sin(i * 78.233) * 12543.2341;
      const c = Math.sin(i * 39.425) * 26251.1123;
      p[i * 3] = ((a - Math.floor(a)) - 0.5) * 80;
      p[i * 3 + 1] = (b - Math.floor(b)) * 25 + 5;
      p[i * 3 + 2] = ((c - Math.floor(c)) - 0.5) * 80;
    }
    return p;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const arr = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) arr[i * 3 + 1] += Math.sin(t * 0.2 + i) * 0.001;
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#ffffff" transparent opacity={0.12} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ── Camera Animator ───────────────────────────────────────
function CameraAnimator({ target, controlsRef }) {
  const { camera } = useThree();
  const animating = useRef(false);
  const targetPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());

  useEffect(() => {
    if (target) {
      const { center, size } = target;
      const dist = Math.max(size.x, size.y, size.z) * 3;
      targetPos.current.set(center.x + dist * 0.5, center.y + dist * 0.6, center.z + dist * 0.5);
      targetLookAt.current.copy(center);
      animating.current = true;
    }
  }, [target]);

  useFrame(() => {
    if (!animating.current || !controlsRef.current) return;

    camera.position.lerp(targetPos.current, 0.04);
    controlsRef.current.target.lerp(targetLookAt.current, 0.04);
    controlsRef.current.update();

    if (camera.position.distanceTo(targetPos.current) < 0.3) {
      animating.current = false;
    }
  });

  return null;
}

// ── Main Scene ────────────────────────────────────────────
export default function CityScene({ onBuildingClick, selectedBuilding, controlsRef, onSceneReady, cameraTarget }) {
  const { scene } = useGLTF('/models/street_city.glb');
  const { camera } = useThree();
  const [hoveredBuilding, setHoveredBuilding] = useState(null);
  const sceneReadyCalled = useRef(false);

  // Shadow/material tuning is an imperative update to the loaded GLTF.
  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      const m = child.material;
      if (m && (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial)) {
        m.envMapIntensity = 1.0;
        m.roughness = Math.min(Math.max(m.roughness, 0.3), 0.85);
        m.metalness = Math.max(m.metalness, 0.05);
        m.needsUpdate = true;
      }
    });
  }, [scene]);

  // Derive the clickable-building list straight from the loaded scene.
  const buildingMeshes = useMemo(() => {
    if (!scene) return [];

    const meshes = [];
    scene.traverse((child) => { if (child.isMesh) meshes.push(child); });

    const meshesWithSize = meshes.map((m) => {
      const box = new THREE.Box3().setFromObject(m);
      const size = new THREE.Vector3(); box.getSize(size);
      const center = new THREE.Vector3(); box.getCenter(center);
      return { mesh: m, volume: size.x * size.y * size.z, height: size.y, center, size };
    }).filter(item => item.height > 0.5);

    meshesWithSize.sort((a, b) => b.volume - a.volume);

    // Pick ALL distinct buildings (not just 3)
    const assigned = [];
    const usedPositions = [];

    for (const item of meshesWithSize) {
      // Cap at the catalog size so every clickable building has apartments.
      if (assigned.length >= BUILDING_NAMES.length) break;
      if (item.height < 0.8) continue;

      const tooClose = usedPositions.some(pos => item.center.distanceTo(pos) < 2.5);
      if (tooClose) continue;

      assigned.push(item);
      usedPositions.push(item.center.clone());
    }

    const stats = (h, a, idx) => [
      { label: 'Floors', value: String(Math.max(2, Math.round(h * 3))) },
      { label: 'Area (m²)', value: String(Math.round(a * 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',') },
      { label: 'Units', value: String(Math.max(4, Math.round(a * 2))) },
      { label: 'Built', value: String(2015 + ((idx * 3) % 10)) },
    ];

    return assigned.map((item, idx) => {
      const nameData = BUILDING_NAMES[idx % BUILDING_NAMES.length];
      return {
        building: {
          id: `building-${idx}`,
          buildingIndex: idx,
          name: nameData.name,
          subtitle: nameData.subtitle,
          description: nameData.desc,
          stats: stats(item.height, item.size.x * item.size.z, idx),
          labelPosition: [item.center.x, item.center.y + item.size.y / 2 + 1.5, item.center.z],
          cameraTarget: { center: item.center.clone(), size: item.size.clone() },
        },
        meshRef: item.mesh,
      };
    });
  }, [scene]);

  // Signal the loading screen once the scene has produced its buildings.
  useEffect(() => {
    if (buildingMeshes.length === 0 || sceneReadyCalled.current) return undefined;
    sceneReadyCalled.current = true;
    const timer = setTimeout(() => onSceneReady?.(), 500);
    return () => clearTimeout(timer);
  }, [buildingMeshes, onSceneReady]);

  useEffect(() => {
    if (!scene) return;
    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3(); const size = new THREE.Vector3();
    box.getCenter(center); box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const dist = maxDim * 1.8;
    camera.position.set(center.x + dist * 0.6, center.y + dist * 0.5, center.z + dist * 0.6);
    camera.lookAt(center);
    if (controlsRef.current) { controlsRef.current.target.copy(center); controlsRef.current.update(); }
  }, [scene, camera, controlsRef]);

  return (
    <>
      {/* Stable lighting - no flickering */}
      <ambientLight intensity={1.2} color="#e0e0e8" />
      <directionalLight position={[30, 50, 25]} intensity={2.5} color="#ffffff" castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-far={120} shadow-camera-left={-50} shadow-camera-right={50}
        shadow-camera-top={50} shadow-camera-bottom={-50} shadow-bias={-0.0003} />
      <directionalLight position={[-25, 25, -20]} intensity={1.0} color="#d8d8f0" />
      <directionalLight position={[-15, 20, 30]} intensity={0.8} color="#ffffff" />
      <hemisphereLight args={['#222244', '#000000', 0.5]} />
      <pointLight position={[0, 18, 0]} color="#fff" intensity={1.5} distance={50} decay={2} />
      <pointLight position={[15, 12, -8]} color="#e8e8e8" intensity={1.0} distance={40} decay={2} />
      <pointLight position={[-10, 10, 10]} color="#e8e8e8" intensity={0.8} distance={35} decay={2} />

      <fog attach="fog" args={['#000000', 60, 160]} />

      {/* Ground - no z-fighting */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#050505" roughness={0.95} metalness={0} />
      </mesh>
      <gridHelper args={[300, 100, '#151515', '#0c0c0c']} position={[0, 0.01, 0]} />

      <primitive object={scene} />
      <Particles />

      {/* Camera animation */}
      <CameraAnimator target={cameraTarget} controlsRef={controlsRef} />

      {/* All building labels */}
      {buildingMeshes.map(({ building, meshRef }) => (
        <group key={building.id}>
          <BuildingLabel building={building} onClick={onBuildingClick} isSelected={selectedBuilding?.id === building.id} />
          <ClickableBuilding meshRef={meshRef} building={building} onClick={onBuildingClick}
            isSelected={selectedBuilding?.id === building.id}
            isHovered={hoveredBuilding === building.id}
            onHover={(h) => setHoveredBuilding(h ? building.id : null)} />
        </group>
      ))}

      <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.08}
        rotateSpeed={0.5} zoomSpeed={0.8} panSpeed={0.5}
        minDistance={5} maxDistance={80}
        maxPolarAngle={Math.PI / 2.15} minPolarAngle={0.1}
        enablePan makeDefault />
    </>
  );
}

useGLTF.preload('/models/street_city.glb');
