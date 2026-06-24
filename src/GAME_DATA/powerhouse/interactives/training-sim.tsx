import React, { useCallback, useRef, useState } from 'react';
import { TrainingSimInteraction, InteractionState } from './interface';
import { useGateComplete } from './useGate';

interface Props {
  interaction: TrainingSimInteraction;
  interactionState?: InteractionState;
  onInteraction: (state: InteractionState) => void;
  onSubmit?: () => void;
  isSubmitTriggered?: boolean;
}

// CLAIM-BUSTER / Optimization Lab. Toggle popular "boost your mitochondria"
// interventions into an 8-week protocol, run the test, and watch the result
// climb based ONLY on what actually has evidence. Hype interventions do nothing
// no matter how often you run; sleep is a MULTIPLIER that protects gains.
type Verdict = 'strong' | 'modest' | 'hype';

interface Intervention {
  id: string;
  label: string;
  note: string;
  verdict: Verdict;
  effect: number; // additive mitochondria stimulus (% points)
  multiplier?: boolean; // sleep: scales the training gains rather than adding
}

const TEAL = '#0E7C86';
const ORANGE = '#E0552B';
const HYPE_RED = '#b00020';
const STRONG_GREEN = '#2e9b57';

const INTERVENTIONS: Intervention[] = [
  { id: 'endurance', label: 'Endurance training', note: 'Long steady cardio — builds mitochondria', verdict: 'strong', effect: 20 },
  { id: 'hiit', label: 'HIIT intervals', note: 'High-intensity bursts — a different but strong route', verdict: 'strong', effect: 18 },
  { id: 'sleep', label: 'Sleep / recovery', note: 'When mitochondria are actually built — protects your gains', verdict: 'strong', effect: 0, multiplier: true },
  { id: 'cold', label: 'Cold plunge', note: 'A small real nudge — not the headline', verdict: 'modest', effect: 4 },
  { id: 'pill', label: '"Mito-Boost" pill', note: 'Viral supplement — no real effect on humans', verdict: 'hype', effect: 0 },
  { id: 'breathing', label: '"Oxygen optimizer" breathing hack', note: 'Trendy breathing routine — no measurable effect', verdict: 'hype', effect: 0 },
];

const VERDICT_META: Record<Verdict, { color: string; text: string }> = {
  strong: { color: STRONG_GREEN, text: 'Strong evidence' },
  modest: { color: '#c79400', text: 'Modest effect' },
  hype: { color: HYPE_RED, text: 'Hype — no real effect' },
};

// Compute the honest 8-week result from the chosen protocol.
function evaluate(active: Record<string, boolean>): { mito: number; vo2: number; overtrained: boolean } {
  let trainingGain = 0;
  let otherGain = 0;
  INTERVENTIONS.forEach((iv) => {
    if (!active[iv.id] || iv.multiplier) return;
    if (iv.id === 'endurance' || iv.id === 'hiit') trainingGain += iv.effect;
    else otherGain += iv.effect; // cold (real) + hype pills/breathing (0)
  });

  // Sleep is a MULTIPLIER: recovery is when adaptation happens. Skip it while
  // training hard and gains are cut down (overtraining).
  const hasSleep = active.sleep;
  const trainingHard = trainingGain > 0;
  const recoveryFactor = hasSleep ? 1.0 : trainingHard ? 0.5 : 1.0;
  const overtrained = trainingHard && !hasSleep;

  const mito = Math.round(trainingGain * recoveryFactor + otherGain);
  const vo2 = Math.round((trainingGain * recoveryFactor) * 0.42 + otherGain * 0.2);
  return { mito, vo2, overtrained };
}

const MITO_MAX = 42; // for the fill visual

function feedbackFor(active: Record<string, boolean>, res: { mito: number; overtrained: boolean }): { text: string; color: string } {
  const hypeOn = active.pill || active.breathing;
  const trainingOn = active.endurance || active.hiit;
  if (res.overtrained) return { text: 'Overtrained! You trained hard but skipped sleep/recovery — that is when mitochondria are built. Gains were cut in half.', color: HYPE_RED };
  if (hypeOn && !trainingOn && res.mito === 0) return { text: 'Zero gain. The pill and breathing hack do nothing — run it again, it stays at 0. That is the hype, busted.', color: HYPE_RED };
  if (hypeOn && trainingOn) return { text: 'The training did the work — the pill and breathing hack added exactly nothing on top. Look at the contribution bars.', color: '#333' };
  if (trainingOn && active.sleep) return { text: 'Big, real gains: training drives them and sleep lets you keep them. This is what evidence actually supports.', color: STRONG_GREEN };
  if (active.cold && !trainingOn) return { text: 'Only a tiny bump. Cold is a modest nudge, not the headline — training is the real lever.', color: '#333' };
  return { text: 'Pick interventions, then run the 8-week test and see which claims hold up.', color: '#333' };
}

const TrainingSim: React.FC<Props> = ({ onInteraction }) => {
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [mito, setMito] = useState(0);
  const [vo2, setVo2] = useState(0);
  const [running, setRunning] = useState(false);
  const [week, setWeek] = useState(0);
  const [done, setDone] = useState(false);
  const reportedRef = useRef(false);
  const rafRef = useRef<number>(0);
  const markComplete = useGateComplete('training-sim');

  const toggle = useCallback((id: string) => {
    cancelAnimationFrame(rafRef.current);
    setRunning(false);
    setActive((prev) => ({ ...prev, [id]: !prev[id] }));
    setDone(false);
    setMito(0);
    setVo2(0);
    setWeek(0);
    if (!reportedRef.current) {
      reportedRef.current = true;
      onInteraction({ isCorrect: true, isEmpty: false, value: 'tested-claim' });
    }
  }, [onInteraction]);

  const run = useCallback(() => {
    if (running) return;
    cancelAnimationFrame(rafRef.current);
    const target = evaluate(active);
    setRunning(true);
    setDone(false);
    setMito(0);
    setVo2(0);
    setWeek(0);

    const startedAt = performance.now();
    const durationMs = 2400;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / durationMs);
      const e = 1 - Math.pow(1 - t, 2); // ease-out plateau
      setMito(Math.round(target.mito * e));
      setVo2(Math.round(target.vo2 * e));
      setWeek(Math.min(8, Math.ceil(t * 8)));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setRunning(false);
        setDone(true);
        markComplete(); // ran a full 8-week test
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [active, running, markComplete]);

  const res = evaluate(active);
  const fill = Math.min(1, mito / MITO_MAX);
  const fb = feedbackFor(active, res);

  // Mitochondria dots inside the cell scale with the live mito value.
  const dotCount = Math.round(6 + fill * 26);
  const dots = Array.from({ length: dotCount }, (_, i) => {
    const ang = (i * 2.399963); // golden-angle spread
    const r = 18 + (i / dotCount) * 86;
    return { x: 130 + Math.cos(ang) * r, y: 110 + Math.sin(ang) * r * 0.72 };
  });

  return (
    <div className="w-full h-full flex flex-col" style={{ color: '#fff' }}>
      <div style={{ flex: 1, minHeight: 250, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12, padding: 12, background: '#0b132b', borderRadius: 12 }}>
        <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 15 }}>
          Optimization Lab — {running ? `Week ${week} of 8…` : done ? 'After 8 weeks' : 'Build a protocol, then run the test'}
        </div>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <svg width={260} height={220} role="img" aria-label="Muscle cell gaining mitochondria">
            <defs>
              <radialGradient id="cellbg" cx="50%" cy="45%" r="60%">
                <stop offset="0%" stopColor="#163a52" />
                <stop offset="100%" stopColor="#0b2030" />
              </radialGradient>
            </defs>
            <ellipse cx={130} cy={110} rx={118} ry={92} fill="url(#cellbg)" stroke="#2f6f7c" strokeWidth={3} />
            {dots.map((d, i) => (
              <ellipse
                key={i}
                cx={d.x}
                cy={d.y}
                rx={9}
                ry={4.5}
                fill={i % 3 === 0 ? ORANGE : TEAL}
                opacity={0.9}
                transform={`rotate(${(i * 37) % 180} ${d.x} ${d.y})`}
              />
            ))}
            <text x={130} y={205} textAnchor="middle" fontSize={11} fill="rgba(255,255,255,0.6)">muscle cell — more mitochondria = more power</text>
          </svg>
          <div style={{ minWidth: 150 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: TEAL }}>MITOCHONDRIA</div>
            <div style={{ fontSize: 34, fontWeight: 900, color: TEAL, lineHeight: 1 }}>+{mito}%</div>
            <div style={{ height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.16)', overflow: 'hidden', margin: '6px 0 14px' }}>
              <div style={{ width: `${fill * 100}%`, height: '100%', background: TEAL, transition: 'width 60ms linear' }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: ORANGE }}>VO₂max</div>
            <div style={{ fontSize: 34, fontWeight: 900, color: ORANGE, lineHeight: 1 }}>+{vo2}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>ml/kg/min</div>
          </div>
        </div>
      </div>

      <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.96)', color: '#222', marginTop: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
          Toggle interventions into your 8-week protocol:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 10 }}>
          {INTERVENTIONS.map((iv) => {
            const on = !!active[iv.id];
            const meta = VERDICT_META[iv.verdict];
            return (
              <button
                key={iv.id}
                onClick={() => toggle(iv.id)}
                aria-pressed={on}
                aria-label={`${iv.label}: ${meta.text}. ${on ? 'On' : 'Off'}, click to toggle`}
                style={{
                  textAlign: 'left',
                  border: on ? `2px solid ${TEAL}` : '2px solid #ddd',
                  background: on ? '#eef9fa' : '#fafafa',
                  borderRadius: 10,
                  padding: '8px 10px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 12.5, color: '#222' }}>{iv.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: on ? TEAL : '#aaa' }}>{on ? 'ON' : 'off'}</span>
                </div>
                <div style={{ fontSize: 10.5, color: '#666', margin: '3px 0 6px' }}>{iv.note}</div>
                <span style={{ display: 'inline-block', background: meta.color, color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 6, padding: '2px 7px' }}>
                  {meta.text}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
          <button
            onClick={run}
            disabled={running}
            style={{
              background: running ? '#9aa' : ORANGE,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '9px 16px',
              fontWeight: 800,
              cursor: running ? 'default' : 'pointer',
            }}
          >
            {running ? 'Testing…' : 'Run 8-week test →'}
          </button>
          <span style={{ fontSize: 12, color: '#555' }}>
            {res.overtrained ? 'Hard training without recovery → gains cut' : 'Honest result based only on real evidence'}
          </span>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: fb.color }}>
          {fb.text}
        </div>
        <div style={{ fontSize: 11, marginTop: 6, color: '#777' }}>
          Training drives the gains; sleep protects them; cold gives a small bump; the pill and breathing hack are pure hype.
        </div>
      </div>
    </div>
  );
};

export default TrainingSim;
