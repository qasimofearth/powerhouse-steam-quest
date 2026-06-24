import React from 'react';

// A proportionally-correct, anatomically-articulated running human (side view,
// facing right). Joint angles follow a real running gait: the thigh swings at
// the hip, the knee flexes hard through the swing phase and extends near foot-
// strike, the ankle/foot roll, and the arms counter-swing with ~90° bent elbows.
// Driven by a single `phase` (radians) plus a `lean` (0..1) that tips the trunk
// forward with effort. Limbs are drawn as tapered, rounded segments so the
// silhouette reads as a real body rather than a stick figure.

export interface RunnerPalette {
  skin: string;
  skinShade: string;
  jersey: string;
  jerseyShade: string;
  shorts: string;
  hair: string;
  shoe: string;
}

export const TEAL_RUNNER: RunnerPalette = {
  skin: '#d98e5e', skinShade: '#b06f43', jersey: '#0E7C86', jerseyShade: '#0a5c63',
  shorts: '#23304d', hair: '#2a1d17', shoe: '#f4f4f4',
};
export const ORANGE_RUNNER: RunnerPalette = {
  skin: '#e0a070', skinShade: '#bd7e4f', jersey: '#E0552B', jerseyShade: '#b63f1c',
  shorts: '#1f2740', hair: '#241a14', shoe: '#ffd166',
};

// segment lengths (px) tuned to ~7.5-head human proportions
const THIGH = 42, SHIN = 40, FOOT = 20;
const TRUNK = 52, NECK = 9, HEAD_R = 15;
const UPPER = 31, FORE = 29;

const rad = (x: number, y: number) => ({ x, y });
// a point "len" away from p in a direction that is `a` radians forward (+x) from straight-down (+y in SVG)
const step = (p: { x: number; y: number }, a: number, len: number) =>
  rad(p.x + Math.sin(a) * len, p.y + Math.cos(a) * len);

// gait curves over one cycle (phase φ). Tuned to a believable run: the stance
// leg (φ≈π) is nearly straight and under the hip; the swing leg (φ≈0) lifts with
// a high bent knee and the heel tucks back toward the glutes.
const hipAngle = (f: number) => 0.5 * Math.sin(f) - 0.05; // thigh swing ±29°
const kneeFlex = (f: number) => 0.12 + 1.2 * (0.5 + 0.5 * Math.cos(f)); // peak bend mid-swing
const ankleAngle = (f: number) => 0.22 * Math.sin(f + 0.3);

interface LegPts { hip: { x: number; y: number }; knee: { x: number; y: number }; ankle: { x: number; y: number }; toe: { x: number; y: number }; heel: { x: number; y: number }; }
const leg = (hip: { x: number; y: number }, f: number): LegPts => {
  const hA = hipAngle(f);
  const knee = step(hip, hA, THIGH);
  const sA = hA - kneeFlex(f); // shin bends back relative to thigh
  const ankle = step(knee, sA, SHIN);
  const fA = sA + 1.35 + ankleAngle(f); // foot roughly forward-horizontal
  const toe = step(ankle, fA, FOOT);
  const heel = step(ankle, fA - 2.6, FOOT * 0.5);
  return { hip, knee, ankle, toe, heel };
};

interface ArmPts { sh: { x: number; y: number }; elbow: { x: number; y: number }; hand: { x: number; y: number }; }
const arm = (sh: { x: number; y: number }, f: number): ArmPts => {
  const shA = 0.62 * Math.sin(f); // shoulder swing
  const elbow = step(sh, shA, UPPER);
  const fA = shA + 1.25; // ~70-80° elbow flex, forearm swept forward
  const hand = step(elbow, fA, FORE);
  return { sh, elbow, hand };
};

const Limb: React.FC<{ a: { x: number; y: number }; b: { x: number; y: number }; w1: number; w2: number; color: string }> = ({ a, b, w1, w2, color }) => {
  // tapered capsule from a (width w1) to b (width w2)
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const p = [
    `${a.x + nx * w1} ${a.y + ny * w1}`,
    `${b.x + nx * w2} ${b.y + ny * w2}`,
    `${b.x - nx * w2} ${b.y - ny * w2}`,
    `${a.x - nx * w1} ${a.y - ny * w1}`,
  ];
  return (
    <>
      <polygon points={p.join(' ')} fill={color} />
      <circle cx={a.x} cy={a.y} r={w1} fill={color} />
      <circle cx={b.x} cy={b.y} r={w2} fill={color} />
    </>
  );
};

export const RunnerFigure: React.FC<{ phase: number; lean?: number; palette?: RunnerPalette }> = ({
  phase,
  lean = 0.4,
  palette = TEAL_RUNNER,
}) => {
  const f = phase;
  const pal = palette;
  // vertical bob: body rises at push-off (twice per cycle)
  const bob = Math.abs(Math.sin(f)) * -4;
  const hip = rad(0, bob);
  // trunk leans forward with effort
  const lambda = 0.12 + lean * 0.45;
  const shoulder = rad(hip.x + Math.sin(lambda) * TRUNK, hip.y - Math.cos(lambda) * TRUNK);
  const head = rad(shoulder.x + Math.sin(lambda) * (NECK + HEAD_R), shoulder.y - Math.cos(lambda) * (NECK + HEAD_R));

  const legFront = leg(hip, f);
  const legBack = leg(hip, f + Math.PI);
  const armBack = arm(shoulder, f); // back arm swings with front leg's phase (opposite)
  const armFront = arm(shoulder, f + Math.PI);

  return (
    <g strokeLinejoin="round">
      {/* BACK limbs (shaded, behind torso) */}
      <Limb a={armBack.sh} b={armBack.elbow} w1={5.5} w2={4.2} color={pal.skinShade} />
      <Limb a={armBack.elbow} b={armBack.hand} w1={4.2} w2={3} color={pal.skinShade} />
      <Limb a={legBack.hip} b={legBack.knee} w1={9} w2={6.5} color={pal.skinShade} />
      <Limb a={legBack.knee} b={legBack.ankle} w1={6} w2={3.8} color={pal.skinShade} />
      <Limb a={legBack.heel} b={legBack.toe} w1={4} w2={3} color="#cfcfcf" />

      {/* shorts over the back hip */}
      {/* FRONT leg */}
      <Limb a={legFront.hip} b={legFront.knee} w1={10} w2={7} color={pal.skin} />
      <Limb a={legFront.knee} b={legFront.ankle} w1={6.5} w2={4} color={pal.skin} />
      <Limb a={legFront.heel} b={legFront.toe} w1={4.5} w2={3.2} color={pal.shoe} />

      {/* shorts */}
      <path
        d={`M ${hip.x - 11} ${hip.y - 10} L ${hip.x + 11} ${hip.y - 10} L ${hip.x + 13} ${hip.y + 12} L ${hip.x} ${hip.y + 6} L ${hip.x - 13} ${hip.y + 12} Z`}
        fill={pal.shorts}
      />

      {/* torso (jersey) from hip to shoulder */}
      <Limb a={hip} b={shoulder} w1={13} w2={11} color={pal.jersey} />
      <Limb a={rad((hip.x + shoulder.x) / 2, (hip.y + shoulder.y) / 2)} b={shoulder} w1={11.5} w2={11} color={pal.jerseyShade} />

      {/* neck + head */}
      <Limb a={shoulder} b={rad(shoulder.x + Math.sin(lambda) * NECK, shoulder.y - Math.cos(lambda) * NECK)} w1={5} w2={5} color={pal.skin} />
      {/* hair sits on the back of the skull; the face circle is drawn over it,
          offset forward, so short hair shows as a natural rim (no "hat" band) */}
      <circle cx={head.x - 2.5} cy={head.y - 1.5} r={HEAD_R} fill={pal.hair} />
      <circle cx={head.x - HEAD_R + 2} cy={head.y + 3} r={4.5} fill={pal.hair} />
      <circle cx={head.x + 2.5} cy={head.y + 1.5} r={HEAD_R - 1.5} fill={pal.skin} />
      {/* nose toward forward */}
      <circle cx={head.x + HEAD_R - 1} cy={head.y + 1.5} r={1.7} fill={pal.skinShade} />

      {/* FRONT arm (over torso) */}
      <Limb a={armFront.sh} b={armFront.elbow} w1={6} w2={4.5} color={pal.skin} />
      <Limb a={armFront.elbow} b={armFront.hand} w1={4.5} w2={3.2} color={pal.skin} />
    </g>
  );
};

export default RunnerFigure;
