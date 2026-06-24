import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { EndosymbiosisInteraction, InteractionState } from './interface';
import VizStage from './viz-stage';
import { useGateComplete } from './useGate';

interface Props {
  interaction: EndosymbiosisInteraction;
  interactionState?: InteractionState;
  onInteraction: (state: InteractionState) => void;
  onSubmit?: () => void;
  isSubmitTriggered?: boolean;
}

// The endosymbiosis story in 3D: an ancestral host cell swallows a free-living
// bacterium ~1.5-2 billion years ago and keeps it instead of digesting it —
// over time it becomes the mitochondrion. Step through the merger, then play
// detective and collect 5 pieces of evidence to "close the case."

interface Step { caption: string; merge: number; }
const STEPS: Step[] = [
  { caption: 'A big host cell drifts beside a smaller free-living bacterium.', merge: 0 },
  { caption: 'The host engulfs the bacterium — wrapping it in its own membrane.', merge: 0.55 },
  { caption: 'Instead of digesting it, the host keeps it. A partnership begins.', merge: 0.85 },
  { caption: 'Over ~1.5–2 billion years it becomes a mitochondrion: the powerhouse.', merge: 1 },
];

interface Clue { id: string; title: string; detail: string; }
const CLUES: Clue[] = [
  { id: 'membrane', title: 'Double membrane', detail: 'It has TWO membranes — a leftover wrapper from being swallowed.' },
  { id: 'dna', title: 'Circular DNA', detail: 'It carries its own circular DNA — bacteria-style, not like the nucleus.' },
  { id: 'ribosomes', title: 'Bacterial ribosomes', detail: 'Its ribosomes look bacterial, and even respond to bacterial antibiotics.' },
  { id: 'divide', title: 'Divides on its own', detail: 'It splits in two by itself (binary fission), exactly like bacteria.' },
  { id: 'sequence', title: 'DNA family match', detail: 'Its DNA sequence matches a real bacterial family (the Rickettsiales).' },
];

const BAC_START_X = 2.6;
const HOST_X = -0.6;

const Bacterium: React.FC<{ mergeRef: React.MutableRefObject<number> }> = ({ mergeRef }) => {
  const grp = useRef<THREE.Group>(null);
  const wrapper = useRef<THREE.Mesh>(null);
  const wrapMat = useRef<THREE.MeshStandardMaterial>(null);
  const cristae = useRef<THREE.Group>(null);
  const bodyMat = useRef<THREE.MeshStandardMaterial>(null);
  const green = useMemo(() => new THREE.Color('#3fa34d'), []);
  const mito = useMemo(() => new THREE.Color('#2f7d3a'), []);
  useFrame(() => {
    const m = mergeRef.current;
    if (grp.current) grp.current.position.x = BAC_START_X - m * (BAC_START_X - HOST_X);
    if (wrapper.current) wrapper.current.visible = m >= 0.5;
    if (wrapMat.current) wrapMat.current.opacity = Math.max(0, (m - 0.5) / 0.5) * 0.9;
    if (bodyMat.current) bodyMat.current.color.copy(green).lerp(mito, Math.max(0, (m - 0.6) / 0.4));
    if (cristae.current) {
      const show = Math.max(0, (m - 0.82) / 0.18);
      cristae.current.scale.setScalar(show);
      cristae.current.visible = show > 0.02;
    }
  });
  return (
    <group ref={grp}>
      {/* bacterium / future mitochondrion body */}
      <mesh scale={[1.0, 0.55, 0.55]}>
        <sphereGeometry args={[0.6, 28, 20]} />
        <meshStandardMaterial ref={bodyMat} color="#3fa34d" emissive="#1c4d23" emissiveIntensity={0.3} roughness={0.5} />
      </mesh>
      {/* second (wrapper) membrane = the double membrane clue */}
      <mesh ref={wrapper} scale={[1.18, 0.72, 0.72]}>
        <sphereGeometry args={[0.6, 28, 20]} />
        <meshStandardMaterial ref={wrapMat} color="#9d97f0" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* cristae folds emerge as it becomes an organelle */}
      <group ref={cristae}>
        {[-0.32, -0.11, 0.11, 0.32].map((dx, i) => (
          <mesh key={i} position={[dx, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.26, 0.04, 10, 24]} />
            <meshStandardMaterial color="#bfe8c4" emissive="#3fa34d" emissiveIntensity={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

const HostCell: React.FC<{ mergeRef: React.MutableRefObject<number> }> = ({ mergeRef }) => {
  const pocket = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const m = mergeRef.current;
    const p = m > 0 && m < 0.85 ? m : 0;
    if (pocket.current) {
      pocket.current.visible = p > 0.02;
      pocket.current.scale.setScalar(0.6 + p * 0.7);
    }
  });
  return (
    <group position={[HOST_X, 0, 0]}>
      <mesh>
        <sphereGeometry args={[1.7, 40, 32]} />
        <meshStandardMaterial color="#5b53b8" transparent opacity={0.28} roughness={0.6} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.7, 40, 32]} />
        <meshStandardMaterial color="#9d97f0" wireframe transparent opacity={0.18} />
      </mesh>
      {/* nucleus */}
      <mesh position={[-0.55, 0.35, 0.3]}>
        <sphereGeometry args={[0.6, 28, 24]} />
        <meshStandardMaterial color="#3a3490" emissive="#241f6e" emissiveIntensity={0.4} roughness={0.5} />
      </mesh>
      {/* engulfment pocket dimple on the right */}
      <mesh ref={pocket} position={[1.5, 0, 0]}>
        <sphereGeometry args={[0.5, 20, 16]} />
        <meshStandardMaterial color="#160e2e" />
      </mesh>
    </group>
  );
};

const Scene: React.FC<{ mergeRef: React.MutableRefObject<number>; targetRef: React.MutableRefObject<number>; label: string }> = ({ mergeRef, targetRef, label }) => {
  useFrame((_, dRaw) => {
    const dt = Math.min(0.05, dRaw);
    mergeRef.current += (targetRef.current - mergeRef.current) * Math.min(1, dt * 3);
  });
  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 6, 5]} intensity={1.2} />
      <directionalLight position={[-4, 2, -3]} intensity={0.4} color="#9d97f0" />
      <HostCell mergeRef={mergeRef} />
      <Bacterium mergeRef={mergeRef} />
      <Html position={[HOST_X - 0.55, 1.4, 0]} center style={{ pointerEvents: 'none' }}>
        <span style={{ color: '#e7e5ff', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>host cell · nucleus</span>
      </Html>
      <Html position={[BAC_START_X - mergeRef.current * (BAC_START_X - HOST_X), -1.0, 0]} center style={{ pointerEvents: 'none' }}>
        <span style={{ color: '#bfe8c4', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</span>
      </Html>
      <OrbitControls enablePan={false} minDistance={4} maxDistance={11} enableDamping dampingFactor={0.08} />
    </>
  );
};

const Endosymbiosis: React.FC<Props> = ({ onInteraction }) => {
  const [step, setStep] = useState(0);
  const [collected, setCollected] = useState<Record<string, boolean>>({});
  const reported = useRef(false);
  const mergeRef = useRef(0);
  const targetRef = useRef(0);

  const merge = STEPS[step].merge;
  targetRef.current = merge;
  const label = merge >= 1 ? 'mitochondrion' : merge > 0 ? 'engulfed bacterium' : 'free-living bacterium';

  const numCollected = useMemo(() => Object.values(collected).filter(Boolean).length, [collected]);
  const allFound = numCollected === CLUES.length;
  const markComplete = useGateComplete('endosymbiosis');
  React.useEffect(() => { if (allFound) markComplete(); }, [allFound, markComplete]);

  const report = useCallback(() => {
    if (reported.current) return;
    reported.current = true;
    onInteraction({ isCorrect: true, isEmpty: false, value: 'evidence-started' });
  }, [onInteraction]);

  const advance = useCallback(() => setStep((s) => (s + 1) % STEPS.length), []);
  const collect = useCallback((id: string) => {
    setCollected((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
    report();
  }, [report]);

  return (
    <div className="w-full h-full flex flex-col" style={{ color: '#fff' }}>
      <VizStage camera={{ position: [0, 1.0, 7], fov: 44 }}
        background="radial-gradient(circle at 50% 35%, #221643 0%, #160e2e 75%)">
        <Scene mergeRef={mergeRef} targetRef={targetRef} label={label} />
      </VizStage>

      <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.95)', color: '#222', marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
          <button onClick={advance} style={{ background: '#5b53b8', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, cursor: 'pointer' }}>
            {step === STEPS.length - 1 ? '↺ Replay' : '▶ Next step'}
          </button>
          <span style={{ fontSize: 13, color: '#444' }}>{STEPS[step].caption}</span>
        </div>

        <div style={{ fontWeight: 700, fontSize: 14, margin: '10px 0 6px' }}>
          🔎 Collect the evidence — {numCollected} / {CLUES.length} clues collected
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CLUES.map((c) => {
            const got = !!collected[c.id];
            return (
              <button key={c.id} onClick={() => collect(c.id)} aria-pressed={got}
                style={{
                  flex: '1 1 150px', minWidth: 150, textAlign: 'left',
                  border: got ? '2px solid #3fa34d' : '2px solid #d6d2ec',
                  background: got ? '#eef8ef' : '#f6f5fb', color: '#222',
                  borderRadius: 10, padding: '8px 10px', cursor: got ? 'default' : 'pointer',
                }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{got ? '✅ ' : '❓ '}{c.title}</div>
                <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{got ? c.detail : 'Tap to reveal the proof'}</div>
              </button>
            );
          })}
        </div>

        {allFound && (
          <div role="status" style={{ marginTop: 10, background: '#3fa34d', color: '#fff', borderRadius: 10, padding: '10px 12px', fontWeight: 700 }}>
            Case closed — mitochondria were once bacteria. You are a partnership!
            <div style={{ fontWeight: 400, fontSize: 12, marginTop: 4 }}>
              Lynn Margulis proposed this in 1967. She was doubted for years — then the DNA evidence proved her right.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Endosymbiosis;
