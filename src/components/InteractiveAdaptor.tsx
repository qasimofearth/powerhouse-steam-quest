import React, { memo, useMemo } from 'react';
import { Interaction, InteractionState } from '../types/interfaces';
import { useLazyInteraction } from '../hooks/useLazyInteraction';

const InteractiveAdaptor: React.FC<{
  interaction: Interaction;
  interactionStates: InteractionState | undefined;
  doneLoading: () => void;
  onInteraction: (state: InteractionState) => void;
  onSubmit: () => void;
  isSubmitTriggered?: boolean;
}> = memo(
  ({ interaction, interactionStates, doneLoading, onInteraction, onSubmit, isSubmitTriggered }) => {
    const { name, config } = interaction;
    const { InteractionComponent, interactionConfig, isLoading, error } = useLazyInteraction(name, config);

    const renderContent = useMemo(() => {
      if (error) {
        return <div>Error loading interactive: {error.message}</div>;
      }

      if (isLoading || !interactionConfig) {
        return <div>Loading...</div>;
      }

      doneLoading();

      return (
        <InteractionComponent
          interaction={interactionConfig}
          interactionState={interactionStates}
          onInteraction={onInteraction}
          onSubmit={onSubmit}
          isSubmitTriggered={isSubmitTriggered}
        />
      );
    }, [
      InteractionComponent,
      interactionConfig,
      isLoading,
      error,
      doneLoading,
      onInteraction,
      interactionStates,
      onSubmit,
      isSubmitTriggered,
    ]);

    return renderContent;
  },
  (prevProps, nextProps) => {
    return (
      prevProps.interaction.name === nextProps.interaction.name &&
      prevProps.interaction.config === nextProps.interaction.config &&
      JSON.stringify(prevProps.interactionStates) === JSON.stringify(nextProps.interactionStates) &&
      prevProps.isSubmitTriggered === nextProps.isSubmitTriggered
    );
  },
);

InteractiveAdaptor.displayName = 'InteractiveAdaptor';

export default InteractiveAdaptor;
