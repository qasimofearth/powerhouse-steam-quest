import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { BrownFatInteraction, InteractionState } from './interface';
import VizStage from './viz-stage';
import { useGateComplete, useFlagSetter } from './useGate';

interface Props {
  interaction: BrownFatInteraction;
  interactionState?: InteractionState;
  onInteraction: (state: InteractionState) => void;
  onSubmit?: () => void;
  isSubmitTriggered?: boolean;
}

// Brown fat: the same proton "dam" as ATP synthase, but with a second door
// (UCP1). Open UCP1 and protons leak AROUND the turbine — instead of ATP you
// get HEAT. The slider sets how open that back door is.

const TURBINE_X = -1.5;
const UCP_X = 1.6;
const X_MIN = -3.2;
const X_MAX = 3.2;
const Z_HALF = 1.0;
const MEM_HALF = 0.34;
const IMS_TOP = 2.0;
const MAT_BOT = -2.0;

type Path = 'turbine' | 'ucp';
interface Proton { x: number; y: number; z: number; vx: number; vz: number; flowing: boolean; path: Path; }
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const PCOUNT = 80;

interface Shared {
  open: number; angle: number; atp: number; atpAccum: number; heat: number;
  protons: Proton[];
}

const HOT = new THREE.Color('#E0552B');
const ATPY = new THREE.Color('#ffd166');
const COLD = new THREE.Color('#7fc4ff');

const Turbine: React.FC<{ shared: React.MutableRefObject<Shared> }> = ({ shared }) => {
  const rotor = useRef<THREE.Group>(null);
  useFrame(() => { if (rotor.current) rotor.current.rotation.y = shared.current.angle; });
  return (
    <group position={[TURBINE_X, 0, 0]}>
      <group ref={rotor}>
        <mesh>
          <cylinderGeometry args={[0.46, 0.46, MEM_HALF * 2, 22]} />
          <meshStandardMaterial color="#7d6cf0" emissive="#3a2c9a" emissiveIntensity={0.35} roughness={0.4} />
        </mesh>
        {Array.from({ length: 8 }).map((_, i) => {
          const ang = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(ang) * 0.46, 0, Math.sin(ang) * 0.46]}>
              <boxGeometry args={[0.11, MEM_HALF * 2, 0.11]} />
              <meshStandardMaterial color="#b9acff" emissive="#5a48d0" emissiveIntensity={0.4} />
            </mesh>
          );
        })}
      </group>
      <mesh position={[0, -0.7, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 1.0, 10]} />
        <meshStandardMaterial color="#d7d0ff" emissive="#7a6cf0" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, -1.3, 0]}>
        <sphereGeometry args={[0.42, 18, 18]} />
        <meshStandardMaterial color="#8f7bff" emissive="#4a37b0" emissiveIntensity={0.4} roughness={0.35} />
      </mesh>
    </group>
  );
};

// UCP1 "back door": a ring pore whose opening grows with openness.
const Ucp1: React.FC<{ shared: React.MutableRefObject<Shared> }> = ({ shared }) => {
  const inner = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    const o = shared.current.open;
    if (inner.current) inner.current.scale.setScalar(0.001 + o); // open hole grows
    if (mat.current) mat.current.emissiveIntensity = 0.3 + o * 0.9;
  });
  return (
    <group position={[UCP_X, 0, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.16, 12, 24]} />
        <meshStandardMaterial ref={mat} color="#d94f9a" emissive="#d94f9a" emissiveIntensity={0.4} roughness={0.4} />
      </mesh>
      {/* the visible "open hole" core that widens */}
      <mesh ref={inner}>
        <cylinderGeometry args={[0.26, 0.26, MEM_HALF * 2 + 0.05, 16]} />
        <meshStandardMaterial color="#2a0f1f" emissive="#d94f9a" emissiveIntensity={0.2} transparent opacity={0.6} />
      </mesh>
    </group>
  );
};

const Protons: React.FC<{ shared: React.MutableRefObject<Shared> }> = ({ shared }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  if (shared.current.protons.length === 0) {
    shared.current.protons = Array.from({ length: PCOUNT }, () => ({
      x: rand(X_MIN, X_MAX), y: rand(MEM_HALF + 0.2, IMS_TOP), z: rand(-Z_HALF, Z_HALF),
      vx: rand(-0.5, 0.5), vz: rand(-0.3, 0.3), flowing: false, path: 'turbine' as Path,
    }));
  }
  useFrame((_, dRaw) => {
    const dt = Math.min(0.05, dRaw);
    const S = shared.current;
    const open = S.open;
    const turbineFlow = (1 - open) * (1 - open);
    S.angle += turbineFlow * 9 * dt * Math.PI * 2;
    S.atpAccum += turbineFlow * 9 * dt;
    while (S.atpAccum >= 1.2) { S.atpAccum -= 1.2; S.atp++; }
    S.heat += (open - S.heat) * Math.min(1, dt * 1.5);

    const inst = ref.current;
    S.protons.forEach((p, i) => {
      if (!p.flowing) {
        p.x += p.vx * dt; p.z += p.vz * dt; p.y += -0.5 * dt;
        if (p.x < X_MIN || p.x > X_MAX) p.vx *= -1;
        if (p.z < -Z_HALF || p.z > Z_HALF) p.vz *= -1;
        if (p.y < MEM_HALF + 0.12) p.y = MEM_HALF + 0.12;
        if (p.y > IMS_TOP) p.y = IMS_TOP;
        const nearT = Math.abs(p.x - TURBINE_X) < 0.6 && Math.abs(p.z) < 0.6;
        const nearU = Math.abs(p.x - UCP_X) < 0.6 && Math.abs(p.z) < 0.6;
        if (nearT && p.y < MEM_HALF + 0.4 && Math.random() < turbineFlow * 0.07) { p.flowing = true; p.path = 'turbine'; }
        else if (nearU && p.y < MEM_HALF + 0.4 && Math.random() < open * 0.07) { p.flowing = true; p.path = 'ucp'; }
      } else {
        const tx = p.path === 'turbine' ? TURBINE_X : UCP_X;
        p.x += (tx - p.x) * 0.2; p.z += (0 - p.z) * 0.2;
        p.y -= (1.6 + (p.path === 'ucp' ? open : turbineFlow) * 2.0) * dt;
        if (p.y < MAT_BOT) { p.flowing = false; p.x = rand(X_MIN, X_MAX); p.y = rand(MEM_HALF + 0.3, IMS_TOP); }
      }
      const c = !p.flowing ? COLD : p.path === 'ucp' ? HOT : ATPY;
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.setScalar(p.flowing ? 1.2 : 1);
      dummy.updateMatrix();
      inst?.setMatrixAt(i, dummy.matrix);
      inst?.setColorAt(i, c);
    });
    if (inst) {
      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    }
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, PCOUNT]}>
      <sphereGeometry args={[0.1, 10, 10]} />
      <meshStandardMaterial emissive="#ffffff" emissiveIntensity={0.5} toneMapped={false} />
    </instancedMesh>
  );
};

// Heat shimmer: rising orange motes in the matrix, intensity tracks heat.
const HeatWaves: React.FC<{ shared: React.MutableRefObject<Shared> }> = ({ shared }) => {
  const N = 40;
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(() => Array.from({ length: N }, () => ({ x: rand(X_MIN, X_MAX), z: rand(-Z_HALF, Z_HALF), y: rand(MAT_BOT, -MEM_HALF), sp: rand(0.4, 1) })), []);
  useFrame((_, dRaw) => {
    const dt = Math.min(0.05, dRaw);
    const h = shared.current.heat;
    const inst = ref.current;
    if (!inst) return;
    seeds.forEach((s, i) => {
      s.y += s.sp * dt * (0.4 + h);
      if (s.y > -MEM_HALF) s.y = MAT_BOT;
      dummy.position.set(s.x, s.y, s.z);
      dummy.scale.setScalar(h > 0.05 ? 0.06 + h * 0.05 : 0.0001);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    });
    inst.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color="#ff7a33" emissive="#ff5a1e" emissiveIntensity={1} transparent opacity={0.7} toneMapped={false} />
    </instancedMesh>
  );
};

const Membrane: React.FC = () => (
  <mesh>
    <boxGeometry args={[X_MAX - X_MIN + 1, MEM_HALF * 2, Z_HALF * 2 + 0.4]} />
    <meshStandardMaterial color="#c9a227" emissive="#5a4500" emissiveIntensity={0.25} roughness={0.6} transparent opacity={0.92} />
  </mesh>
);

const MatrixVolume: React.FC<{ shared: React.MutableRefObject<Shared> }> = ({ shared }) => {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const cool = useMemo(() => new THREE.Color('#5a3da0'), []);
  const warm = useMemo(() => new THREE.Color('#c23a1e'), []);
  useFrame(() => {
    const h = shared.current.heat;
    if (mat.current) {
      mat.current.color.copy(cool).lerp(warm, h);
      mat.current.opacity = 0.12 + h * 0.22;
      mat.current.emissive.copy(warm);
      mat.current.emissiveIntensity = h * 0.5;
    }
  });
  return (
    <mesh position={[0, (MAT_BOT - MEM_HALF) / 2 - 0.1, 0]}>
      <boxGeometry args={[X_MAX - X_MIN + 1, Math.abs(MAT_BOT) - MEM_HALF, Z_HALF * 2 + 0.4]} />
      <meshStandardMaterial ref={mat} color="#5a3da0" transparent opacity={0.12} depthWrite={false} />
    </mesh>
  );
};

const Tag: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <span style={{
    whiteSpace: 'nowrap', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 11, fontWeight: 700,
    padding: '2px 7px', borderRadius: 999, border: `1.5px solid ${color}`,
    background: 'rgba(13,27,46,0.78)', color: '#fff', boxShadow: '0 1px 5px rgba(0,0,0,0.5)',
  }}>{children}</span>
);

const Scene: React.FC<{ shared: React.MutableRefObject<Shared> }> = ({ shared }) => (
  <>
    <ambientLight intensity={0.85} />
    <directionalLight position={[4, 6, 5]} intensity={1.2} />
    <directionalLight position={[-4, 2, -3]} intensity={0.4} color="#7fb0ff" />
    <mesh position={[0, (IMS_TOP + MEM_HALF) / 2 + 0.1, 0]}>
      <boxGeometry args={[X_MAX - X_MIN + 1, IMS_TOP - MEM_HALF, Z_HALF * 2 + 0.4]} />
      <meshStandardMaterial color="#2f6bd0" transparent opacity={0.07} depthWrite={false} />
    </mesh>
    <MatrixVolume shared={shared} />
    <Membrane />
    <Turbine shared={shared} />
    <Ucp1 shared={shared} />
    <Protons shared={shared} />
    <HeatWaves shared={shared} />
    <Html position={[TURBINE_X, MAT_BOT - 0.05, 0]} center style={{ pointerEvents: 'none' }}>
      <Tag color="#b9acff">ATP turbine</Tag>
    </Html>
    <Html position={[UCP_X, IMS_TOP + 0.1, 0]} center style={{ pointerEvents: 'none' }}>
      <Tag color="#d94f9a">UCP1 “back door”</Tag>
    </Html>
    <Html position={[X_MIN + 0.7, IMS_TOP - 0.1, 0]} center style={{ pointerEvents: 'none' }}>
      <Tag color="#7fc4ff">protons piled up (the “dam”)</Tag>
    </Html>
    <OrbitControls enablePan={false} minDistance={5} maxDistance={12} enableDamping dampingFactor={0.08} />
  </>
);

const BrownFat: React.FC<Props> = ({ onInteraction }) => {
  const shared = useRef<Shared>({ open: 0, angle: 0, atp: 0, atpAccum: 0, heat: 0, protons: [] });
  const reported = useRef(false);
  const markComplete = useGateComplete('brown-fat');
  const setFlag = useFlagSetter('brown-fat');
  const [openness, setOpenness] = useState(0);
  const [hud, setHud] = useState({ atp: 0, heat: 0 });

  React.useEffect(() => {
    const id = setInterval(() => {
      setHud({ atp: Math.floor(shared.current.atp), heat: Math.round(shared.current.heat * 100) });
    }, 160);
    return () => clearInterval(id);
  }, []);

  const handleSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    shared.current.open = v;
    setOpenness(v);
    if (!reported.current) {
      reported.current = true;
      onInteraction({ isCorrect: true, isEmpty: false, value: v });
    }
    if (v > 0.05) markComplete();
    if (v > 0.5) setFlag({ heat: true }); // slid toward "make heat"
  }, [onInteraction, markComplete, setFlag]);

  const opennessPct = Math.round(openness * 100);

  return (
    <div className="w-full h-full flex flex-col" style={{ color: '#fff' }}>
      <VizStage camera={{ position: [0.2, 2.2, 8], fov: 42 }}
        background="radial-gradient(circle at 50% 30%, #1b2540 0%, #0b132b 75%)">
        <Scene shared={shared} />
      </VizStage>
      <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.96)', color: '#222', marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
          <span style={{ color: '#0E7C86' }}>Make ENERGY (ATP)</span>
          <span style={{ color: '#E0552B' }}>Make HEAT</span>
        </div>
        <input type="range" min={0} max={100} value={opennessPct} onChange={handleSlider}
          aria-label="UCP1 back-door openness" style={{ width: '100%', accentColor: '#d94f9a' }} />
        <div style={{ display: 'flex', gap: 16, fontSize: 14, fontWeight: 600, marginTop: 6, flexWrap: 'wrap' }}>
          <span style={{ color: '#0E7C86' }}>ATP made: {hud.atp}</span>
          <span style={{ color: '#E0552B' }}>🌡 Heat: {hud.heat}%</span>
          <span style={{ color: '#d94f9a' }}>UCP1 open: {opennessPct}%</span>
        </div>
        <div style={{ fontSize: 13, marginTop: 6, color: '#555' }}>
          {openness < 0.3
            ? 'Back door closed: protons rush through the turbine → it spins → ATP is made and the cell stays cool.'
            : openness > 0.7
              ? 'Back door wide open: protons LEAK around the turbine through UCP1 → almost no ATP, and the lost energy escapes as HEAT. 🔥'
              : 'Cracking the back door open: some protons leak through UCP1, so the turbine slows and a little heat appears.'}
        </div>
        <div style={{ fontSize: 12, marginTop: 6, color: '#777' }}>
          Babies and hibernating animals are packed with brown fat — they open UCP1 to burn the gradient straight into
          body heat instead of ATP. Honest note: it burns some calories, but it&apos;s no magic weight-loss trick.
        </div>
      </div>
    </div>
  );
};

export default BrownFat;
