'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, PointerLockControls, Sky } from '@react-three/drei';
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
function ClickableBuilding({ building, position, colliderSize, onClick, isSelected, isHovered, onHover }) {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0,
    side: THREE.DoubleSide, depthWrite: false,
  }), []);

  useFrame(() => {
    const targetOpacity = isHovered ? 0.22 : isSelected ? 0.12 : 0;
    // eslint-disable-next-line react-hooks/immutability
    mat.opacity += (targetOpacity - mat.opacity) * 0.12;
    // eslint-disable-next-line react-hooks/immutability
    mat.color.setHex(isHovered ? 0x00ffff : 0xffffff);
  });

  return (
    <mesh
      position={position}
      material={mat}
      onClick={(e) => { e.stopPropagation(); onClick(building); }}
      onPointerOver={(e) => { e.stopPropagation(); onHover(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); onHover(false); document.body.style.cursor = 'default'; }}
    >
      <boxGeometry args={colliderSize} />
    </mesh>
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
      const dist = Math.max(size.x, size.y, size.z) * 3.5;
      targetPos.current.set(center.x, center.y + dist * 0.35, center.z + dist * 0.85);
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

// ── First-Person Walk Controller ───────────────────────────
function FirstPersonController() {
  const { camera } = useThree();
  const keys = useRef({ w: false, a: false, s: false, d: false });

  // Initialize camera position exactly on the black asphalt track in front of skyscrapers
  useEffect(() => {
    camera.position.set(-15, 9.8, 0);
    camera.rotation.set(0, Math.PI, 0); 
  }, [camera]);

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') keys.current.w = true;
      if (k === 's' || e.key === 'ArrowDown') keys.current.s = true;
      if (k === 'a' || e.key === 'ArrowLeft') keys.current.a = true;
      if (k === 'd' || e.key === 'ArrowRight') keys.current.d = true;
    };
    const handleKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') keys.current.w = false;
      if (k === 's' || e.key === 'ArrowDown') keys.current.s = false;
      if (k === 'a' || e.key === 'ArrowLeft') keys.current.a = false;
      if (k === 'd' || e.key === 'ArrowRight') keys.current.d = false;
    };
    const handleBlur = () => {
      keys.current.w = false;
      keys.current.s = false;
      keys.current.a = false;
      keys.current.d = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useFrame(() => {
    // Get movement directions relative to camera direction
    const direction = new THREE.Vector3();
    const frontVector = new THREE.Vector3();
    const sideVector = new THREE.Vector3();

    camera.getWorldDirection(direction);
    direction.y = 0; // Lock vertically
    direction.normalize();

    frontVector.copy(direction).multiplyScalar((keys.current.w ? 1 : 0) - (keys.current.s ? 1 : 0));
    
    const up = new THREE.Vector3(0, 1, 0);
    sideVector.copy(direction).cross(up).normalize().multiplyScalar((keys.current.d ? 1 : 0) - (keys.current.a ? 1 : 0));

    const moveVector = new THREE.Vector3();
    moveVector.addVectors(frontVector, sideVector);
    
    if (moveVector.lengthSq() > 0) {
      moveVector.normalize().multiplyScalar(0.42); // smooth speed factor
      
      // Bounding boxes of the 8 buildings to prevent passing through them
      const buildingsList = [
        { pos: [37.35, 3.83],   size: [13.94, 13.97] },
        { pos: [0.98, -50.68],  size: [14.74, 8.60] },
        { pos: [-19.56, -29.62], size: [14.26, 9.24] },
        { pos: [-33.78, -29.60], size: [15.98, 11.43] },
        { pos: [6.39, -43.97],  size: [13.42, 11.89] },
        { pos: [21.62, -21.13],  size: [12.55, 14.81] },
        { pos: [-48.46, -33.40], size: [15.08, 13.91] },
        { pos: [29.38, -9.26],   size: [12.69, 15.08] },
      ];

      // Wall-sliding collision logic
      // Try moving along X only
      const moveX = new THREE.Vector3(moveVector.x, 0, 0);
      const newPosX = camera.position.clone().add(moveX);
      let collisionX = false;
      for (const b of buildingsList) {
        const minX = b.pos[0] - b.size[0] / 2 - 1.5;
        const maxX = b.pos[0] + b.size[0] / 2 + 1.5;
        const minZ = b.pos[1] - b.size[1] / 2 - 1.5;
        const maxZ = b.pos[1] + b.size[1] / 2 + 1.5;
        if (newPosX.x >= minX && newPosX.x <= maxX && camera.position.z >= minZ && camera.position.z <= maxZ) {
          collisionX = true;
          break;
        }
      }
      if (!collisionX) camera.position.x += moveX.x;

      // Try moving along Z only
      const moveZ = new THREE.Vector3(0, 0, moveVector.z);
      const newPosZ = camera.position.clone().add(moveZ);
      let collisionZ = false;
      for (const b of buildingsList) {
        const minX = b.pos[0] - b.size[0] / 2 - 1.5;
        const maxX = b.pos[0] + b.size[0] / 2 + 1.5;
        const minZ = b.pos[1] - b.size[1] / 2 - 1.5;
        const maxZ = b.pos[1] + b.size[1] / 2 + 1.5;
        if (camera.position.x >= minX && camera.position.x <= maxX && newPosZ.z >= minZ && newPosZ.z <= maxZ) {
          collisionZ = true;
          break;
        }
      }
      if (!collisionZ) camera.position.z += moveZ.z;
    }

    // Keep camera height locked to eye-level (1.6 units above track ground height of 8.2)
    camera.position.y = 9.8;

    // Boundaries to prevent walking out of limits (clamped Z to prevent walking into the sea)
    camera.position.x = Math.max(-95, Math.min(65, camera.position.x));
    camera.position.z = Math.max(-105, Math.min(18, camera.position.z));
  });

  return null;
}

// ── Main Scene ────────────────────────────────────────────
export default function CityScene({ onBuildingClick, selectedBuilding, controlsRef, onSceneReady, cameraTarget, isWalkMode }) {
  const { scene } = useGLTF('/models/lowpoly_sea_track.glb');
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

  // Hardcoded coordinates optimized for lowpoly_sea_track.glb
  const buildingMeshes = useMemo(() => {
    const assignedData = [
      {
        name: 'Monte Carlo Casino',
        subtitle: 'Entertainment & Gaming',
        desc: 'The historic and world-famous Monaco landmark. Premier entertainment and gaming venue built in 1863.',
        pos: [37.35, 20.99, 3.83],
        size: [13.94, 32.22, 13.97],
        labelPos: [37.35, 38.0, 3.83],
        floors: '3',
        area: '2,500',
        units: '10',
        built: '1863'
      },
      {
        name: 'Larvotto Beach Tower',
        subtitle: 'Luxury Waterfront Residence',
        desc: 'Waterfront residential tower overlooking the sandy Larvotto coast, featuring premium luxury penthouses.',
        pos: [0.98, 21.06, -50.68],
        size: [14.74, 32.08, 8.60],
        labelPos: [0.98, 38.0, -50.68],
        floors: '90',
        area: '45,000',
        units: '60',
        built: '2018'
      },
      {
        name: 'Hôtel de Paris Block',
        subtitle: 'Premium Hotels & Suites',
        desc: 'Luxury grand hotel suites situated next to Casino Square. Built in 1864 with iconic architectural design.',
        pos: [-19.56, 16.66, -29.62],
        size: [14.26, 27.09, 9.24],
        labelPos: [-19.56, 31.5, -29.62],
        floors: '78',
        area: '36,000',
        units: '52',
        built: '1864'
      },
      {
        name: 'Port Hercule Residence',
        subtitle: 'Marinafront Estates',
        desc: 'Prime real estate directly facing the yacht marina. Houses exclusive grand balconies with F1 circuit views.',
        pos: [-33.78, 18.03, -29.60],
        size: [15.98, 26.30, 11.43],
        labelPos: [-33.78, 32.5, -29.60],
        floors: '72',
        area: '32,000',
        units: '48',
        built: '2015'
      },
      {
        name: 'Grimaldi Plaza',
        subtitle: 'Conventions & Arts',
        desc: 'The business, convention, and cultural center of Monaco. A state-of-the-art eco-building.',
        pos: [6.39, 21.06, -43.97],
        size: [13.42, 32.08, 11.89],
        labelPos: [6.39, 38.0, -43.97],
        floors: '78',
        area: '38,000',
        units: '56',
        built: '2020'
      },
      {
        name: 'La Condamine Offices',
        subtitle: 'Commercial District',
        desc: 'Modern commercial and retail workspace block in the historic market district.',
        pos: [21.62, 14.67, -21.13],
        size: [12.55, 19.93, 14.81],
        labelPos: [21.62, 26.0, -21.13],
        floors: '60',
        area: '20,000',
        units: '40',
        built: '2017'
      },
      {
        name: 'Jardin Exotique Heights',
        subtitle: 'Scenic View Apartments',
        desc: 'Residential heights built close to the exotic gardens, offering complete panoramic views of the sea.',
        pos: [-48.46, 20.90, -33.40],
        size: [15.08, 32.40, 13.91],
        labelPos: [-48.46, 38.0, -33.40],
        floors: '72',
        area: '30,000',
        units: '44',
        built: '2016'
      },
      {
        name: 'Princess Grace Plaza',
        subtitle: 'High-end Luxury Retail',
        desc: 'Prestige residences and luxury designer boutiques along the famous avenue.',
        pos: [29.38, 17.88, -9.26],
        size: [12.69, 26.37, 15.08],
        labelPos: [29.38, 32.5, -9.26],
        floors: '60',
        area: '22,000',
        units: '42',
        built: '2019'
      }
    ];

    return assignedData.map((item, idx) => {
      const stats = [
        { label: 'Floors', value: item.floors },
        { label: 'Area (m²)', value: item.area },
        { label: 'Units', value: item.units },
        { label: 'Built', value: item.built }
      ];

      const center = new THREE.Vector3(...item.pos);
      const size = new THREE.Vector3(...item.size);

      return {
        building: {
          id: `building-${idx}`,
          buildingIndex: idx,
          name: item.name,
          subtitle: item.subtitle,
          description: item.desc,
          stats: stats,
          labelPosition: item.labelPos,
          cameraTarget: { center: center.clone(), size: size.clone() },
        },
        position: item.pos,
        colliderSize: item.size
      };
    });
  }, []);

  // Signal the loading screen once the scene has produced its buildings.
  useEffect(() => {
    console.log("CityScene useEffect: scene = ", !!scene, "buildingMeshes length = ", buildingMeshes.length);
    if (buildingMeshes.length === 0 || sceneReadyCalled.current) return undefined;
    sceneReadyCalled.current = true;
    console.log("CityScene calling onSceneReady");
    const timer = setTimeout(() => onSceneReady?.(), 500);
    return () => clearTimeout(timer);
  }, [buildingMeshes, onSceneReady, scene]);

  // Set camera position to look from the sea/front towards the skyline
  useEffect(() => {
    if (!scene || isWalkMode) return;
    camera.position.set(0, 16, 75);
    if (controlsRef.current) {
      controlsRef.current.target.set(-10, 10, -18);
      controlsRef.current.update();
    }
  }, [scene, camera, controlsRef, isWalkMode]);

  return (
    <>
      {/* Stable lighting - no flickering */}
      <ambientLight intensity={2.2} color="#e6f0ff" />
      <directionalLight position={[40, 60, 30]} intensity={4.0} color="#ffffff" castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-far={250} shadow-camera-left={-100} shadow-camera-right={100}
        shadow-camera-top={100} shadow-camera-bottom={-100} shadow-bias={-0.0003} />
      <directionalLight position={[-40, 35, -30]} intensity={2.0} color="#90b0ff" />
      <directionalLight position={[-20, 30, 40]} intensity={1.5} color="#ffd8b0" />
      <hemisphereLight args={['#ffffff', '#0a0a15', 1.0]} />
      <pointLight position={[0, 30, 0]} color="#fff" intensity={2.0} distance={100} decay={1.5} />
      <pointLight position={[30, 20, -15]} color="#ffffff" intensity={1.5} distance={80} decay={1.5} />
      <pointLight position={[-20, 15, 20]} color="#ffffff" intensity={1.2} distance={70} decay={1.5} />

      <fog attach="fog" args={['#d0e0f5', 250, 650]} />
      <Sky sunPosition={[100, 50, 100]} inclination={0.6} azimuth={0.25} mieCoefficient={0.005} mieDirectionalG={0.8} rayleigh={3} turbidity={10} />

      <primitive object={scene} />
      <Particles />

      {/* Camera animator / walk controller */}
      {isWalkMode ? (
        <>
          <FirstPersonController />
          <PointerLockControls />
        </>
      ) : (
        <CameraAnimator target={cameraTarget} controlsRef={controlsRef} />
      )}

      {/* All building labels */}
      {buildingMeshes.map(({ building, position, colliderSize }) => (
        <group key={building.id}>
          <BuildingLabel building={building} onClick={onBuildingClick} isSelected={selectedBuilding?.id === building.id} />
          <ClickableBuilding building={building} position={position} colliderSize={colliderSize} onClick={onBuildingClick}
            isSelected={selectedBuilding?.id === building.id}
            isHovered={hoveredBuilding === building.id}
            onHover={(h) => setHoveredBuilding(h ? building.id : null)} />
        </group>
      ))}

      {!isWalkMode && (
        <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.08}
          rotateSpeed={0.6} zoomSpeed={0.8} panSpeed={1.2}
          minDistance={15} maxDistance={150}
          maxPolarAngle={Math.PI / 2.02} minPolarAngle={Math.PI / 2.5}
          enablePan makeDefault />
      )}
    </>
  );
}

useGLTF.preload('/models/lowpoly_sea_track.glb');
