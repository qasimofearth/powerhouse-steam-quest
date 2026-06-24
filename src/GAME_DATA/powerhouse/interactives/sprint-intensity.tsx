import React, { useEffect, useRef, useState } from 'react';
import { SprintIntensityInteraction, InteractionState } from './interface';
import { useGateComplete, useFlagSetter } from './useGate';
import { RunnerFigure, TEAL_RUNNER, ORANGE_RUNNER } from './runner';

// Sprint Intensity: WHY YOUR MUSCLES BURN.
// As effort rises, oxygen DEMAND climbs roughly linearly, but oxygen SUPPLY
// plateaus at your VO2max ceiling. Where demand crosses supply is the aerobic
// <-> anaerobic threshold. Above it the gap is covered by an anaerobic backup,
// lactate / "burn" piles up, and you can only hold it for seconds.

interface Props {
  interaction: SprintIntensityInteraction;
  interactionState?: InteractionState;
  onInteraction: (state: InteractionState) => void;
  onSubmit?: () => void;
  isSubmitTriggered?: boolean;
}

const W = 660;
const H = 360;
const SUPPLY_CEIL = 0.6; // VO2max ceiling, as a fraction of max chart height
const COL = {
  bg: '#16323a',
  supply: '#2e9b57',
  supplyDark: '#0E7C86',
  demand: '#E0552B',
  burn: '#c0392b',
};

// supply rises with effort then plateaus at the VO2max ceiling
const supplyAt = (e: number): number => SUPPLY_CEIL * (1 - Math.exp(-3.2 * e));
// demand rises steeply, roughly linear
const demandAt = (e: number): number => 0.96 * e;

// effort at which demand == supply (the threshold)
const findThreshold = (): number => {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (demandAt(m) > supplyAt(m)) hi = m;
    else lo = m;
  }
  return (lo + hi) / 2;
};
const THRESH = findThreshold();

const holdLabel = (e: number): { text: string; color: string } => {
  if (e <= THRESH) return { text: 'Hours — you can cruise here', color: COL.supply };
  const over = (e - THRESH) / (1 - THRESH); // 0..1 past threshold
  if (over < 0.25) return { text: 'Many minutes', color: '#e0a72b' };
  if (over < 0.55) return { text: 'A few minutes', color: COL.demand };
  return { text: 'Seconds!', color: COL.burn };
};

const SprintIntensity: React.FC<Props> = ({ onInteraction }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const effortRef = useRef(0.18);
  const phaseRef = useRef(0); // runner stride phase
  const burnRef = useRef(0); // accumulated burn 0..1
  const reported = useRef(false);
  const frameRef = useRef(0);
  const markComplete = useGateComplete('sprint-intensity');
  const setFlag = useFlagSetter('sprint-intensity');

  const [effort, setEffort] = useState(0.18);
  const [runPhase, setRunPhase] = useState(0);

  const handleEffort = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    effortRef.current = v;
    setEffort(v);
    if (!reported.current) {
      reported.current = true;
      onInteraction({ isCorrect: true, isEmpty: false, value: v });
    }
    if (v > 0.6) markComplete(); // must push past the threshold into the "burn"
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // chart geometry
    const padL = 56;
    const padR = 24;
    const padT = 26;
    const padB = 64;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const yOf = (frac: number) => padT + chartH * (1 - frac);
    const xOf = (e: number) => padL + chartW * e;

    let last = 0;

    const draw = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016;
      last = t;

      const e = effortRef.current;
      const supply = supplyAt(e);
      const demand = demandAt(e);
      const gap = Math.max(0, demand - supply); // anaerobic backup
      const anaerobic = demand > supply;

      // burn meter: climbs when anaerobic, recovers when aerobic
      const climb = gap * 2.4;
      burnRef.current = Math.max(
        0,
        Math.min(1, burnRef.current + (anaerobic ? climb * dt : -dt * 0.5))
      );

      // runner stride speed scales with effort
      phaseRef.current += dt * (2 + e * 22);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = COL.bg;
      ctx.fillRect(0, 0, W, H);

      // --- axes ---
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padL, padT);
      ctx.lineTo(padL, padT + chartH);
      ctx.lineTo(padL + chartW, padT + chartH);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(16, padT + chartH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Oxygen per minute', 0, 0);
      ctx.restore();
      ctx.fillText('Effort  →', padL + chartW / 2, padT + chartH + 22);

      // --- VO2max ceiling line ---
      const ceilY = yOf(SUPPLY_CEIL);
      ctx.strokeStyle = 'rgba(46,155,87,0.55)';
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(padL, ceilY);
      ctx.lineTo(padL + chartW, ceilY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = COL.supply;
      ctx.textAlign = 'right';
      ctx.font = 'bold 11px Arial';
      ctx.fillText('VO₂max ceiling', padL + chartW - 4, ceilY - 6);

      // --- shade the anaerobic gap (red) between supply and demand, past threshold ---
      ctx.beginPath();
      ctx.moveTo(xOf(THRESH), yOf(supplyAt(THRESH)));
      for (let i = 0; i <= 40; i++) {
        const ex = THRESH + ((1 - THRESH) * i) / 40;
        if (ex > e) break;
        ctx.lineTo(xOf(ex), yOf(demandAt(ex)));
      }
      if (e > THRESH) {
        for (let i = 40; i >= 0; i--) {
          const ex = THRESH + ((1 - THRESH) * i) / 40;
          if (ex > e) continue;
          ctx.lineTo(xOf(ex), yOf(supplyAt(ex)));
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(192,57,43,0.45)';
        ctx.fill();
      }

      // --- supply curve (teal, plateauing) ---
      ctx.strokeStyle = COL.supply;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const ex = i / 60;
        const x = xOf(ex);
        const y = yOf(supplyAt(ex));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // --- demand curve (orange, steep) ---
      ctx.strokeStyle = COL.demand;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const ex = i / 60;
        const x = xOf(ex);
        const y = yOf(demandAt(ex));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // --- crossover marker ---
      const tx = xOf(THRESH);
      const tyc = yOf(supplyAt(THRESH));
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(tx, padT);
      ctx.lineTo(tx, padT + chartH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(tx, tyc, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = tx > W * 0.6 ? 'right' : 'left';
      ctx.fillText('aerobic ↔ anaerobic threshold', tx + (tx > W * 0.6 ? -8 : 8), padT + 12);

      // --- current effort marker (dots on both curves) ---
      const ex = xOf(e);
      const dy = yOf(demand);
      const sy = yOf(supply);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.moveTo(ex, padT);
      ctx.lineTo(ex, padT + chartH);
      ctx.stroke();
      ctx.fillStyle = COL.demand;
      ctx.beginPath();
      ctx.arc(ex, dy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COL.supply;
      ctx.beginPath();
      ctx.arc(ex, sy, 6, 0, Math.PI * 2);
      ctx.fill();

      // legend
      ctx.textAlign = 'left';
      ctx.font = 'bold 12px Arial';
      ctx.fillStyle = COL.demand;
      ctx.fillText('● O₂ demand', padL + 4, padT + 14);
      ctx.fillStyle = COL.supply;
      ctx.fillText('● O₂ supplied', padL + 4, padT + 30);

      // the runner itself is an articulated SVG overlay (see render); just
      // publish the current stride phase a few times a second.
      frameRef.current++;
      if (frameRef.current % 2 === 0) setRunPhase(phaseRef.current);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // live readouts derived from effort state (re-rendered on slider move)
  const supply = supplyAt(effort);
  const demand = demandAt(effort);
  const anaerobic = demand > supply;
  const gapPct = Math.round((Math.max(0, demand - supply) / SUPPLY_CEIL) * 100);
  const burnPct = anaerobic ? Math.min(100, Math.round((gapPct / 60) * 100)) : 0;
  const hold = holdLabel(effort);

  return (
    <div className="w-full h-full flex flex-col" style={{ color: '#fff' }}>
      <div style={{ flex: 1, minHeight: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 660 }}>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            aria-label="Sprint intensity: oxygen demand vs supply and the burn meter"
            style={{ width: '100%', height: 'auto', borderRadius: 14, background: COL.bg, boxShadow: '0 6px 24px rgba(0,0,0,0.35)', display: 'block' }}
          />
          {/* articulated runner overlay, bottom-right corner */}
          <svg viewBox="0 0 130 200" style={{ position: 'absolute', right: '3%', bottom: '5%', width: '20%', height: 'auto', overflow: 'visible' }} aria-hidden="true">
            <g transform="translate(62,92)">
              <RunnerFigure phase={runPhase} lean={Math.min(1, 0.18 + effort * 0.85)} palette={anaerobic ? ORANGE_RUNNER : TEAL_RUNNER} />
            </g>
            {anaerobic && (
              <text x={96} y={20} fill="#ffb4a0" fontSize={13} fontWeight={700}>
                huff
                <animate attributeName="opacity" values="0.9;0;0.9" dur="0.5s" repeatCount="indefinite" />
              </text>
            )}
          </svg>
        </div>
      </div>

      <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.96)', color: '#222' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
          <span>Easy jog</span>
          <span style={{ color: anaerobic ? COL.burn : COL.supplyDark }}>
            {anaerobic ? 'ANAEROBIC — over the line' : 'AEROBIC — sustainable'}
          </span>
          <span>All-out sprint</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(effort * 100)}
          onChange={handleEffort}
          aria-label="Effort level"
          style={{ width: '100%', accentColor: anaerobic ? COL.burn : COL.supplyDark }}
        />

        <div style={{ display: 'flex', gap: 16, fontSize: 14, fontWeight: 600, flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
          <span style={{ color: COL.demand }}>Demand: {Math.round((demand / SUPPLY_CEIL) * 100)}%</span>
          <span style={{ color: COL.supply }}>Supply: {Math.round((supply / SUPPLY_CEIL) * 100)}%{supply >= SUPPLY_CEIL * 0.985 ? ' (maxed)' : ''}</span>
          <span style={{ color: hold.color }}>How long can you hold this? {hold.text}</span>
        </div>

        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COL.burn }}>BURN / lactate meter</div>
          <div style={{ height: 12, borderRadius: 6, background: '#eee', overflow: 'hidden' }}>
            <div style={{ width: `${burnPct}%`, height: '100%', background: `linear-gradient(90deg,#e0a72b,${COL.burn})`, transition: 'width .15s' }} />
          </div>
        </div>

        <div style={{ fontSize: 13, marginTop: 8, color: '#555' }}>
          {anaerobic
            ? 'Above the line your mitochondria can’t keep up with the oxygen. An anaerobic backup covers the gap — and that’s the burn (and the gasping). You can only hold this for ' + hold.text.toLowerCase() + '.'
            : 'Below the line your mitochondria keep up with the oxygen — supply meets demand, so you can cruise here for a long time.'}
        </div>
      </div>
    </div>
  );
};

export default SprintIntensity;
