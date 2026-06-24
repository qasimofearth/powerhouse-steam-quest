import React, { useCallback, useEffect, useMemo, useRef, useState, useId } from 'react';
import { RadioButtonInteraction, InteractionState } from './interface';
import useKeyPress from '../../../hooks/useKeyPress';
import { ENTER_KEY } from '../../../constants/constants';
import './interactive-radio.css';
import { useTranslations } from '../../../hooks/useTranslations';

interface InteractiveRadioButtonProps {
  interaction: RadioButtonInteraction;
  onInteraction: (state: InteractionState) => void;
  interactionState: InteractionState | undefined;
  onSubmit: () => void;
  isSubmitTriggered?: boolean;
}

const InteractiveRadioButton: React.FC<InteractiveRadioButtonProps> = ({
  interaction,
  onInteraction,
  interactionState,
  onSubmit,
  isSubmitTriggered,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [ansChecked, setAnsChecked] = useState<boolean>(false);
  const radioRef = useRef<HTMLInputElement>(null);
  const uniqueId = useId();
  const { t } = useTranslations();

  // Shuffle option order once per mount so the correct answer isn't always in
  // the same position. Correctness is value-based, so order is purely cosmetic.
  const shuffledOptions = useMemo(() => {
    const opts = [...interaction.options];
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interaction.options]);

  const checkAnswer = useCallback(() => {
    if (!selectedOption) {
      onInteraction({ isCorrect: false, isEmpty: true });
      return;
    }

    const isCorrect = interaction.correctnessFunction ? interaction.correctnessFunction(selectedOption) : true;

    onInteraction({ isCorrect, isEmpty: false, value: selectedOption });
  }, [selectedOption, interaction, onInteraction]);

  useEffect(() => {
    onInteraction({ isCorrect: false, isEmpty: true });
    checkAnswer();
  }, [onInteraction, checkAnswer]);

  useEffect(() => {
    if (isSubmitTriggered || interactionState?.isCorrect) {
      setAnsChecked(true);
      if (interactionState?.isCorrect && interactionState.value) {
        setSelectedOption(interactionState.value);
      }
    }
  }, [interactionState, isSubmitTriggered]);

  const handleOptionChange = (value: string) => {
    setSelectedOption(value);
    checkAnswer();
  };

  const handleSubmit = () => {
    if (selectedOption) {
      onSubmit();
    }
  };

  useKeyPress({
    className: 'interactive-radio-group',
    selector: "input[type='radio']",
    keyPressed: ENTER_KEY,
    callback: handleSubmit,
  });

  return (
    <div className="relative mt-2">
      <div className="interactive-radio-group">
        {shuffledOptions.map((option) => (
          <label key={option.value} className="interactive-radio-option">
            <input
              ref={radioRef}
              type="radio"
              name={`interactive-radio-${uniqueId}`}
              value={option.value}
              disabled={ansChecked}
              checked={selectedOption === option.value}
              onChange={() => handleOptionChange(option.value)}
              className="w-4 h-4 mt-1"
            />
            <span className="font-avenir-next" style={{ fontSize: '20px', lineHeight: '150%', color: '#333333' }}>
              <span dangerouslySetInnerHTML={{ __html: t(option.label) }} />
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default InteractiveRadioButton;
