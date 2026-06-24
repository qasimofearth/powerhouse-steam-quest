import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { RespirationBuilderInteraction, InteractionState } from './interface';
import { useGateComplete } from './useGate';
import VizStage from './viz-stage';

interface Props {
  interaction: RespirationBuilderInteraction;
  interactionState?: InteractionState;
  onInteraction: (state: InteractionState) => void;
  onSubmit?: () => void;
  isSubmitTriggered?: boolean;
}

// "Build the Energy Line" in 3D: feed FUEL (glucose) + OXYGEN into a real 3D
// mitochondrion and watch ATP stream out (with water + CO2 as waste). Both
// inputs are needed for full output; fuel-only gives just a tiny backup trickle.

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const MITO_X = -0.9;       // mitochondrion sits left of center…
const IN_X = -4.6;         // inputs stream in from the far left
const OUT_X = MITO_X + 1.7; // …so ATP can stream OUT into open space on the right

interface Shared {
  fuel: boolean;
  oxy: boolean;
  level: number; // 0..1 smoothed output
  atp: number;
  atpAccum: number;
  ins: { x: number; y: number; z: number; k: 0 | 1; on: boolean }[]; // k:0 glucose,1 oxygen
  outs: { x: number; y: number; z: number; life: number; t: 0 | 1 | 2 }[]; // 0 atp,1 h2o,2 co2
}

const GOLD = new THREE.Color('#e7c869');
const CYAN = new THREE.Color('#5aa9ff');

/** The 3D mitochondrion engine; brightness tracks output level. */
const Mito: React.FC<{ shared: React.MutableRefObject<Shared> }> = ({ shared }) => {
  const matrix = useRef<THREE.MeshStandardMaterial>(null);
  const core = useRef<THREE.Mesh>(null);
  const cristae = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const lvl = shared.current.level;
    if (matrix.current) matrix.current.emissiveIntensity = 0.2 + lvl * 0.9;
    if (core.current) {
      const s = 0.5 + lvl * 0.5 + Math.sin(clock.elapsedTime * 4) * lvl * 0.12;
      core.current.scale.setScalar(s);
      (core.current.material as THREE.MeshBasicMaterial).opacity = 0.25 + lvl * 0.5;
    }
    if (cristae.current) cristae.current.rotation.x = clock.elapsedTime * 0.2;
  });
  const rings = useMemo(() => [-0.7, -0.35, 0, 0.35, 0.7], []);
  return (
    <group>
      {/* matrix volume */}
      <mesh scale={[1.5, 0.96, 0.96]}>
        <sphereGeometry args={[1, 36, 28]} />
        <meshStandardMaterial ref={matrix} color="#6b4ea8" emissive="#7a3df0" emissiveIntensity={0.3} roughness={0.6} transparent opacity={0.92} />
      </mesh>
      {/* cristae folds */}
      <group ref={cristae}>
        {rings.map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.4]}>
            <torusGeometry args={[0.72 * Math.sqrt(Math.max(0.05, 1 - (x / 1.5) ** 2)), 0.07, 12, 32]} />
            <meshStandardMaterial color="#5a93ff" emissive="#1d4ba8" emissiveIntensity={0.6} roughness={0.35} />
          </mesh>
        ))}
      </group>
      {/* glowing energy core */}
      <mesh ref={core}>
        <sphereGeometry args={[0.6, 20, 20]} />
        <meshBasicMaterial color="#ffe08a" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* translucent gold outer membrane */}
      <mesh scale={[1.62, 1.08, 1.08]}>
        <sphereGeometry args={[1, 40, 28]} />
        <meshStandardMaterial color="#e7c869" emissive="#e7c869" emissiveIntensity={0.12} transparent opacity={0.16} roughness={0.2} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
};

const Particles: React.FC<{ shared: React.MutableRefObject<Shared> }> = ({ shared }) => {
  const ins = useRef<THREE.InstancedMesh>(null);
  const outs = useRef<THREE.InstancedMesh>(null);
  const atpGlow = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const NIN = 60, NOUT = 40;

  if (shared.current.ins.length === 0) {
    shared.current.ins = Array.from({ length: NIN }, (_, i) => ({
      x: rand(IN_X - 1.5, IN_X), y: rand(-1, 1), z: rand(-0.8, 0.8), k: (i % 2) as 0 | 1, on: false,
    }));
  }

  useFrame((_, dRaw) => {
    const dt = Math.min(0.05, dRaw);
    const S = shared.current;
    const target = !S.fuel ? 0 : S.oxy ? 1 : 0.12;
    S.level += (target - S.level) * Math.min(1, dt * 3);
    const lvl = S.level;

    // emit ATP + waste from the matrix
    S.atpAccum += lvl * 5 * dt;
    while (S.atpAccum >= 1) {
      S.atpAccum -= 1;
      S.atp++;
      S.outs.push({ x: OUT_X, y: rand(-0.7, 0.7), z: rand(-0.5, 0.5), life: 1, t: 0 });
      if (lvl > 0.4 && Math.random() < 0.4) S.outs.push({ x: OUT_X, y: rand(-0.8, 0.8), z: rand(-0.5, 0.5), life: 1, t: Math.random() < 0.5 ? 1 : 2 });
    }

    // inputs flow toward the mitochondrion (only the active kinds move)
    const ii = ins.current;
    S.ins.forEach((p, idx) => {
      const active = p.k === 0 ? S.fuel : S.oxy && S.fuel;
      if (active) {
        p.x += (2.2 + lvl) * dt;
        if (p.x > MITO_X) { p.x = rand(IN_X - 1.5, IN_X); p.y = rand(-1, 1); p.z = rand(-0.8, 0.8); }
      }
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.setScalar(active ? (p.k === 0 ? 0.14 : 0.1) : 0.0001);
      dummy.updateMatrix();
      ii?.setMatrixAt(idx, dummy.matrix);
      ii?.setColorAt(idx, p.k === 0 ? GOLD : CYAN);
    });
    if (ii) { ii.instanceMatrix.needsUpdate = true; if (ii.instanceColor) ii.instanceColor.needsUpdate = true; }

    // outputs drift right and fade — kept slow + short so they stay on-screen
    // in the open space to the right of the mitochondrion
    for (let i = S.outs.length - 1; i >= 0; i--) {
      const o = S.outs[i];
      o.x += 1.5 * dt;
      o.y += (o.t === 0 ? 0 : Math.sin(o.x * 3) * 0.4 * dt);
      o.life -= dt * 0.45;
      if (o.x > 4 || o.life <= 0) S.outs.splice(i, 1);
    }
    const oi = outs.current, gi = atpGlow.current;
    if (oi) {
      for (let i = 0; i < NOUT; i++) {
        const o = S.outs[i];
        if (o) {
          dummy.position.set(o.x, o.y, o.z);
          dummy.scale.setScalar(o.t === 0 ? 0.34 : 0.12);
          dummy.updateMatrix(); oi.setMatrixAt(i, dummy.matrix);
          oi.setColorAt(i, o.t === 0 ? new THREE.Color('#ffd166') : new THREE.Color('#c8cdd2'));
        } else { dummy.position.set(0, -999, 0); dummy.scale.setScalar(0.0001); dummy.updateMatrix(); oi.setMatrixAt(i, dummy.matrix); }
        // additive glow only for ATP tokens
        if (gi) {
          if (o && o.t === 0) { dummy.position.set(o.x, o.y, o.z); dummy.scale.setScalar(0.6); }
          else { dummy.position.set(0, -999, 0); dummy.scale.setScalar(0.0001); }
          dummy.updateMatrix(); gi.setMatrixAt(i, dummy.matrix);
        }
      }
      oi.instanceMatrix.needsUpdate = true; if (oi.instanceColor) oi.instanceColor.needsUpdate = true;
      if (gi) gi.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh ref={ins} args={[undefined, undefined, NIN]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial emissive="#ffffff" emissiveIntensity={0.4} roughness={0.4} toneMapped={false} />
      </instancedMesh>
      {/* ATP glow halo */}
      <instancedMesh ref={atpGlow} args={[undefined, undefined, NOUT]} frustumCulled={false}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color="#ffe08a" transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      {/* ATP tokens + waste */}
      <instancedMesh ref={outs} args={[undefined, undefined, NOUT]} frustumCulled={false}>
        <boxGeometry args={[1.3, 0.7, 0.4]} />
        <meshStandardMaterial color="#ffd166" emissive="#ffb300" emissiveIntensity={1.4} roughness={0.3} toneMapped={false} />
      </instancedMesh>
    </>
  );
};

const Tag: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <span style={{ whiteSpace: 'nowrap', fontFamily: 'Arial, sans-serif', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 999, border: `1.5px solid ${color}`, background: 'rgba(13,27,46,0.78)', color: '#fff' }}>{children}</span>
);

const Scene: React.FC<{ shared: React.MutableRefObject<Shared> }> = ({ shared }) => (
  <>
    <ambientLight intensity={0.9} />
    <directionalLight position={[4, 6, 5]} intensity={1.3} />
    <directionalLight position={[-4, 2, -3]} intensity={0.5} color="#7fb0ff" />
    <pointLight position={[0, 0, 4]} intensity={0.7} />
    <group position={[MITO_X, 0, 0]}>
      <Mito shared={shared} />
    </group>
    <Particles shared={shared} />
    <Html position={[IN_X + 0.6, 1.6, 0]} center style={{ pointerEvents: 'none' }}><Tag color="#e7c869">IN: glucose + oxygen</Tag></Html>
    <Html position={[OUT_X + 1.6, 1.6, 0]} center style={{ pointerEvents: 'none' }}><Tag color="#ffd166">OUT: ATP + waste</Tag></Html>
    <OrbitControls enablePan={false} minDistance={5} maxDistance={12} enableDamping dampingFactor={0.08} />
  </>
);

const RespirationBuilder: React.FC<Props> = ({ onInteraction }) => {
  const shared = useRef<Shared>({ fuel: true, oxy: true, level: 0, atp: 0, atpAccum: 0, ins: [], outs: [] });
  const reported = useRef(false);
  const markComplete = useGateComplete('respiration-builder');
  const [fuel, setFuel] = useState(true);
  const [oxygen, setOxygen] = useState(true);
  const [hud, setHud] = useState({ atp: 0, rate: 0 });

  React.useEffect(() => {
    const id = setInterval(() => setHud({ atp: shared.current.atp, rate: Math.round(shared.current.level * 100) }), 200);
    return () => clearInterval(id);
  }, []);

  const report = useCallback(() => {
    if (!reported.current) { reported.current = true; onInteraction({ isCorrect: true, isEmpty: false, value: 'fed-the-engine' }); }
  }, [onInteraction]);

  const toggleFuel = useCallback(() => { shared.current.fuel = !shared.current.fuel; setFuel(shared.current.fuel); report(); }, [report]);
  const toggleOxygen = useCallback(() => {
    shared.current.oxy = !shared.current.oxy; setOxygen(shared.current.oxy); report(); markComplete();
  }, [report, markComplete]);

  const note = !fuel
    ? 'No fuel, no energy.'
    : !oxygen
      ? 'No oxygen — only a tiny backup supply. This is why you can’t sprint forever.'
      : 'Both inputs flowing — the engine is at full power, ATP streaming out.';

  return (
    <div className="w-full h-full flex flex-col" style={{ color: '#fff' }}>
      <VizStage camera={{ position: [0, 1.2, 8], fov: 42 }} background="radial-gradient(circle at 50% 35%, #14304f 0%, #0a1b30 75%)">
        <Scene shared={shared} />
      </VizStage>
      <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.96)', color: '#222', marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
          <button onClick={toggleFuel} style={{ background: fuel ? '#caa83f' : '#9a9a9a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, cursor: 'pointer' }}>
            Fuel (glucose): {fuel ? 'ON' : 'OFF'}
          </button>
          <button onClick={toggleOxygen} style={{ background: oxygen ? '#5aa9ff' : '#9a9a9a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, cursor: 'pointer' }}>
            Oxygen: {oxygen ? 'ON' : 'OFF'}
          </button>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0E7C86' }}>ATP rate</div>
            <div style={{ height: 10, borderRadius: 6, background: '#eee', overflow: 'hidden' }}>
              <div style={{ width: `${hud.rate}%`, height: '100%', background: 'linear-gradient(90deg,#0E7C86,#ffd166)', transition: 'width .2s' }} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 14, fontWeight: 600, flexWrap: 'wrap' }}>
          <span style={{ color: '#0E7C86' }}>ATP made: {hud.atp}</span>
          <span>Rate: {hud.rate}%</span>
        </div>
        <div style={{ fontSize: 13, marginTop: 6, color: '#555' }}>{note}</div>
        <div style={{ fontSize: 12, marginTop: 6, color: '#777' }}>
          Two things go IN — fuel + oxygen. ATP comes OUT, with water + CO₂ as waste. Drag to orbit the engine.
        </div>
      </div>
    </div>
  );
};

export default RespirationBuilder;
