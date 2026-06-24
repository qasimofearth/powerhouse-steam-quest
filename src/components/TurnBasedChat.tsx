import React, { useEffect, useMemo, useState } from 'react';
import { SceneDataProps } from '../types/interfaces';
import Dialog from './Dialog/Dialog';
import { DURATIONS, POSITION } from '../constants/constants';
import useScreenSize from '../hooks/useScreenSize';
import AnimatedAvatar from './AnimatedAvatar';
import { motion, AnimatePresence } from 'framer-motion';

const TurnBasedChat: React.FC<SceneDataProps> = ({ currentScene, onNext, onBack, dialogIndex }) => {
  const { isZoomed200 } = useScreenSize();

  const [isLeftAvatarVisible, setIsLeftAvatarVisible] = useState(true);
  const [isRightAvatarVisible, setIsRightAvatarVisible] = useState(true);

  const [leftAvatar, setLeftAvatar] = useState(
    currentScene.dialogs.find((dialog) => dialog.avatar?.position?.includes('left'))?.avatar,
  );
  const [rightAvatar, setRightAvatar] = useState(
    currentScene.dialogs.find((dialog) => dialog.avatar?.position?.includes('right'))?.avatar,
  );

  useEffect(() => {
    const currentDialog = currentScene.dialogs[dialogIndex];
    const currentSide = currentDialog?.side;
    const currentAvatar = currentDialog?.avatar;

    if (!currentAvatar) return;

    const isLeft = currentSide === POSITION.LEFT;
    const currentAvatarState = isLeft ? leftAvatar : rightAvatar;
    const setAvatarVisible = isLeft ? setIsLeftAvatarVisible : setIsRightAvatarVisible;
    const setAvatar = isLeft ? setLeftAvatar : setRightAvatar;

    if (currentAvatarState?.src === currentAvatar.src) {
      setAvatarVisible(true);
      setAvatar(currentAvatar);
    } else {
      setAvatarVisible(false);
      setTimeout(() => {
        setAvatarVisible(true);
        setAvatar(currentAvatar);
      }, currentAvatar.animation?.duration || 300);
    }
  }, [currentScene.dialogs, dialogIndex, leftAvatar, rightAvatar]);

  const visibleDialogs = useMemo(() => {
    const allDialogs = [];
    let currentIndex = 0;

    for (let i = 0; i <= dialogIndex && i < (currentScene.dialogs ?? []).length; i++) {
      const dialog = currentScene.dialogs?.[i];
      allDialogs.push({
        side: dialog?.side || POSITION.RIGHT,
        dialog,
        index: currentIndex++,
      });
    }
    return allDialogs;
  }, [currentScene, dialogIndex]);

  return (
    <div className="fixed inset-0 w-full h-full">
      <div className="flex h-full">
        <div className="absolute bottom-0 left-[-10%] w-full">
          {leftAvatar && <AnimatedAvatar isVisible={isLeftAvatarVisible} {...leftAvatar} />}
        </div>

        <div className="absolute bottom-0 right-[-10%] w-full">
          {rightAvatar && <AnimatedAvatar isVisible={isRightAvatarVisible} {...rightAvatar} />}
        </div>

        <div
          className={`
                        fixed
                        left-1/2
                        -translate-x-1/2
                        top-0
                        bottom-0
                        z-50
                        ${isZoomed200 ? 'h-auto overflow-y-auto w-full' : 'w-[50%]'}
                    `}
        >
          <div
            className={`flex flex-col justify-end items-center overflow-hidden ${
              isZoomed200 ? 'h-auto' : 'h-full pb-[10vh]'
            }`}
          >
            <AnimatePresence mode="popLayout">
              {visibleDialogs.map((item, index) => {
                const isFaded = item.index < dialogIndex;
                const gap = 20; // Base gap in pixels for consistent spacing

                return (
                  <motion.div
                    key={`dialog-${index}`}
                    layout
                    initial={{
                      opacity: isFaded ? 0.8 : 1,
                      y: 0,
                    }}
                    animate={{
                      opacity: isFaded ? 0.8 : 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      y: -gap, // Smooth exit transition
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 150, // Lower stiffness slows the upward movement
                      damping: 20, // Controls bounce intensity
                      duration: DURATIONS.turnBasedChatOpacity / 1000,
                      restDelta: 1, // Allows a subtle bounce-back
                    }}
                    className="w-full flex justify-center"
                    style={{
                      marginTop: index === 0 ? '0px' : `${gap}px`,
                      zIndex: isFaded ? -1: 0
                    }}
                  >
                    <motion.div
                      className={`max-w-[90%]`}
                      initial={false}
                      animate={{
                        opacity: isFaded ? 0.8 : 1,
                      }}
                      transition={{
                        duration: 0.3,
                        ease: 'easeOut',
                      }}
                    >
                      <Dialog
                        dialogIndex={index}
                        {...item.dialog}
                        dialogKey={'turn-based-chat-' + index}
                        width={isZoomed200 ? '90vw' : '44vw'}
                        onNext={index === dialogIndex ? onNext : undefined}
                        onBack={index === dialogIndex ? onBack : undefined}
                      />
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurnBasedChat;
