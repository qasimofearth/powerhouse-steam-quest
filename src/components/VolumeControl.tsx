import { useCallback, useEffect, useRef } from 'react';
import useScreenSize from '../hooks/useScreenSize';
import { useSvgIcon } from '../hooks/useSvgIcon';
import { useTranslations } from '../hooks/useTranslations';
import { VolumeControlProps } from '../types/interfaces';
import '../shared/slider.css';

const VolumeControl: React.FC<VolumeControlProps> = ({
  backgroundVolume,
  setBackgroundVolume,
  dialogVolume,
  setDialogVolume,
  setShowVolumeControl,
}) => {
  const { t } = useTranslations();
  const { isZoomed200, isVerticalScreen } = useScreenSize();
  const CloseIcon = useSvgIcon('close');
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateSliderBackground = useCallback((input: HTMLInputElement) => {
    const min = Number(input.min);
    const max = Number(input.max);
    const value = Number(input.value);
    const percent = ((value - min) / (max - min)) * 100;
    input.style.background = `linear-gradient(to right, #007bff ${percent}%, #949494 ${percent}%)`;
  }, []);

  const updateVolumeSlider = useCallback((sliderId: string) => {
    const slider = document.getElementById(sliderId) as HTMLInputElement;
    if (slider) {
      updateSliderBackground(slider);
    }
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(() => {
          if (closeButtonRef.current) {
            closeButtonRef.current.focus();
            observer.disconnect();
          }
        });
      });

      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });

      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    updateVolumeSlider('background-volume');
  }, [backgroundVolume, updateVolumeSlider]);

  useEffect(() => {
    updateVolumeSlider('dialog-volume');
  }, [dialogVolume, updateVolumeSlider]);

  return (
    <div
      ref={containerRef}
      className={`absolute ${isVerticalScreen || isZoomed200 ? 'top-16 right-0' : 'top-0 right-12'} bg-white rounded-lg shadow-lg p-4 z-50 min-w-[300px]`}
    >
      <div className="flex justify-end items-start mb-3">
        <button
          ref={closeButtonRef}
          onClick={() => {
            setShowVolumeControl(false);
          }}
          aria-label={t('popover.close')}
          className="rounded focus:outline-none focus:ring-2 focus:ring-[#1F4C8B] focus:ring-offset-2 rounded-full"
        >
          <CloseIcon />
        </button>
      </div>
      <label htmlFor="background-volume" className="flex justify-between items-center mb-2 text-lg">
        <span>{t('scenes.audioController.background_music_label')}</span>
        <span>{Math.round(backgroundVolume * 100)}%</span>
      </label>
      <input
        id="background-volume"
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={backgroundVolume}
        onChange={(e) => {
          setBackgroundVolume(parseFloat(e.target.value));
          updateSliderBackground(e.target as HTMLInputElement);
        }}
        className="global-slider w-full mb-4"
        aria-label={t('scenes.audioController.background-music-volume-slider')}
        aria-valuetext={`${Math.round(backgroundVolume * 100)}%`}
      />

      <label htmlFor="dialog-volume" className="flex justify-between items-center mb-2 text-lg">
        <span>{t('scenes.audioController.character_voice_label')}</span>
        <span>{Math.round(dialogVolume * 100)}%</span>
      </label>
      <input
        id="dialog-volume"
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={dialogVolume}
        onChange={(e) => {
          setDialogVolume(parseFloat(e.target.value));
          updateSliderBackground(e.target as HTMLInputElement);
        }}
        className="global-slider w-full"
        aria-label={t('scenes.audioController.character-voice-volume-slider')}
        aria-valuetext={`${Math.round(dialogVolume * 100)}%`}
      />
    </div>
  );
};

export default VolumeControl;
