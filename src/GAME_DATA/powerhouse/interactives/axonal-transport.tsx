import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { AxonalTransportInteraction, InteractionState } from './interface';
import VizStage from './viz-stage';
import { useGateComplete } from './useGate';

interface Props {
  interaction: AxonalTransportInteraction;
  interactionState?: InteractionState;
  onInteraction: (state: InteractionState) => void;
  onSubmit?: () => void;
  isSubmitTriggered?: boolean;
}

// "Mitochondrial railroad": neurons truck mitochondria down a long axon to keep
// distant synapses powered. Dispatch one, watch a motor protein carry it along
// the microtubule, and refuel synapses before their energy browns out.

const BODY_X = -2.7;
const TRACK_START = -2.0;
const TRACK_END = 2.1;
const TRACK_Y = 0;
const SYN = 3;
const CARGO_SPEED = 2.0; // units/sec
const SPAN = 6.6; // horizontal extent to keep in frame (cell body … synapses + labels)

const synPos = (i: number): [number, number, number] => [TRACK_END + 0.5, (i - (SYN - 1) / 2) * 1.0, 0];

interface Cargo { x: number; target: number; arrived: boolean; }
interface Shared { energy: number[]; cargo: Cargo[]; fire: number[]; clock: number; }

const Microtubule: React.FC = () => {
  // a tube with a helical tubulin pattern (instanced beads along two helices)
  const N = 120;
  const beads = useMemo(() => {
    const arr: [number, number, number][] = [];
    const len = TRACK_END - TRACK_START;
    for (let i = 0; i < N; i++) {
      const t = i / N;
      const x = TRACK_START + t * len;
      const a = t * Math.PI * 2 * 14;
      arr.push([x, Math.cos(a) * 0.22, Math.sin(a) * 0.22]);
      arr.push([x, Math.cos(a + Math.PI) * 0.22, Math.sin(a + Math.PI) * 0.22]);
    }
    return arr;
  }, []);
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[(TRACK_START + TRACK_END) / 2, TRACK_Y, 0]}>
        <cylinderGeometry args={[0.2, 0.2, TRACK_END - TRACK_START, 20]} />
        <meshStandardMaterial color="#4a4a63" roughness={0.7} />
      </mesh>
      {beads.map((p, i) => (
        <mesh key={i} position={[p[0], TRACK_Y + p[1], p[2]]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#6f6f93" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
};

const CellBody: React.FC = () => (
  <group position={[BODY_X, 0, 0]}>
    <mesh>
      <sphereGeometry args={[1.1, 32, 32]} />
      <meshStandardMaterial color="#9165e0" emissive="#5a3da0" emissiveIntensity={0.55} roughness={0.45} toneMapped={false} />
    </mesh>
    <mesh position={[-0.22, 0.16, 0.35]}>
      <sphereGeometry args={[0.46, 24, 24]} />
      <meshStandardMaterial color="#d3bdff" emissive="#7a5ad0" emissiveIntensity={0.5} toneMapped={false} />
    </mesh>
    {Array.from({ length: 6 }).map((_, i) => {
      const a = Math.PI * 0.6 + (i / 5) * Math.PI * 0.8;
      return (
        <mesh key={i} position={[Math.cos(a) * 1.2, Math.sin(a) * 1.2, 0]} rotation={[0, 0, a]}>
          <cylinderGeometry args={[0.05, 0.1, 1.0, 8]} />
          <meshStandardMaterial color="#9b7fd4" roughness={0.6} />
        </mesh>
      );
    })}
  </group>
);

const Synapse: React.FC<{ i: number; shared: React.MutableRefObject<Shared> }> = ({ i, shared }) => {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const glow = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const [dead, setDead] = useState(false);
  const pos = synPos(i);
  useFrame(({ clock }) => {
    const e = shared.current.energy[i];
    const lit = e > 0.02;
    // "fire" flash: spikes for ~0.7s right after a mitochondrion is delivered
    const since = clock.elapsedTime - (shared.current.fire[i] ?? -10);
    const flash = Math.max(0, 1 - since / 0.7);
    if (mat.current) {
      mat.current.emissiveIntensity = 0.15 + e * 1.2 + flash * 3.5;
      const f = flash;
      mat.current.color.setRGB(
        lit ? 0.6 + f * 0.4 : 0.29,
        lit ? 0.5 + f * 0.4 : 0.27,
        lit ? 0.83 : 0.35,
      );
    }
    if (glow.current) glow.current.scale.setScalar(1 + e * 0.8 + flash * 1.2);
    // expanding shockwave ring on fire
    if (ring.current && ringMat.current) {
      const s = 1 + (1 - flash) * 2.4;
      ring.current.scale.setScalar(flash > 0 ? s : 0.001);
      ring.current.visible = flash > 0.02;
      ringMat.current.opacity = flash * 0.8;
    }
    if (lit === dead) setDead(!lit);
  });
  return (
    <group position={pos}>
      <mesh ref={glow}>
        <sphereGeometry args={[0.34, 16, 16]} />
        <meshBasicMaterial color="#c9b3ff" transparent opacity={0.14} />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.05, 10, 32]} />
        <meshBasicMaterial ref={ringMat} color="#eaddff" transparent opacity={0} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.34, 24, 24]} />
        <meshStandardMaterial ref={mat} color="#9b7fd4" emissive="#b79cff" emissiveIntensity={0.6} roughness={0.4} toneMapped={false} />
      </mesh>
      {dead && (
        <Html position={[0, -0.55, 0]} center style={{ pointerEvents: 'none' }}>
          <span style={{ color: '#ff8a8a', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>brownout</span>
        </Html>
      )}
    </group>
  );
};

// y of the track path at a given x for a cargo heading to targetY
const pathY = (x: number, targetY: number) => {
  const tt = (x - TRACK_START) / (TRACK_END - TRACK_START);
  return TRACK_Y + Math.sin(x * 6) * 0.05 + targetY * Math.max(0, tt - 0.7) / 0.3 + 0.34;
};
const TRAIL = 7; // glow beads streaming behind each cargo

const Cargo: React.FC<{ shared: React.MutableRefObject<Shared>; onDeliver: () => void }> = ({ shared, onDeliver }) => {
  const POOL = 8;
  const core = useRef<THREE.InstancedMesh>(null);
  const halo = useRef<THREE.InstancedMesh>(null);
  const trail = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }, dRaw) => {
    const dt = Math.min(0.05, dRaw);
    const S = shared.current;
    S.clock = clock.elapsedTime;
    for (let i = 0; i < SYN; i++) S.energy[i] = Math.max(0, S.energy[i] - dt * 0.05);
    const survivors: Cargo[] = [];
    S.cargo.forEach((c) => {
      const dest = synPos(c.target);
      c.x += CARGO_SPEED * dt;
      if (c.x >= dest[0] - 0.2) {
        S.energy[c.target] = Math.min(1, S.energy[c.target] + 0.55);
        S.fire[c.target] = clock.elapsedTime; // trigger the synapse firing flash
        c.arrived = true;
        onDeliver();
      }
      if (!c.arrived) survivors.push(c);
    });
    S.cargo = survivors;

    const ci = core.current, hi = halo.current, ti = trail.current;
    if (!ci || !hi || !ti) return;
    const t = clock.elapsedTime;
    const pulse = 1 + Math.sin(t * 9) * 0.12;
    const haloPulse = 1 + Math.sin(t * 6) * 0.25;
    for (let i = 0; i < POOL; i++) {
      const c = S.cargo[i];
      const dest = c ? synPos(c.target) : [0, 0, 0];
      const y = c ? pathY(c.x, dest[1]) : -999;
      // core mitochondrion
      dummy.position.set(c ? c.x : 0, y, 0);
      dummy.scale.setScalar(c ? 1 : 0.0001);
      dummy.scale.set(c ? 0.5 * pulse : 0.0001, c ? 0.32 * pulse : 0.0001, c ? 0.32 * pulse : 0.0001);
      dummy.updateMatrix(); ci.setMatrixAt(i, dummy.matrix);
      // bright additive halo around it (the "energy")
      dummy.scale.setScalar(c ? 0.62 * haloPulse : 0.0001);
      dummy.updateMatrix(); hi.setMatrixAt(i, dummy.matrix);
      // trail beads streaming back along the track
      for (let k = 0; k < TRAIL; k++) {
        const idx = i * TRAIL + k;
        if (c && c.x - (k + 1) * 0.26 > TRACK_START - 0.2) {
          const tx = c.x - (k + 1) * 0.26;
          dummy.position.set(tx, pathY(tx, dest[1]), 0);
          const s = (0.34 - k * 0.04) * (0.8 + 0.4 * Math.sin(t * 12 - k));
          dummy.scale.setScalar(Math.max(0.02, s));
        } else {
          dummy.position.set(0, -999, 0); dummy.scale.setScalar(0.0001);
        }
        dummy.updateMatrix(); ti.setMatrixAt(idx, dummy.matrix);
      }
    }
    ci.instanceMatrix.needsUpdate = true;
    hi.instanceMatrix.needsUpdate = true;
    ti.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      {/* fading energy trail along the microtubule */}
      <instancedMesh ref={trail} args={[undefined, undefined, POOL * TRAIL]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color="#7dfbe6" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      {/* glowing halo (the traveling pulse of energy) */}
      <instancedMesh ref={halo} args={[undefined, undefined, POOL]}>
        <sphereGeometry args={[1, 14, 14]} />
        <meshBasicMaterial color="#5af0d8" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      {/* the mitochondrion itself */}
      <instancedMesh ref={core} args={[undefined, undefined, POOL]}>
        <sphereGeometry args={[1, 18, 14]} />
        <meshStandardMaterial color="#2dd4bf" emissive="#19e0c0" emissiveIntensity={1.2} roughness={0.35} toneMapped={false} />
      </instancedMesh>
    </group>
  );
};

// Pulls the camera back far enough that the full (wide) neuron stays in frame
// even when the split-screen panel is portrait-shaped, so it's never clipped to
// an empty-looking middle section.
const FitCamera: React.FC = () => {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / Math.max(1, size.height);
    const vFov = (cam.fov * Math.PI) / 180;
    // distance so the full vertical (~3.4) AND horizontal (SPAN) both fit
    const distV = 3.4 / (2 * Math.tan(vFov / 2));
    const distH = SPAN / (2 * Math.tan(vFov / 2) * aspect);
    const dist = Math.max(distV, distH) + 1.2;
    cam.position.set(0, 1.2, dist);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
};

const Scene: React.FC<{ shared: React.MutableRefObject<Shared>; onDeliver: () => void }> = ({ shared, onDeliver }) => (
  <>
    <ambientLight intensity={1.15} />
    <directionalLight position={[4, 6, 5]} intensity={1.5} />
    <directionalLight position={[-4, 2, -3]} intensity={0.7} color="#b79cff" />
    <pointLight position={[0, 0, 4]} intensity={0.6} />
    <FitCamera />
    <CellBody />
    <Microtubule />
    {Array.from({ length: SYN }).map((_, i) => <Synapse key={i} i={i} shared={shared} />)}
    <Cargo shared={shared} onDeliver={onDeliver} />
    <Html position={[BODY_X, -1.45, 0]} center style={{ pointerEvents: 'none' }}>
      <span style={{ color: '#e6dcff', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', textShadow: '0 1px 4px #000' }}>cell body</span>
    </Html>
    <Html position={[(TRACK_START + TRACK_END) / 2, -0.7, 0]} center style={{ pointerEvents: 'none' }}>
      <span style={{ color: '#c3c3e0', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', textShadow: '0 1px 4px #000' }}>microtubule track</span>
    </Html>
    <Html position={[TRACK_END + 0.6, 1.85, 0]} center style={{ pointerEvents: 'none' }}>
      <span style={{ color: '#e6dcff', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', textShadow: '0 1px 4px #000' }}>synapses</span>
    </Html>
    <OrbitControls enablePan={false} minDistance={5} maxDistance={16} enableDamping dampingFactor={0.08} />
  </>
);

const AxonalTransport: React.FC<Props> = ({ onInteraction }) => {
  const shared = useRef<Shared>({ energy: Array(SYN).fill(0.7), cargo: [], fire: Array(SYN).fill(-10), clock: 0 });
  const reported = useRef(false);
  const [powered, setPowered] = useState(SYN);
  const [delivered, setDelivered] = useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setPowered(shared.current.energy.filter((e) => e > 0.02).length);
    }, 200);
    return () => clearInterval(id);
  }, []);

  const send = useCallback(() => {
    let target = 0, lowest = Infinity;
    shared.current.energy.forEach((e, i) => { if (e < lowest) { lowest = e; target = i; } });
    shared.current.cargo.push({ x: TRACK_START, target, arrived: false });
    if (!reported.current) {
      reported.current = true;
      onInteraction({ isCorrect: true, isEmpty: false, value: 'dispatched-mitochondrion' });
    }
  }, [onInteraction]);

  const markComplete = useGateComplete('axonal-transport');
  const onDeliver = useCallback(() => { setDelivered((d) => d + 1); markComplete(); }, [markComplete]);
  const allDim = powered === 0;

  return (
    <div className="w-full h-full flex flex-col" style={{ color: '#fff' }}>
      <VizStage camera={{ position: [0, 1.2, 11], fov: 42 }}
        background="radial-gradient(circle at 50% 40%, #2a2456 0%, #14102e 70%, #0d0a1f 100%)">
        <Scene shared={shared} onDeliver={onDeliver} />
      </VizStage>
      <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.95)', color: '#222', marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
          <button onClick={send} style={{ background: '#2dd4bf', color: '#08312c', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, cursor: 'pointer' }}>
            🚚 Send mitochondrion
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: powered === SYN ? '#0E7C86' : '#b00020' }}>
            Synapses powered: {powered}/{SYN}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Deliveries: {delivered}</span>
        </div>
        <div style={{ fontSize: 13, color: '#555' }}>
          {allDim
            ? 'All synapses have browned out! Dispatch mitochondria to re-power them — they ride the microtubule to the hungriest synapse.'
            : 'Each synapse slowly drains energy. Click “Send mitochondrion” — a motor protein trucks it down the microtubule track to refuel the hungriest synapse. Drag to orbit.'}
        </div>
        <div style={{ fontSize: 12, marginTop: 6, color: '#777' }}>
          Axons can stretch ~1 meter long, so neurons must actively haul mitochondria to distant synapses. The brain burns
          ~20% of the body’s energy — and when this delivery system fails, problems appear early in diseases like
          Alzheimer’s and Parkinson’s.
        </div>
      </div>
    </div>
  );
};

export default AxonalTransport;
