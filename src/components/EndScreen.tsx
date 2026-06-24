/* eslint-disable @typescript-eslint/no-explicit-any */
import './EndScreen.css';
import React from 'react';
import MathJax from 'better-react-mathjax/MathJax';
import { SceneDataProps } from '../types/interfaces';
import { BUTTON_STYLES } from '../constants/constants';
import { useTranslations } from '../hooks/useTranslations';
import { toTitleCase } from '../utils/dialogContentUtils';

const CongratulationsScreen: React.FC<SceneDataProps> = ({ onNext, onBack }) => {
  const { t } = useTranslations();

  const greetingsContent = t('scenes.quest_completion.greetings');
  const subheadingContent = toTitleCase(t('scenes.quest_completion.subheading'));
  const leftSvgContent = t('scenes.quest_completion.leftsvg');
  const rightSvgContent = t('scenes.quest_completion.rightsvg');
  const mainContent = t('scenes.quest_completion.content');
  const leftSvgAriaLabel = t('scenes.quest_completion.leftsvgarialabel');

  const handleBack = (event: any) => {
    event.preventDefault();
    onBack?.();
  };

  const handleRestartGame = (event: any) => {
    event.preventDefault();
    onNext?.();
  };

  return (
    <div
      className="end-screen overflow-auto max-h-screen"
    >
      <MathJax inline dynamic className="w-full">
        {/* Header with blue background and yellow strips */}
        <div className="end-screen-header w-full bg-[#006bE0] text-white relative mb-4 flex-grow rounded-lg border-radius-10">
          <div className="absolute top-0 left-0 right-0 h-3 bg-[#EDB200] rounded-t-lg"></div>
          <div className="flex items-center justify-between w-full h-full">
            <div
              role="img"
              className="mr-4"
              aria-label={leftSvgAriaLabel}
              dangerouslySetInnerHTML={{ __html: leftSvgContent }}
            ></div>
            <div className="flex-1 flex flex-col justify-center">
              <h1 id="congratulations-header" className="text-3xl font-bold leading-tight mb-2">
                {greetingsContent}
              </h1>
              <h2 className="text-xl text-white">{subheadingContent}</h2>
            </div>
            <div
              role="presentation"
              className="ml-4 absolute right-[6rem] top-[1rem]"
              dangerouslySetInnerHTML={{ __html: rightSvgContent }}
            ></div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-3 bg-[#EDB200] rounded-b-lg"></div>
        </div>

        {/* White box content */}
        <div className="bg-white p-8 rounded-lg shadow-md w-full" role="region" aria-labelledby="content-header">
          {/* Content from innerHTML */}
          <div id="content-header" className="text-[20px]" dangerouslySetInnerHTML={{ __html: mainContent }} />

          <div className="flex justify-end mt-4 gap-4">
            <button
              onClick={handleBack}
              style={BUTTON_STYLES.base}
              className={BUTTON_STYLES.classes.common + ' ' + BUTTON_STYLES.classes.secondary.enabled}
              aria-label={t('dialog.button.back')}
            >
              {t('dialog.button.back')}
            </button>
            <button
              onClick={handleRestartGame}
              style={BUTTON_STYLES.base}
              className={BUTTON_STYLES.classes.common + ' ' + BUTTON_STYLES.classes.start.enabled}
              aria-label={t('dialog.button.start_again')}
            >
              {t('dialog.button.start_again')}
            </button>
          </div>
        </div>
      </MathJax>
    </div>
  );
};

export default CongratulationsScreen;
