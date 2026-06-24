import { useState, useEffect, useMemo } from 'react';
import { lazy } from 'react';
import { Interaction, InteractionState } from '../GAME_DATA/powerhouse/interactives/interface';

interface UseLazyInteractionResult {
  InteractionComponent: React.LazyExoticComponent<
    React.ComponentType<{
      interaction: Interaction;
      interactionState: InteractionState | undefined;
      onInteraction: (state: InteractionState) => void;
      onSubmit: () => void;
      isSubmitTriggered?: boolean;
    }>
  >;
  interactionConfig: Interaction | null;
  isLoading: boolean;
  error: Error | null;
}

type InteractiveComponent = React.ComponentType<{
  interaction: Interaction;
  interactionState: InteractionState | undefined;
  onInteraction: (state: InteractionState) => void;
  onSubmit: () => void;
  isSubmitTriggered?: boolean;
}>;
type LazyComponent = React.LazyExoticComponent<InteractiveComponent>;

const interactiveComponents: Record<string, LazyComponent> = {};

const getLazyComponent = (name: string) => {
  if (!interactiveComponents[name]) {
    const gameId = import.meta.env.VITE_GAME_ID;
    interactiveComponents[name] = lazy(() =>
      import(`../GAME_DATA/${gameId}/interactives/${name}.tsx`).then((module) => ({
        default: module.default || module,
      })),
    );
  }
  return interactiveComponents[name];
};

export const useLazyInteraction = (name: string, configPath: string): UseLazyInteractionResult => {
  const InteractionComponent = useMemo(() => getLazyComponent(name), [name]);

  const [state, setState] = useState<{
    interactionConfig: Interaction | null;
    isLoading: boolean;
    error: Error | null;
  }>({
    interactionConfig: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    const gameId = import.meta.env.VITE_GAME_ID;

    const loadConfig = async () => {
      try {
        if (!isMounted) return;

        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        const configModule = await import(`../GAME_DATA/${gameId}/configs/${configPath}.ts`);

        if (isMounted) {
          setState((prev) => ({
            ...prev,
            interactionConfig: configModule.default,
            isLoading: false,
          }));
        }
      } catch (err) {
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            error: err instanceof Error ? err : new Error('Failed to load config'),
            isLoading: false,
          }));
        }
      }
    };

    loadConfig();

    return () => {
      isMounted = false;
    };
  }, [configPath]);

  return {
    InteractionComponent,
    ...state,
  };
};
