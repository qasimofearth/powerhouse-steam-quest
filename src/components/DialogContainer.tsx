import React, { useRef, useLayoutEffect, useCallback } from 'react';
import { DialogContainerProps } from '../types/interfaces';
import Dialog from './Dialog/Dialog';
import { POSITION } from '../constants/constants';
import useScreenSize from '../hooks/useScreenSize';
import { useIsChatBubbleType } from '../hooks/useIsChatBubbleType';

const DialogPositionMap: { [key: string]: React.CSSProperties } = {
  center: {
    top: '50%',
    left: '50%',
    right: 'unset',
    bottom: 'unset',
    transform: 'translate(-50%, -50%)',
    minWidth: 'unset',
  },
  left: {
    top: '35%',
    left: '35%',
    right: 'unset',
    bottom: 'unset',
    transform: 'translate(-50%, -50%)',
    minWidth: 'unset',
  },
  right: {
    top: '35%',
    right: '35%',
    left: 'unset',
    bottom: 'unset',
    transform: 'translate(50%, -50%)',
    minWidth: 'unset',
  },
  topCenter: {
    top: '30%',
    left: '50%',
    right: 'unset',
    bottom: 'unset',
    transform: 'translate(-50%, -50%)',
    minWidth: 'unset',
  },
  zoom200Plus: {
    top: '30%',
    right: 'unset',
    bottom: 'unset',
    left: '50%',
    transform: 'translate(-50%, 0)',
    minWidth: '90%',
  },
};

const DialogContainer: React.FC<DialogContainerProps> = ({ ...dialogProps }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { isVerticalScreen, isZoomed200 } = useScreenSize();
  const isChatBubbleType = useIsChatBubbleType(dialogProps.avatar?.size);

  const getDialogPosition = useCallback(() => {
    if (isZoomed200) return DialogPositionMap.zoom200Plus;

    if (isVerticalScreen) {
      return isChatBubbleType || !dialogProps.avatar ? DialogPositionMap.center : DialogPositionMap.topCenter;
    }

    if (dialogProps.position) {
      const transform = dialogProps.position.right ? 'translate(50%, -50%)' : 'translate(-50%, -50%)';
      return {
        top: 'unset',
        left: 'unset',
        right: 'unset',
        bottom: 'unset',
        minWidth: 'unset',
        ...dialogProps.position,
        transform,
      };
    }

    if (dialogProps.avatar?.position === POSITION.LEFT) return DialogPositionMap.right;
    if (dialogProps.avatar?.position === POSITION.RIGHT) return DialogPositionMap.left;

    return DialogPositionMap.center;
  }, [dialogProps, isChatBubbleType, isVerticalScreen, isZoomed200]);

  useLayoutEffect(() => {
    if (dialogRef.current) {
      const dialogPosition = getDialogPosition();
      Object.assign(dialogRef.current.style, dialogPosition);
    }
  }, [getDialogPosition]);

  return (
    <div
      className="absolute w-auto mx-auto left-0 right-0 md:left-auto md:right-auto"
      style={{
        ...(!dialogProps.disableAnimation ? { transition: 'all 300ms ease-in-out' } : {}),
      }}
      ref={dialogRef}
      role="region"
    >
      <Dialog {...dialogProps} dialogKey={'one-at-a-time'} />
    </div>
  );
};

export default DialogContainer;
