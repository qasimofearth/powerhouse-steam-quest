import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { AtpSynthaseInteraction, InteractionState } from './interface';
import VizStage from './viz-stage';
import { useGateComplete, useFlagSetter } from './useGate';

interface Props {
  interaction: AtpSynthaseInteraction;
  interactionState?: InteractionState;
  onInteraction: (state: InteractionState) => void;
  onSubmit?: () => void;
  isSubmitTriggered?: boolean;
}

// ATP synthase as a 3D molecular turbine embedded in the inner membrane.
// The ETC pump (left) loads protons into the intermembrane space (the "dam");
// they rush DOWN through the rotor, spinning it to snap out ATP in the matrix.
// Cut the oxygen and the gradient drains and the turbine stalls.

const ROTOR_X = 0;
const PUMP_X = -2.7;
const X_MIN = -3.4;
const X_MAX = 3.4;
const Z_HALF = 1.1;
const MEM_HALF = 0.34; // membrane half thickness (y)
const IMS_TOP = 2.1;
const MAT_BOT = -2.1;

type PState = 'res' | 'thru' | 'mat' | 'pump';
interface Proton { x: number; y: number; z: number; vx: number; vz: number; s: PState; }
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const PCOUNT = 80;

interface Shared {
  g: number; oxy: boolean; boost: number; angle: number; atp: number; atpAccum: number;
  protons: Proton[];
  tokens: { x: number; y: number; z: number; life: number }[];
}

const CYAN = new THREE.Color('#7fc4ff');
const YEL = new THREE.Color('#ffd166');

const Turbine: React.FC<{ shared: React.MutableRefObject<Shared> }> = ({ shared }) => {
  const rotor = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  useFrame(() => {
    const a = shared.current.angle;
    if (rotor.current) rotor.current.rotation.y = a;
    if (head.current) head.current.rotation.y = a;
  });
  return (
    <group position={[ROTOR_X, 0, 0]}>
      {/* a-subunit channel guide (static) */}
      <mesh position={[-0.62, 0, 0]}>
        <boxGeometry args={[0.22, MEM_HALF * 2, 0.5]} />
        <meshStandardMaterial color="#2f8f9c" roughness={0.5} />
      </mesh>
      {/* F0 rotor (spins in the membrane) */}
      <group ref={rotor}>
        <mesh>
          <cylinderGeometry args={[0.52, 0.52, MEM_HALF * 2, 24]} />
          <meshStandardMaterial color="#7d6cf0" emissive="#3a2c9a" emissiveIntensity={0.35} roughness={0.4} />
        </mesh>
        {Array.from({ length: 10 }).map((_, i) => {
          const ang = (i / 10) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(ang) * 0.52, 0, Math.sin(ang) * 0.52]}>
              <boxGeometry args={[0.12, MEM_HALF * 2, 0.12]} />
              <meshStandardMaterial color="#b9acff" emissive="#5a48d0" emissiveIntensity={0.4} />
            </mesh>
          );
        })}
      </group>
      {/* central stalk into the matrix */}
      <mesh position={[0, -0.78, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 1.2, 12]} />
        <meshStandardMaterial color="#d7d0ff" emissive="#7a6cf0" emissiveIntensity={0.3} />
      </mesh>
      {/* F1 head: three catalytic lobes in the matrix */}
      <group ref={head} position={[0, -1.5, 0]}>
        {Array.from({ length: 3 }).map((_, i) => {
          const ang = (i / 3) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(ang) * 0.3, 0, Math.sin(ang) * 0.3]}>
              <sphereGeometry args={[0.34, 20, 20]} />
              <meshStandardMaterial color="#8f7bff" emissive="#4a37b0" emissiveIntensity={0.4} roughness={0.35} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};

const Protons: React.FC<{ shared: React.MutableRefObject<Shared> }> = ({ shared }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  if (shared.current.protons.length === 0) {
    shared.current.protons = Array.from({ length: PCOUNT }, () => ({
      x: rand(X_MIN, X_MAX), y: rand(MEM_HALF + 0.2, IMS_TOP), z: rand(-Z_HALF, Z_HALF),
      vx: rand(-0.6, 0.6), vz: rand(-0.4, 0.4), s: 'res' as PState,
    }));
  }

  useFrame((_, dRaw) => {
    const dt = Math.min(0.05, dRaw);
    const S = shared.current;
    const oxy = S.oxy;
    S.boost = Math.max(0, S.boost - dt * 0.7);
    if (oxy) S.g = Math.min(1, S.g + dt * (0.15 + S.boost * 1.1));
    else S.g = Math.max(0, S.g - dt * 0.22);
    const g = S.g;
    const turns = g * g * 9;
    S.angle += turns * dt * Math.PI * 2;
    S.atpAccum += turns * dt;
    while (S.atpAccum >= 1.2) {
      S.atpAccum -= 1.2;
      S.atp++;
      S.tokens.push({ x: ROTOR_X + rand(-0.3, 0.3), y: -1.9, z: rand(-0.3, 0.3), life: 1 });
    }
    const flow = turns / 9;

    const inst = ref.current;
    S.protons.forEach((p, i) => {
      if (p.s === 'res') {
        p.x += p.vx * dt; p.z += p.vz * dt;
        p.y += (-g * 0.9) * dt;
        if (p.x < X_MIN || p.x > X_MAX) p.vx *= -1;
        if (p.z < -Z_HALF || p.z > Z_HALF) p.vz *= -1;
        if (p.y < MEM_HALF + 0.12) p.y = MEM_HALF + 0.12;
        if (p.y > IMS_TOP) p.y = IMS_TOP;
        if (flow > 0.05 && Math.abs(p.x - ROTOR_X) < 0.6 && Math.abs(p.z) < 0.6 && p.y < MEM_HALF + 0.4 && Math.random() < flow * 0.06) {
          p.s = 'thru';
        }
      } else if (p.s === 'thru') {
        p.x += (ROTOR_X - p.x) * 0.2; p.z += (0 - p.z) * 0.2;
        p.y -= (1.4 + flow * 2.2) * dt;
        if (p.y < -MEM_HALF - 0.2) p.s = 'mat';
      } else if (p.s === 'mat') {
        p.x += -0.6 * dt; p.y += -0.2 * dt;
        if (p.y < MAT_BOT || Math.random() < dt * 0.5) p.s = oxy ? 'pump' : 'res';
        if (p.s === 'res') { p.x = rand(X_MIN, X_MAX); p.y = rand(MEM_HALF + 0.3, IMS_TOP); }
      } else {
        p.x += (PUMP_X - p.x) * 0.12; p.y += 1.8 * dt;
        if (p.y > MEM_HALF + 0.3) { p.s = 'res'; p.x = PUMP_X + rand(-0.4, 0.4); p.vx = rand(-0.6, 0.6); }
      }
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.setScalar(p.s === 'thru' ? 1.3 : 1);
      dummy.updateMatrix();
      inst?.setMatrixAt(i, dummy.matrix);
      inst?.setColorAt(i, p.s === 'thru' ? YEL : CYAN);
    });
    if (inst) {
      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, PCOUNT]}>
      <sphereGeometry args={[0.1, 10, 10]} />
      <meshStandardMaterial emissive="#2aa6e0" emissiveIntensity={0.8} toneMapped={false} />
    </instancedMesh>
  );
};

const AtpTokens: React.FC<{ shared: React.MutableRefObject<Shared> }> = ({ shared }) => {
  const POOL = 16;
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((_, dRaw) => {
    const dt = Math.min(0.05, dRaw);
    const toks = shared.current.tokens;
    for (let i = toks.length - 1; i >= 0; i--) {
      toks[i].y -= 0.9 * dt;
      toks[i].life -= dt * 0.6;
      if (toks[i].life <= 0) toks.splice(i, 1);
    }
    const inst = ref.current;
    if (!inst) return;
    for (let i = 0; i < POOL; i++) {
      const t = toks[i];
      if (t) {
        dummy.position.set(t.x, t.y, t.z);
        dummy.scale.setScalar(Math.max(0.001, Math.min(1, t.life)) * 0.9);
      } else {
        dummy.scale.setScalar(0.0001);
      }
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, POOL]}>
      <boxGeometry args={[0.42, 0.24, 0.12]} />
      <meshStandardMaterial color="#ffd166" emissive="#a87a00" emissiveIntensity={0.5} toneMapped={false} />
    </instancedMesh>
  );
};

const Membrane: React.FC<{ shared: React.MutableRefObject<Shared> }> = ({ shared }) => {
  const pump = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    const on = shared.current.oxy && shared.current.g < 0.999;
    if (pump.current) pump.current.emissiveIntensity = on ? 0.9 : 0.1;
  });
  return (
    <group>
      <mesh>
        <boxGeometry args={[X_MAX - X_MIN + 1, MEM_HALF * 2, Z_HALF * 2 + 0.4]} />
        <meshStandardMaterial color="#c9a227" emissive="#5a4500" emissiveIntensity={0.25} roughness={0.6} transparent opacity={0.92} />
      </mesh>
      <mesh position={[PUMP_X, 0, 0]}>
        <boxGeometry args={[0.7, MEM_HALF * 2 + 0.15, 0.7]} />
        <meshStandardMaterial ref={pump} color="#1f9aa8" emissive="#0fd0c0" emissiveIntensity={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
};

const Tag: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <span style={{
    whiteSpace: 'nowrap', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 11, fontWeight: 700,
    padding: '2px 7px', borderRadius: 999, border: `1.5px solid ${color}`,
    background: 'rgba(13,27,46,0.78)', color: '#fff', boxShadow: '0 1px 5px rgba(0,0,0,0.5)',
  }}>{children}</span>
);

const Scene: React.FC<{ shared: React.MutableRefObject<Shared> }> = ({ shared }) => {
  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 6, 5]} intensity={1.2} />
      <directionalLight position={[-4, 2, -3]} intensity={0.4} color="#7fb0ff" />
      <mesh position={[0, (IMS_TOP + MEM_HALF) / 2 + 0.2, 0]}>
        <boxGeometry args={[X_MAX - X_MIN + 1, IMS_TOP - MEM_HALF, Z_HALF * 2 + 0.4]} />
        <meshStandardMaterial color="#2f6bd0" transparent opacity={0.07} depthWrite={false} />
      </mesh>
      <mesh position={[0, (MAT_BOT - MEM_HALF) / 2 - 0.2, 0]}>
        <boxGeometry args={[X_MAX - X_MIN + 1, Math.abs(MAT_BOT) - MEM_HALF, Z_HALF * 2 + 0.4]} />
        <meshStandardMaterial color="#5a3da0" transparent opacity={0.1} depthWrite={false} />
      </mesh>
      <Membrane shared={shared} />
      <Turbine shared={shared} />
      <Protons shared={shared} />
      <AtpTokens shared={shared} />
      <Html position={[PUMP_X, IMS_TOP + 0.1, 0]} center style={{ pointerEvents: 'none' }}>
        <Tag color="#0fd0c0">proton pump</Tag>
      </Html>
      <Html position={[ROTOR_X + 0.2, MAT_BOT - 0.1, 0]} center style={{ pointerEvents: 'none' }}>
        <Tag color="#b9acff">ATP synthase</Tag>
      </Html>
      <Html position={[X_MIN + 0.6, IMS_TOP - 0.1, 0]} center style={{ pointerEvents: 'none' }}>
        <Tag color="#7fc4ff">intermembrane space — the “dam”</Tag>
      </Html>
      <Html position={[X_MAX - 0.6, MAT_BOT + 0.1, 0]} center style={{ pointerEvents: 'none' }}>
        <Tag color="#c9b0ff">matrix — ATP made here</Tag>
      </Html>
      <OrbitControls enablePan={false} minDistance={5} maxDistance={12} enableDamping dampingFactor={0.08} />
    </>
  );
};

const AtpSynthase: React.FC<Props> = ({ onInteraction }) => {
  const shared = useRef<Shared>({ g: 0, oxy: true, boost: 0, angle: 0, atp: 0, atpAccum: 0, protons: [], tokens: [] });
  const reported = useRef(false);
  const markComplete = useGateComplete('atp-synthase');
  const setFlag = useFlagSetter('atp-synthase');
  const [oxygen, setOxygen] = useState(true);
  const [hud, setHud] = useState({ g: 0, rpm: 0, atp: 0 });

  React.useEffect(() => {
    const id = setInterval(() => {
      const S = shared.current;
      setHud({ g: Math.round(S.g * 100), rpm: Math.round(S.g * S.g * 90), atp: S.atp });
    }, 160);
    return () => clearInterval(id);
  }, []);

  const pump = useCallback(() => {
    shared.current.boost = Math.min(1.4, shared.current.boost + 0.6);
    if (!reported.current) {
      reported.current = true;
      onInteraction({ isCorrect: true, isEmpty: false, value: 'pumped' });
    }
    markComplete();
    setFlag({ pumped: true });
  }, [onInteraction, markComplete, setFlag]);

  const toggleOxygen = useCallback(() => {
    shared.current.oxy = !shared.current.oxy;
    setOxygen(shared.current.oxy);
    if (!shared.current.oxy) setFlag({ oxygenCut: true });
  }, [setFlag]);

  const power = Math.min(100, Math.round((hud.rpm / 90) * 100));

  return (
    <div className="w-full h-full flex flex-col" style={{ color: '#fff' }}>
      <VizStage camera={{ position: [0.5, 2.4, 8], fov: 42 }}
        background="radial-gradient(circle at 50% 30%, #14304f 0%, #0a1b30 75%)">
        <Scene shared={shared} />
      </VizStage>
      <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.96)', color: '#222', marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
          <button onClick={pump} style={{ background: '#6b58e0', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, cursor: 'pointer' }}>
            ⚡ Pump protons
          </button>
          <button onClick={toggleOxygen} style={{ background: oxygen ? '#0E7C86' : '#b00020', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, cursor: 'pointer' }}>
            Oxygen: {oxygen ? 'ON' : 'OFF'}
          </button>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#E0552B' }}>Cellular power output</div>
            <div style={{ height: 10, borderRadius: 6, background: '#eee', overflow: 'hidden' }}>
              <div style={{ width: `${power}%`, height: '100%', background: 'linear-gradient(90deg,#0E7C86,#E0552B)', transition: 'width .2s' }} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 14, fontWeight: 600, flexWrap: 'wrap' }}>
          <span>Gradient: {hud.g}%</span>
          <span>Spin: ~{hud.rpm}/sec</span>
          <span style={{ color: '#0E7C86' }}>ATP made: {hud.atp}</span>
        </div>
        <div style={{ fontSize: 13, marginTop: 6, color: '#555' }}>
          {oxygen
            ? 'The pump builds protons behind the “dam”; they rush DOWN through the turbine, spinning it to make ATP. Drag to orbit — each engine is your cellular power.'
            : 'No oxygen: the dam is draining, the turbine is stalling, ATP has flatlined. This is the wall you hit without air. Turn oxygen back on!'}
        </div>
      </div>
    </div>
  );
};

export default AtpSynthase;
