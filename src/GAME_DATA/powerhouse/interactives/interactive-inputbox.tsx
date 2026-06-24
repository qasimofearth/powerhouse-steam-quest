import React, { useCallback, useEffect, useRef, useState } from 'react';
import { InputBoxInteraction, InteractionState } from './interface';
import { useTranslations } from '../../../hooks/useTranslations';
import { useSvgIcon } from '../../../hooks/useSvgIcon';
import { ENTER_KEY } from '../../../constants/constants';
import useKeyPress from '../../../hooks/useKeyPress';
import './interactive-inputbox.css';

interface InteractiveInputBoxProps {
  interaction: InputBoxInteraction;
  onInteraction: (state: InteractionState) => void;
  interactionState: InteractionState | undefined;
  onSubmit: () => void;
  isSubmitTriggered?: boolean;
}

const InteractiveInputBox: React.FC<InteractiveInputBoxProps> = ({
  interaction,
  onInteraction,
  interactionState,
  onSubmit,
  isSubmitTriggered,
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [showCheckmark, setShowCheckmark] = useState<boolean>(false);
  const [isInputFieldFocused, setIsInputFieldFocused] = useState<boolean>(false);
  const { t } = useTranslations();
  const CheckmarkIcon = useSvgIcon('correct-checkmark');

  const inputRef = useRef<HTMLInputElement>(null);

  const checkAnswer = useCallback(() => {
    if (inputValue.trim() === '') {
      onInteraction({ isCorrect: false, isEmpty: true });
      return;
    }

    const isCorrect = interaction.correctnessFunction ? interaction.correctnessFunction(+inputValue) : true;

    onInteraction({ isCorrect, isEmpty: false, value: inputValue });
  }, [inputValue, interaction, onInteraction]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    checkAnswer();
  };

  useEffect(() => {
    onInteraction({ isCorrect: false, isEmpty: true });
    checkAnswer();
  }, [onInteraction, checkAnswer]);

  useEffect(() => {
    if (isSubmitTriggered || interactionState?.isCorrect) {
      setShowCheckmark(true);
      if (interactionState?.isCorrect && interactionState.value) {
        setInputValue(interactionState.value);
      }
    }
  }, [interactionState, isSubmitTriggered]);

  const handleSubmit = () => {
    if (isInputFieldFocused) {
      onSubmit();
    }
  };

  useKeyPress({
    className: 'interactive-input-box',
    selector: "input[type='number']",
    keyPressed: ENTER_KEY,
    callback: handleSubmit,
  });

  return (
    <div className="relative mt-5">
      <div className="w-full flex gap-x-3 items-center interactive-input-box">
        {interaction.prefixText && <div dangerouslySetInnerHTML={{ __html: t(interaction.prefixText) }} />}
        <input
          ref={inputRef}
          type="number"
          className={`interactive-input-box w-full mb-2 border rounded-[0.125rem] text-1.5xl font-medium px-4 py-[6px] ${
            showCheckmark
              ? 'bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed pr-12'
              : 'border-[#333333]'
          }`}
          placeholder={t('scenes.common.enter_answer')}
          aria-label={t('scenes.common.enter_answer')}
          tabIndex={0}
          value={inputValue}
          onChange={handleInputChange}
          disabled={showCheckmark}
          onFocus={() => {
            setIsInputFieldFocused(true);
          }}
          onBlur={() => {
            setIsInputFieldFocused(false);
          }}
        />
        {showCheckmark && (
          <div className="absolute right-3 top-[45%] transform -translate-y-1/2">
            <CheckmarkIcon />
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveInputBox;
