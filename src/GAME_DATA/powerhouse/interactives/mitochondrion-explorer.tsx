import React, { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { MitochondrionExplorerInteraction, InteractionState } from './interface';
import VizStage from './viz-stage';
import { useGateComplete, useFlagSetter } from './useGate';

interface Props {
  interaction: MitochondrionExplorerInteraction;
  interactionState?: InteractionState;
  onInteraction: (state: InteractionState) => void;
  onSubmit?: () => void;
  isSubmitTriggered?: boolean;
}

type PartId = 'outer' | 'inter' | 'cristae' | 'matrix';

const PARTS: { id: PartId; label: string; color: string; text: string }[] = [
  { id: 'outer', label: 'Outer membrane', color: '#e7c869',
    text: 'The smooth outer wall — the mitochondrion’s outer boundary. Fairly porous, so small molecules pass straight through.' },
  { id: 'inter', label: 'Intermembrane space', color: '#7fd0ff',
    text: 'The narrow gap between the two membranes — where protons (H⁺) pile up to power the turbines (the “dam”).' },
  { id: 'cristae', label: 'Cristae (inner folds)', color: '#3f7fff',
    text: 'The deep folds of the inner membrane. Folding it like a scrunched bedsheet packs in huge surface area — more room for the machinery that makes energy. THIS is the key idea.' },
  { id: 'matrix', label: 'Matrix', color: '#9b7bff',
    text: 'The inner fluid space — home to the energy reactions, ribosomes, and the mitochondrion’s own circular DNA (mtDNA).' },
];

// ----- geometry constants (long axis = x) -----
const RX = 2.05; // outer semi-length
const RY = 1.18; // outer semi-height/depth
const INNER = 0.9; // inner-membrane scale factor relative to outer
const CRISTA_COUNT = 9;

// opacity helper: full when nothing or this part is selected, dim otherwise
const dim = (sel: PartId | null, id: PartId, on = 1, off = 0.12) =>
  sel === null || sel === id ? on : off;

/** Stacked inner-membrane folds — the visual star. Rings whose radius follows
 *  the ellipse profile, so they pack the lozenge silhouette like real cristae. */
const Cristae: React.FC<{ sel: PartId | null; onPick: (id: PartId) => void }> = ({ sel, onPick }) => {
  const grp = useRef<THREE.Group>(null);
  const active = sel === 'cristae';

  const rings = useMemo(() => {
    const out: { x: number; r: number }[] = [];
    for (let i = 0; i < CRISTA_COUNT; i++) {
      // span the inner length, skip the very tips
      const t = (i / (CRISTA_COUNT - 1)) * 2 - 1; // -1..1
      const x = t * RX * INNER * 0.92;
      const profile = Math.sqrt(Math.max(0, 1 - (x / (RX * INNER)) ** 2));
      const r = RY * INNER * profile * 0.96;
      if (r > 0.12) out.push({ x, r });
    }
    return out;
  }, []);

  useFrame(({ clock }) => {
    if (grp.current && active) {
      // gentle breathing pulse when cristae are highlighted
      const s = 1 + Math.sin(clock.elapsedTime * 2.2) * 0.03;
      grp.current.scale.set(1, s, s);
    } else if (grp.current) {
      grp.current.scale.set(1, 1, 1);
    }
  });

  const op = dim(sel, 'cristae');

  return (
    <group ref={grp} onClick={(e) => { e.stopPropagation(); onPick('cristae'); }}>
      {rings.map((ring, i) => (
        <group key={i} position={[ring.x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          {/* a fold = a flattened ring (torus) seated across the short axis */}
          <mesh scale={[1, 1, 0.34]}>
            <torusGeometry args={[ring.r, 0.085, 14, 40]} />
            <meshStandardMaterial
              color={active ? '#a9ccff' : '#5a93ff'}
              emissive={active ? '#3f7fff' : '#1d4ba8'}
              emissiveIntensity={active ? 1.0 : 0.6}
              roughness={0.3}
              metalness={0.1}
              transparent
              opacity={op}
            />
          </mesh>
          {/* ATP-synthase knobs studding the fold (only legible when focused) */}
          {active &&
            Array.from({ length: 7 }).map((_, k) => {
              const a = (k / 7) * Math.PI * 2;
              return (
                <mesh key={k} position={[Math.cos(a) * ring.r, Math.sin(a) * ring.r, 0]}>
                  <sphereGeometry args={[0.05, 10, 10]} />
                  <meshStandardMaterial color="#ffd166" emissive="#7a5a00" emissiveIntensity={0.5} />
                </mesh>
              );
            })}
        </group>
      ))}
    </group>
  );
};

/** Drifting protons in the intermembrane gap (the "dam"). */
const Protons: React.FC<{ sel: PartId | null }> = ({ sel }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const COUNT = 60;
  const seeds = useMemo(
    () =>
      Array.from({ length: COUNT }, () => ({
        u: Math.random() * Math.PI * 2,
        v: Math.acos(2 * Math.random() - 1),
        speed: 0.4 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
      })),
    [],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const active = sel === 'inter';

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    const shell = (INNER + 1) / 2; // midway between inner & outer membranes
    seeds.forEach((s, i) => {
      const u = s.u + t * s.speed * 0.3;
      const x = Math.cos(s.v) * RX * shell;
      const ringR = Math.sin(s.v) * RY * shell;
      const y = Math.cos(u) * ringR;
      const z = Math.sin(u) * ringR;
      const j = Math.sin(t * 2 + s.phase) * 0.02;
      dummy.position.set(x, y + j, z);
      dummy.scale.setScalar(active ? 1 : 0.0001);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[0.06, 8, 8]} />
      <meshStandardMaterial color="#9fe2ff" emissive="#2aa6e0" emissiveIntensity={1.1} />
    </instancedMesh>
  );
};

/** Matrix interior: faint volume + mtDNA loop + ribosomes. */
const Matrix: React.FC<{ sel: PartId | null; onPick: (id: PartId) => void }> = ({ sel, onPick }) => {
  const dna = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (dna.current) dna.current.rotation.z = clock.elapsedTime * 0.4;
  });
  const op = dim(sel, 'matrix');
  const focus = sel === 'matrix';

  return (
    <group onClick={(e) => { e.stopPropagation(); onPick('matrix'); }}>
      <mesh scale={[RX * INNER * 0.96, RY * INNER * 0.96, RY * INNER * 0.96]}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial
          color="#8b6bdf"
          transparent
          opacity={(focus ? 0.42 : 0.22) * (sel === null || focus ? 1 : 0.4)}
          roughness={1}
          depthWrite={false}
        />
      </mesh>
      {/* circular mtDNA */}
      <mesh ref={dna} position={[0, 0, 0]}>
        <torusGeometry args={[0.42, 0.035, 12, 60]} />
        <meshStandardMaterial color="#ffd166" emissive="#a87a00" emissiveIntensity={0.6} transparent opacity={op} />
      </mesh>
      {/* ribosomes */}
      {focus &&
        Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const rr = 0.9 + (i % 3) * 0.25;
          return (
            <mesh key={i} position={[Math.cos(a) * rr, Math.sin(a * 1.7) * 0.5, Math.sin(a) * rr * 0.6]}>
              <sphereGeometry args={[0.07, 10, 10]} />
              <meshStandardMaterial color="#ff8a4c" emissive="#5a2400" emissiveIntensity={0.4} />
            </mesh>
          );
        })}
    </group>
  );
};

/** Translucent ellipsoid membrane shell. */
const Shell: React.FC<{
  id: PartId;
  sel: PartId | null;
  scale: number;
  color: string;
  baseOpacity: number;
  onPick: (id: PartId) => void;
}> = ({ id, sel, scale, color, baseOpacity, onPick }) => {
  const focus = sel === id;
  const visible = dim(sel, id, 1, 0.18);
  return (
    <mesh
      scale={[RX * scale, RY * scale, RY * scale]}
      onClick={(e) => { e.stopPropagation(); onPick(id); }}
    >
      <sphereGeometry args={[1, 48, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={focus ? 0.55 : 0.12}
        transparent
        opacity={(focus ? baseOpacity * 2.4 : baseOpacity) * visible}
        roughness={0.2}
        metalness={0.15}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
};

/** Anchored, camera-facing label tags with a leader dot. */
const PartTags: React.FC<{ sel: PartId | null; onPick: (id: PartId) => void }> = ({ sel, onPick }) => {
  const anchors: Record<PartId, [number, number, number]> = {
    outer: [RX * 1.02, RY * 1.05, 0],
    inter: [-RX * 1.06, RY * 0.32, 0],
    cristae: [0.2, RY * 1.42, 0],
    matrix: [0, -RY * 1.4, 0.2],
  };
  return (
    <>
      {PARTS.map((p) => {
        const on = sel === null || sel === p.id;
        return (
          <Html key={p.id} position={anchors[p.id]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
            <button
              onClick={(e) => { e.stopPropagation(); onPick(p.id); }}
              style={{
                pointerEvents: 'auto',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontSize: 11,
                lineHeight: 1,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 999,
                border: `1.5px solid ${p.color}`,
                background: sel === p.id ? p.color : 'rgba(13,27,46,0.78)',
                color: sel === p.id ? '#0d1b2e' : '#fff',
                opacity: on ? 0.96 : 0.32,
                boxShadow: '0 1px 5px rgba(0,0,0,0.5)',
                transition: 'opacity .25s, background .25s',
              }}
            >
              {p.label}
            </button>
          </Html>
        );
      })}
    </>
  );
};

/** Smoothly frames the camera toward the selected part. */
const CameraRig: React.FC<{ sel: PartId | null }> = ({ sel }) => {
  const { camera } = useThree();
  const target = useMemo(() => {
    switch (sel) {
      case 'cristae': return new THREE.Vector3(1.8, 0.9, 3.8);
      case 'matrix': return new THREE.Vector3(0, 0.4, 3.6);
      case 'inter': return new THREE.Vector3(-2.6, 0.8, 3.8);
      case 'outer': return new THREE.Vector3(0.3, 0.6, 5.0);
      default: return new THREE.Vector3(1.1, 0.7, 4.6);
    }
  }, [sel]);
  useFrame(() => {
    camera.position.lerp(target, 0.045);
  });
  return null;
};

const Scene: React.FC<{ sel: PartId | null; onPick: (id: PartId) => void; spin: boolean }> = ({ sel, onPick, spin }) => {
  const grp = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (grp.current && spin && sel === null) grp.current.rotation.y += delta * 0.2;
  });
  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 6, 5]} intensity={1.3} />
      <directionalLight position={[-4, -2, -3]} intensity={0.5} color="#7fb0ff" />
      <pointLight position={[0, 0, 5]} intensity={0.8} />
      <CameraRig sel={sel} />
      <group ref={grp}>
        {/* opaque interior first, translucent shells after, for clean sorting */}
        <Cristae sel={sel} onPick={onPick} />
        <Matrix sel={sel} onPick={onPick} />
        <Protons sel={sel} />
        <Shell id="inter" sel={sel} scale={(INNER + 1) / 2} color="#7fd0ff" baseOpacity={0.1} onPick={onPick} />
        <Shell id="cristae" sel={sel} scale={INNER} color="#3f7fff" baseOpacity={0.07} onPick={onPick} />
        <Shell id="outer" sel={sel} scale={1} color="#e7c869" baseOpacity={0.2} onPick={onPick} />
        <PartTags sel={sel} onPick={onPick} />
      </group>
      <OrbitControls
        enablePan={false}
        minDistance={3.5}
        maxDistance={9}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
};

const MitochondrionExplorer: React.FC<Props> = ({ onInteraction }) => {
  const [sel, setSel] = useState<PartId | null>(null);
  const explored = useRef<Set<PartId>>(new Set());
  const reported = useRef(false);
  const [count, setCount] = useState(0);
  const markComplete = useGateComplete('mitochondrion-explorer');
  const setFlag = useFlagSetter('mitochondrion-explorer');

  const pick = (id: PartId) => {
    setSel(id);
    explored.current.add(id);
    setCount(explored.current.size);
    setFlag({ [id]: true }); // per-part flag so a dialog can require e.g. cristae
    if (!reported.current) {
      reported.current = true;
      onInteraction({ isCorrect: true, isEmpty: false, value: id });
    }
    if (explored.current.size >= 4) markComplete();
  };

  const selText = sel
    ? PARTS.find((p) => p.id === sel)!.text
    : 'Drag to rotate the mitochondrion. Tap a labelled part (in 3D or below) to explore it.';

  return (
    <div className="w-full h-full flex flex-col" style={{ color: '#fff' }}>
      <VizStage
        camera={{ position: [1.1, 0.7, 4.6], fov: 44 }}
        background="radial-gradient(circle at 50% 35%, #14304f 0%, #0d1b2e 70%)"
        overlay={
          <button
            onClick={() => setSel(null)}
            style={{
              position: 'absolute', top: 10, right: 10, zIndex: 5,
              border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8,
              background: 'rgba(13,27,46,0.7)', color: '#fff', fontSize: 12,
              padding: '5px 10px', cursor: 'pointer', fontWeight: 600,
            }}
          >
            ⟲ Reset view
          </button>
        }
      >
        <Scene sel={sel} onPick={pick} spin />
      </VizStage>

      <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.96)', color: '#222', marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {PARTS.map((p) => (
            <button key={p.id} onClick={() => pick(p.id)}
              style={{
                border: `2px solid ${p.color}`, borderRadius: 10, padding: '7px 12px', fontWeight: 700, cursor: 'pointer',
                background: sel === p.id ? p.color : '#fff', color: sel === p.id ? '#10233a' : '#222',
              }}>
              {p.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 15, lineHeight: '1.4', minHeight: 44 }}>
          {sel && <strong>{PARTS.find((p) => p.id === sel)!.label}: </strong>}
          {selText}
        </div>
        <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 10, paddingTop: 8 }}>
          <div style={{ color: '#0E7C86', fontWeight: 700, fontSize: 14 }}>
            Key idea: cristae fold to maximise surface area = more room for the machinery that makes energy
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            <span style={{ color: '#E0552B', fontWeight: 700, fontSize: 13 }}>{count} / 4 parts explored</span>
            <span style={{ color: '#667', fontSize: 13 }}>You’re looking at ONE — a single muscle cell holds ~1,000–2,000 of them.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MitochondrionExplorer;
