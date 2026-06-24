import { useCallback, useRef } from 'react';
import { useGameContext } from '../../../hooks/useGameContext';

type Flags = Record<string, string | number | boolean | null>;

/**
 * Returns a `markComplete` callback that flags this interactive as "used" in the
 * shared interactiveResponses store (keyed by the interactive's name). A matching
 * `configs/gate-<name>.ts` reads that flag to keep the scene's Next button
 * disabled until the student has actually engaged with the interactive.
 */
export const useGateComplete = (name: string) => {
  const { setInteractiveResponses } = useGameContext();
  const done = useRef(false);
  return useCallback(
    (extra?: Flags) => {
      if (done.current) return;
      done.current = true;
      setInteractiveResponses?.((prev) => ({
        ...prev,
        [name]: { ...(prev?.[name] || {}), completed: true, ...(extra || {}) },
      }));
    },
    [setInteractiveResponses, name],
  );
};

/**
 * Returns a setter for granular per-step flags (e.g. the student tapped the
 * cristae, cut the oxygen, hit the VO₂max plateau). Each instructional dialog
 * can require its own flag via `configs/gate-<name>-<flag>.ts`, so Next stays
 * disabled until the specific command in that bubble is fulfilled. Safe to call
 * every frame — it no-ops when nothing changed.
 */
export const useFlagSetter = (name: string) => {
  const { setInteractiveResponses } = useGameContext();
  return useCallback(
    (patch: Flags) => {
      setInteractiveResponses?.((prev) => {
        const cur = prev?.[name] || {};
        let changed = false;
        const next: Flags = { ...cur };
        for (const k in patch) {
          if (cur[k] !== patch[k]) {
            next[k] = patch[k];
            changed = true;
          }
        }
        if (!changed) return prev;
        return { ...prev, [name]: next };
      });
    },
    [setInteractiveResponses, name],
  );
};
