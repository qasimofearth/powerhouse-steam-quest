import React, { useEffect, useState } from 'react';
import AnimatedAvatar from './AnimatedAvatar';
import DialogContainer from './DialogContainer';
import { AvatarData } from '../types/interfaces';
import { DialogData } from '../types/interfaces';
import { SceneDataProps } from '../types/interfaces';
import { useIsChatBubbleType } from '../hooks/useIsChatBubbleType';
import useScreenSize from '../hooks/useScreenSize';
import { DIALOG_DELAY_OVER_AVATAR } from '../constants/constants';

const OneAtATime: React.FC<SceneDataProps> = ({ currentScene, onNext, onBack, dialogIndex }) => {
  const [isAvatarVisible, setIsAvatarVisible] = useState(true);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [dialogState, setDialogState] = useState<DialogData>(currentScene.dialogs[dialogIndex]);
  const [avatarState, setAvatarState] = useState<AvatarData | undefined>(dialogState?.avatar);

  const isChatBubbleType = useIsChatBubbleType(avatarState?.size);
  const { isZoomed200 } = useScreenSize();

  useEffect(() => {
    const dialog = currentScene.dialogs[dialogIndex];
    setDialogState(dialog);

    if (avatarState?.src === dialog?.avatar?.src) {
      setIsAvatarVisible(true);
      setAvatarState(dialog?.avatar);
      setTimeout(() => {
        setIsDialogVisible(true);
      }, DIALOG_DELAY_OVER_AVATAR);
    } else {
      setIsAvatarVisible(false);
      setIsDialogVisible(false);
      setTimeout(() => {
        setIsAvatarVisible(true);
        setAvatarState(dialog?.avatar);
        setTimeout(() => {
          setIsDialogVisible(true);
        }, DIALOG_DELAY_OVER_AVATAR);
      }, 300);
    }
  }, [currentScene, dialogIndex, setDialogState, avatarState?.src]);

  return (
    <div className={`${isZoomed200 ? 'fixed inset-0 h-full overflow-y-auto' : 'h-full'}`}>
      {avatarState && !isChatBubbleType && <AnimatedAvatar isVisible={isAvatarVisible} {...avatarState} />}
      <div
        className={`transition-opacity duration-200 ease-in-out ${isDialogVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        <DialogContainer {...dialogState} onNext={onNext} onBack={onBack} />
      </div>
    </div>
  );
};

export default OneAtATime;
