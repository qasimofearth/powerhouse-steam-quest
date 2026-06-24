import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MaternalLineInteraction, InteractionState } from './interface';
import { useGateComplete } from './useGate';

interface Props {
  interaction: MaternalLineInteraction;
  interactionState?: InteractionState;
  onInteraction: (state: InteractionState) => void;
  onSubmit?: () => void;
  isSubmitTriggered?: boolean;
}

// Trace your unbroken mother -> daughter line back in time. The same teal
// mitochondrion is passed down every generation untouched, all the way to
// Mitochondrial Eve in Africa ~150,000 years ago.
const PINK = '#d94f9a';
const TEAL = '#0E7C86';

interface Ancestor {
  label: string;
  years: string;
}

// Each step jumps further back; the gaps accelerate toward deep time.
const CHAIN: Ancestor[] = [
  { label: 'You', years: 'today' },
  { label: 'Mom', years: '~25 years ago' },
  { label: 'Grandma', years: '~50 years ago' },
  { label: 'Great-grandma', years: '~80 years ago' },
  { label: 'Great-great-grandma', years: '~120 years ago' },
  { label: '…200 mothers back', years: '~5,000 years ago' },
  { label: '…1,500 mothers back', years: '~40,000 years ago' },
  { label: 'Mitochondrial Eve', years: '~150,000 years ago — Africa' },
];

const MaternalLine: React.FC<Props> = ({ onInteraction }) => {
  const [revealed, setRevealed] = useState(1); // how many ancestors are shown
  const reportedRef = useRef(false);

  const report = useCallback(() => {
    if (!reportedRef.current) {
      reportedRef.current = true;
      onInteraction({ isCorrect: true, isEmpty: false, value: 'traced' });
    }
  }, [onInteraction]);

  const stepBack = useCallback(() => {
    report();
    setRevealed((r) => Math.min(CHAIN.length, r + 1));
  }, [report]);

  const jumpToEve = useCallback(() => {
    report();
    setRevealed(CHAIN.length);
  }, [report]);

  const reset = useCallback(() => setRevealed(1), []);

  const atEve = revealed >= CHAIN.length;
  const markComplete = useGateComplete('maternal-line');
  useEffect(() => { if (atEve) markComplete(); }, [atEve, markComplete]);
  const shown = CHAIN.slice(0, revealed);
  const current = CHAIN[revealed - 1];

  return (
    <div className="w-full h-full flex flex-col" style={{ color: '#fff' }}>
      <div
        style={{
          flex: 1,
          minHeight: 240,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          background: 'radial-gradient(ellipse at 50% 0%, #5a2440 0%, #34172a 70%, #240f1d 100%)',
          borderRadius: 12,
          padding: '14px 10px',
          overflowY: 'auto',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 800, color: '#ffb3d8', marginBottom: 2, letterSpacing: 0.3 }}>
          Your unbroken maternal line
        </div>
        <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 12 }}>{current.years}</div>

        {/* The chain of mothers, newest at top, oldest at the bottom. */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          {shown.map((a, i) => {
            const isEve = i === CHAIN.length - 1;
            return (
              <div key={a.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {i > 0 && (
                  // luminous mother→daughter thread with a flowing pulse of mtDNA
                  <svg width={10} height={26} viewBox="0 0 10 26" aria-hidden="true">
                    <line x1={5} y1={0} x2={5} y2={26} stroke={PINK} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
                    <circle cx={5} cy={4} r={2.6} fill={TEAL}>
                      <animate attributeName="cy" values="0;26" dur="1.4s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0;1;0" dur="1.4s" repeatCount="indefinite" />
                    </circle>
                  </svg>
                )}
                <svg width={86} height={84} viewBox="0 0 86 84" aria-hidden="true">
                  {isEve && (
                    <circle cx={43} cy={42} r={39} fill="none" stroke="#ffd166" strokeWidth={2.5} opacity={0.85}>
                      <animate attributeName="opacity" values="0.4;0.95;0.4" dur="2.2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {/* hair behind */}
                  <path d="M27 30 Q43 6 59 30 Q60 44 52 50 Q43 40 34 50 Q26 44 27 30 Z" fill="#3a2018" />
                  {/* shoulders / dress */}
                  <path d="M16 74 Q43 40 70 74 Z" fill={isEve ? '#d65a98' : '#b5527f'} />
                  <path d="M24 74 Q43 50 62 74 Z" fill={isEve ? '#e87bb0' : '#c76a93'} opacity={0.6} />
                  {/* head */}
                  <circle cx={43} cy={28} r={12.5} fill="#e3a878" />
                  <circle cx={47} cy={27} r={1.5} fill="#7a4a32" />
                  {/* hair fringe */}
                  <path d="M30 26 Q43 10 56 26 Q50 19 43 19 Q36 19 30 26 Z" fill="#3a2018" />
                  {/* the SAME glowing mitochondrion, carried every generation */}
                  <circle cx={43} cy={56} r={12} fill="#19e0c0" opacity={0.22}>
                    <animate attributeName="opacity" values="0.12;0.3;0.12" dur="1.6s" repeatCount="indefinite" />
                  </circle>
                  <ellipse cx={43} cy={56} rx={9} ry={6} fill={TEAL} stroke="#7fe3ec" strokeWidth={1.5} />
                  <path d="M37 56 q3 -3.5 6 0 q3 3.5 6 0" fill="none" stroke="#caffef" strokeWidth={1.2} />
                  <ellipse cx={40} cy={53.5} rx={2.4} ry={1.4} fill="#d8fff5" opacity={0.8} />
                </svg>
                <div style={{ fontSize: 11.5, fontWeight: isEve ? 800 : 600, color: isEve ? '#ffd166' : '#fff', textAlign: 'center', maxWidth: 120 }}>
                  {isEve ? '👑 ' : ''}{a.label}
                </div>
                <div style={{ fontSize: 9, opacity: 0.65, marginBottom: 2 }}>{a.years}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.95)', color: '#222', marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
          <button
            onClick={stepBack}
            disabled={atEve}
            style={{
              background: atEve ? '#bbb' : PINK,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontWeight: 700,
              cursor: atEve ? 'default' : 'pointer',
            }}
          >
            ↩ Step back one generation
          </button>
          <button
            onClick={jumpToEve}
            disabled={atEve}
            style={{
              background: atEve ? '#bbb' : TEAL,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontWeight: 700,
              cursor: atEve ? 'default' : 'pointer',
            }}
          >
            ⏩ Jump to the start
          </button>
          {revealed > 1 && (
            <button
              onClick={reset}
              style={{ background: '#eee', color: '#555', border: 'none', borderRadius: 8, padding: '8px 12px', fontWeight: 600, cursor: 'pointer' }}
            >
              Reset
            </button>
          )}
        </div>

        <div style={{ fontSize: 13, color: '#444', marginBottom: 8 }}>
          The same <strong style={{ color: TEAL }}>teal mitochondrion</strong> is copied straight down the{' '}
          <strong style={{ color: PINK }}>pink mother→daughter line</strong> — unchanged. Your mitochondria
          (and their own DNA) come <strong>only</strong> from your mother, never your father.
        </div>

        {atEve && (
          <div
            style={{
              background: '#fff4e6',
              border: `2px solid ${PINK}`,
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 13,
              color: '#5a2440',
              marginBottom: 8,
            }}
          >
            <strong>Myth-buster:</strong> Mitochondrial Eve was <strong>NOT</strong> the only woman alive —
            thousands of other women lived alongside her too. She is just the one whose unbroken
            mother→daughter line never died out, so everyone alive today traces back to her.
          </div>
        )}

        <div style={{ fontSize: 12, color: '#666' }}>
          🔬 Because mtDNA passes down this single unbroken line, it survives in old bones and even a single
          hair — which is why forensic scientists use it to identify remains.
        </div>
      </div>
    </div>
  );
};

export default MaternalLine;
