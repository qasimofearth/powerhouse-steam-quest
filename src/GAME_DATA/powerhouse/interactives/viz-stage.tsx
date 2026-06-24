import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';

interface VizStageProps {
  camera?: { position?: [number, number, number]; fov?: number };
  background: string;
  children: React.ReactNode;
  /** absolutely-positioned overlay (e.g. a Reset button) rendered above the canvas */
  overlay?: React.ReactNode;
  heightVh?: number;
}

/**
 * Robust container for an R3F <Canvas> inside the quest's dialog card.
 *
 * The card animates open, so at the instant the interactive mounts the slot can
 * still measure 0×0. R3F refuses to create its renderer until it has a non-zero
 * size, and its internal resize observer is unreliable in that animate-in case.
 * So we poll the container with requestAnimationFrame until it has real pixels,
 * then mount the Canvas with explicit dimensions — guaranteeing it renders.
 */
const VizStage: React.FC<VizStageProps> = ({ camera, background, children, overlay, heightVh = 44 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      const el = ref.current;
      if (el && el.clientWidth > 1 && el.clientHeight > 1) {
        setSize((prev) => (prev && prev.w === el.clientWidth && prev.h === el.clientHeight ? prev : { w: el.clientWidth, h: el.clientHeight }));
        return true;
      }
      return false;
    };
    const tick = () => { if (!measure()) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    const ro = new ResizeObserver(() => measure());
    if (ref.current) ro.observe(ref.current);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        width: '100%', height: `${heightVh}vh`, minHeight: 300, maxHeight: 480,
        borderRadius: 16, overflow: 'hidden', border: '2px solid #24405f',
        background, position: 'relative',
      }}
    >
      {size && (
        <Canvas
          key={`${size.w}x${size.h}`}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          camera={camera as any}
          dpr={[1, 2]}
          gl={{ antialias: true }}
          style={{ width: size.w, height: size.h }}
        >
          {children}
        </Canvas>
      )}
      {overlay}
    </div>
  );
};

export default VizStage;
