import React from 'react';
import InteractiveAdaptor from '../InteractiveAdaptor';
import { Interaction, InteractionState } from '../../types/interfaces';

interface DialogInteractionsProps {
  interactions?: Interaction[];
  interactionStates: InteractionState[];
  getResponseId: (index: number) => string;
  handleInteraction: (index: number, state: InteractionState) => void;
  handleSubmit: () => void;
  isSubmitTriggered?: boolean;
}

const DialogInteractions: React.FC<DialogInteractionsProps> = ({
  interactions,
  interactionStates,
  getResponseId,
  handleInteraction,
  handleSubmit,
  isSubmitTriggered,
}) => {
  return (
    <>
      {interactions?.map((interaction, interactionIndex) => (
        <InteractiveAdaptor
          key={getResponseId(interactionIndex)}
          interaction={interaction}
          interactionStates={interactionStates[interactionIndex]}
          doneLoading={() => {}}
          onInteraction={(state) => handleInteraction(interactionIndex, state)}
          onSubmit={handleSubmit}
          isSubmitTriggered={isSubmitTriggered}
        />
      ))}
    </>
  );
};

export default DialogInteractions;
