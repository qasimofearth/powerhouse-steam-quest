import IconButton from './IconButton';
import { useSvgIcon } from '../hooks/useSvgIcon';
import VolumeControl from './VolumeControl';
import { AudioControlButtonsProps } from '../types/interfaces';
import { memo, useEffect, useMemo } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import useScreenSize from '../hooks/useScreenSize';
import { KeyboardKeys, KEY_DOWN } from '../constants/constants';
import { isAppleMobileOS } from '../utils/detectAppleMobileOS';

const AudioControlButtons = memo(
  ({
    isDialogPlaying,
    isDialogDonePlaying,
    handleDialogAudio,
    isMuted,
    toggleMute,
    showVolumeControl,
    setShowVolumeControl,
    backgroundVolume,
    setBackgroundVolume,
    dialogVolume,
    setDialogVolume,
    hasDialogAudio = false,
  }: AudioControlButtonsProps) => {
    const { t } = useTranslations();
    const PlayIcon = useSvgIcon('play');
    const AudioIcon = useSvgIcon('audio');
    const MuteIcon = useSvgIcon('mute');
    const PauseIcon = useSvgIcon('pause');
    const RefreshIcon = useSvgIcon('refresh');
    const VolumeControlIcon = useSvgIcon('volume-control');
    const { isVerticalScreen, isZoomed200 } = useScreenSize();
    
    const isAppleMobileOSDevice = useMemo(() => isAppleMobileOS(), []);

    const dialogIcon = isDialogPlaying ? PauseIcon : isDialogDonePlaying ? RefreshIcon : PlayIcon;

    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === KeyboardKeys.ESCAPE && showVolumeControl) {
          setShowVolumeControl(false);
        }
      };
      document.addEventListener(KEY_DOWN, handleKeyDown);
      return () => {
        document.removeEventListener(KEY_DOWN, handleKeyDown);
      };
    }, [showVolumeControl, setShowVolumeControl]);

    return (
      <div
        className={`absolute top-4 right-4 flex items-center  gap-3 ${
          isVerticalScreen || isZoomed200 ? 'flex-row' : 'flex-col'
        }`}
        role="region"
        aria-label={t('scenes.audioController.audio_controls_container')}
      >
        <IconButton disabled={!hasDialogAudio} icon={dialogIcon} onClick={() => handleDialogAudio()} />
        <IconButton
          iconSize="w-6 h-6"
          icon={isMuted ? MuteIcon : AudioIcon}
          ariaLabel={isMuted ? 'Unmute' : 'Mute'}
          onClick={toggleMute}
        />
        {!isAppleMobileOSDevice && (
          <div className="relative" role="region">
            <IconButton
              iconSize="w-6 h-6"
              icon={VolumeControlIcon}
              ariaLabel={'Volume Control'}
              onClick={() => setShowVolumeControl(!showVolumeControl)}
            />
            {showVolumeControl && (
              <VolumeControl
                backgroundVolume={backgroundVolume}
                setBackgroundVolume={setBackgroundVolume}
                dialogVolume={dialogVolume}
                setDialogVolume={setDialogVolume}
                setShowVolumeControl={setShowVolumeControl}
              />
            )}
            <span role="status" className="sr-only">
              {showVolumeControl
                ? t('scenes.audioController.volume-control-opened')
                : t('scenes.audioController.volume-control-closed')}
            </span>
          </div>
        )}
      </div>
    );
  },
);

export default AudioControlButtons;
