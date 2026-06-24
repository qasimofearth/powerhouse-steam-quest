import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Vo2maxLabInteraction, InteractionState } from './interface';
import { useGateComplete, useFlagSetter } from './useGate';
import { RunnerFigure, TEAL_RUNNER } from './runner';

interface Props {
  interaction: Vo2maxLabInteraction;
  interactionState?: InteractionState;
  onInteraction: (state: InteractionState) => void;
  onSubmit?: () => void;
  isSubmitTriggered?: boolean;
}

// VO2max treadmill test: drag the speed slider and watch oxygen use (VO2)
// rise then PLATEAU at a hard ceiling. That ceiling is your VO2max — your
// aerobic engine's limit. Pushing past it can't raise oxygen use any further.

const TEAL = '#0E7C86';
const ORANGE = '#E0552B';
const DARK = '#16323a';

const SPEED_MIN = 4;
const SPEED_MAX = 20;
const VO2_REST = 8;
const VO2_MAX = 52; // mL/kg/min ceiling
const PLATEAU_SPEED = 14; // km/h where the curve flattens

// VO2 rises ~linearly then saturates toward VO2_MAX (smooth plateau).
function vo2At(speed: number): number {
  const span = VO2_MAX - VO2_REST;
  // exponential approach to ceiling, scaled so the knee sits near PLATEAU_SPEED
  const k = 3.4 / (PLATEAU_SPEED - SPEED_MIN);
  const v = VO2_REST + span * (1 - Math.exp(-k * (speed - SPEED_MIN)));
  return Math.min(VO2_MAX, v);
}

const TOOLS: { id: string; label: string; note: string }[] = [
  {
    id: 'biopsy',
    label: 'Muscle biopsy',
    note: 'A tiny muscle sample is taken with a needle, then mitochondria are counted under a microscope to gauge aerobic capacity.',
  },
  {
    id: 'nirs',
    label: 'Near-infrared light (NIRS)',
    note: 'Harmless infrared light shone through the skin reads how much oxygen the working muscle is pulling from the blood — no needle needed.',
  },
  {
    id: 'mri',
    label: 'MRI scan',
    note: 'Magnetic resonance tracks chemical signals in living muscle to watch how fast mitochondria refuel energy after exercise.',
  },
];

const W = 460;
const H = 240;
const PAD_L = 44;
const PAD_B = 30;
const PAD_T = 16;
const PAD_R = 14;

const Vo2maxLab: React.FC<Props> = ({ onInteraction }) => {
  const [speed, setSpeed] = useState<number>(6);
  const [tool, setTool] = useState<string | null>(null);
  const reportedRef = useRef(false);
  const legPhaseRef = useRef(0);
  const [legPhase, setLegPhase] = useState(0);
  const rafRef = useRef(0);

  const vo2 = vo2At(speed);
  const atPlateau = speed >= PLATEAU_SPEED;
  const pastPlateau = speed >= PLATEAU_SPEED + 1.5;

  // Animate the runner's legs faster at higher speed.
  useEffect(() => {
    let last = 0;
    const tick = (t: number) => {
      const dt = last ? (t - last) / 1000 : 0.016;
      last = t;
      legPhaseRef.current += dt * (1.5 + (speed / SPEED_MAX) * 9);
      setLegPhase(legPhaseRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [speed]);

  const markComplete = useGateComplete('vo2max-lab');
  const setFlag = useFlagSetter('vo2max-lab');
  const handleSpeed = useCallback(
    (next: number) => {
      setSpeed(next);
      if (!reportedRef.current) {
        reportedRef.current = true;
        onInteraction({ isCorrect: true, isEmpty: false, value: next });
      }
      if (next >= PLATEAU_SPEED) { markComplete(); setFlag({ plateau: true }); } // pushed to the VO2max plateau
    },
    [onInteraction, markComplete, setFlag],
  );

  const pickTool = useCallback((id: string) => {
    setTool((prev) => (prev === id ? null : id));
    setFlag({ toolTapped: true });
  }, [setFlag]);

  // ---- chart geometry ----
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const xOf = (s: number) => PAD_L + ((s - SPEED_MIN) / (SPEED_MAX - SPEED_MIN)) * plotW;
  const yOf = (v: number) => PAD_T + plotH - (v / VO2_MAX) * plotH;

  // Build the VO2 curve path up to current speed (solid) and the ghost (faded full curve).
  const samples = 80;
  let fullPath = '';
  for (let i = 0; i <= samples; i++) {
    const s = SPEED_MIN + (i / samples) * (SPEED_MAX - SPEED_MIN);
    fullPath += `${i === 0 ? 'M' : 'L'}${xOf(s).toFixed(1)} ${yOf(vo2At(s)).toFixed(1)} `;
  }
  let livePath = '';
  let areaPath = `M${xOf(SPEED_MIN).toFixed(1)} ${yOf(0).toFixed(1)} `;
  for (let i = 0; i <= samples; i++) {
    const s = SPEED_MIN + (i / samples) * (SPEED_MAX - SPEED_MIN);
    if (s > speed) break;
    livePath += `${i === 0 ? 'M' : 'L'}${xOf(s).toFixed(1)} ${yOf(vo2At(s)).toFixed(1)} `;
    areaPath += `L${xOf(s).toFixed(1)} ${yOf(vo2At(s)).toFixed(1)} `;
  }
  areaPath += `L${xOf(speed).toFixed(1)} ${yOf(0).toFixed(1)} Z`;


  return (
    <div className="w-full h-full flex flex-col" style={{ color: '#fff' }}>
      <div style={{ flex: 1, minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 6 }}>
        <svg viewBox={`0 0 ${W} ${H}`} aria-label="VO2max chart" style={{ width: '100%', maxWidth: 480, height: 'auto', background: DARK, borderRadius: 12 }}>
          {/* axes */}
          <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T + plotH} stroke="rgba(255,255,255,0.4)" />
          <line x1={PAD_L} y1={PAD_T + plotH} x2={W - PAD_R} y2={PAD_T + plotH} stroke="rgba(255,255,255,0.4)" />
          {/* VO2max ceiling line */}
          <line x1={PAD_L} y1={yOf(VO2_MAX)} x2={W - PAD_R} y2={yOf(VO2_MAX)} stroke={ORANGE} strokeDasharray="5 4" strokeWidth={1.5} />
          <text x={W - PAD_R} y={yOf(VO2_MAX) - 5} fill={ORANGE} fontSize={10} fontWeight={700} textAnchor="end">
            VO₂max — your engine's limit!
          </text>
          {/* ghost full curve */}
          <path d={fullPath} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={1.5} />
          {/* filled area under live curve */}
          <path d={areaPath} fill={TEAL} fillOpacity={0.28} />
          {/* live curve */}
          <path d={livePath} fill="none" stroke={TEAL} strokeWidth={3} />
          {/* current point */}
          <circle cx={xOf(speed)} cy={yOf(vo2)} r={5} fill={atPlateau ? ORANGE : '#fff'} stroke={DARK} strokeWidth={2} />
          {/* axis labels */}
          <text x={PAD_L - 6} y={yOf(VO2_MAX) + 4} fill="rgba(255,255,255,0.7)" fontSize={9} textAnchor="end">{VO2_MAX}</text>
          <text x={PAD_L - 6} y={PAD_T + plotH} fill="rgba(255,255,255,0.7)" fontSize={9} textAnchor="end">0</text>
          <text x={PAD_L + plotW / 2} y={H - 6} fill="rgba(255,255,255,0.7)" fontSize={10} textAnchor="middle">Speed (km/h) →</text>
          <text x={12} y={PAD_T + plotH / 2} fill="rgba(255,255,255,0.7)" fontSize={10} textAnchor="middle" transform={`rotate(-90 12 ${PAD_T + plotH / 2})`}>
            VO₂ (mL/kg/min)
          </text>
          {pastPlateau && (
            <g>
              <rect x={xOf(speed) - 92} y={yOf(VO2_MAX) - 36} width={88} height={26} rx={5} fill={ORANGE} />
              <text x={xOf(speed) - 48} y={yOf(VO2_MAX) - 19} fill="#fff" fontSize={9} fontWeight={700} textAnchor="middle">
                More speed,
              </text>
              <text x={xOf(speed) - 48} y={yOf(VO2_MAX) - 8} fill="#fff" fontSize={9} fontWeight={700} textAnchor="middle">
                no more O₂!
              </text>
            </g>
          )}
        </svg>

        {/* Runner on a treadmill — anatomically articulated, real running gait */}
        <svg viewBox="0 0 130 210" aria-label="Runner on treadmill" style={{ width: 110, height: 'auto', flexShrink: 0 }}>
          <defs>
            <linearGradient id="vo2-belt" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#0a1f24" />
              <stop offset="0.5" stopColor="#16424a" />
              <stop offset="1" stopColor="#0a1f24" />
            </linearGradient>
          </defs>
          {/* treadmill handlebar/console (behind runner) */}
          <line x1={108} y1={176} x2={118} y2={96} stroke="#16424a" strokeWidth={4} strokeLinecap="round" />
          <rect x={108} y={88} width={16} height={13} rx={2} fill="#16424a" />
          {/* the athlete — hip pivot so the stance foot lands on the belt */}
          <g transform="translate(60,92)">
            <RunnerFigure phase={legPhase} lean={Math.min(1, 0.15 + (speed / SPEED_MAX) * 0.7)} palette={TEAL_RUNNER} />
          </g>
          {/* treadmill belt + deck (over the feet contact line) */}
          <ellipse cx={62} cy={190} rx={52} ry={6} fill="rgba(0,0,0,0.3)" />
          <rect x={8} y={174} width={104} height={12} rx={6} fill="url(#vo2-belt)" stroke={TEAL} strokeWidth={2} />
          <rect x={4} y={186} width={112} height={15} rx={4} fill="#0a1f24" />
          {atPlateau && (
            <circle cx={74} cy={32} r={2.4} fill="#9fe2ff">
              <animate attributeName="cy" values="32;52" dur="0.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0" dur="0.6s" repeatCount="indefinite" />
            </circle>
          )}
          <text x={60} y={206} fill={TEAL} fontSize={10} fontWeight={700} textAnchor="middle">{speed.toFixed(0)} km/h</text>
        </svg>
      </div>

      <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.95)', color: '#222' }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
          Treadmill speed: <span style={{ color: TEAL }}>{speed.toFixed(1)} km/h</span>
        </label>
        <input
          type="range"
          min={SPEED_MIN}
          max={SPEED_MAX}
          step={0.5}
          value={speed}
          onChange={(e) => handleSpeed(parseFloat(e.target.value))}
          aria-label="Treadmill speed"
          style={{ width: '100%', accentColor: ORANGE }}
        />
        <div style={{ display: 'flex', gap: 16, fontSize: 13, fontWeight: 600, marginTop: 6, flexWrap: 'wrap' }}>
          <span>VO₂: <span style={{ color: TEAL }}>{vo2.toFixed(1)} mL/kg/min</span></span>
          <span>VO₂max reached?{' '}
            <span style={{ color: atPlateau ? ORANGE : '#888' }}>{atPlateau ? 'YES — plateau!' : 'not yet'}</span>
          </span>
        </div>
        <div style={{ fontSize: 12.5, marginTop: 6, color: pastPlateau ? ORANGE : '#555', fontWeight: pastPlateau ? 700 : 400 }}>
          {pastPlateau
            ? 'Notice: the curve is flat. Your muscles already use oxygen as fast as they can — extra speed cannot raise VO₂ past this ceiling.'
            : atPlateau
              ? 'You have hit the plateau — this flat top of the curve IS your VO₂max.'
              : 'Drag faster and watch VO₂ climb. How high can the oxygen use go before it flattens out?'}
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 4 }}>Lab tools — how scientists measure muscle oxygen use:</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TOOLS.map((tl) => (
              <button
                key={tl.id}
                onClick={() => pickTool(tl.id)}
                style={{
                  background: tool === tl.id ? TEAL : '#e7eef0',
                  color: tool === tl.id ? '#fff' : DARK,
                  border: 'none',
                  borderRadius: 999,
                  padding: '5px 11px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {tl.label}
              </button>
            ))}
          </div>
          {tool && (
            <div style={{ fontSize: 12.5, marginTop: 6, color: '#333', background: '#f1f6f7', borderRadius: 8, padding: '6px 9px' }}>
              {TOOLS.find((tl) => tl.id === tool)?.note}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Vo2maxLab;
