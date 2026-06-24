import React, { useEffect, useState } from 'react';
import Avatar from './Avatar';
import { AvatarProps } from '../types/interfaces';
import { POSITION, POSITION_CLASSES } from '../constants/constants';

interface AnimatedAvatarProps extends AvatarProps {
  isVisible: boolean;
  animation?: {
    entry: string;
    exit: string;
  };
}

const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({ isVisible, position, animation, ...avatarProps }) => {
  const [positionClass, setPositionClass] = useState('');

  useEffect(() => {
    switch (position) {
      case POSITION.LEFT:
        setPositionClass(POSITION_CLASSES.BOTTOM_LEFT);
        break;
      case POSITION.RIGHT:
        setPositionClass(POSITION_CLASSES.BOTTOM_RIGHT);
        break;
      default:
        setPositionClass('');
        break;
    }
  }, [position]);

  const getAnimationClass = () => {
    if (!animation) return '';
    return isVisible
      ? (animation.entry ? `animate__animated animate__${animation.entry}` : '')
      : (animation.exit ? `animate__animated animate__${animation.exit}` : '');
  };

  return (
    <div
      className={`absolute w-fit z-10 pointer-events-none ${positionClass} ${getAnimationClass()}`}
      style={{ transition: 'opacity 0.3s ease-in-out', opacity: isVisible ? 1 : 0, bottom: '24px' }}
    >
      <Avatar {...avatarProps} />
    </div>
  );
};

export default AnimatedAvatar;
