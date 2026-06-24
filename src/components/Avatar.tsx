import React from 'react';
import { AvatarProps } from '../types/interfaces';
import { getAssetPath } from '../utils/assetPath';
import { useIsChatBubbleType } from '../hooks/useIsChatBubbleType';
import { useTranslations } from '../hooks/useTranslations';

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'large',
  className = '',
  mirrored = false,
  background = '#DCADF3',
}) => {
  const isChatBubbleType = useIsChatBubbleType(size);
  const { t } = useTranslations();

  return isChatBubbleType ? (
    <div
      className={`relative ${size === 'chat-bubble' ? 'rounded-full' : 'rounded-lg'} overflow-hidden h-20 w-20`}
      style={{
        background,
      }}
    >
      <img
        src={getAssetPath(src)}
        alt={t(alt)}
        className={`
                    absolute
                    object-contain
                    ${className}
                    z-10
                    ${mirrored ? 'scale-x-[-1]' : ''}
                    ${size === 'chat-bubble' ? 'overflow-hidden rounded-full' : ''}
                `}
        style={{
          width: '100%',
          height: '100%',
          minWidth: '100%',
          minHeight: '100%',
        }}
      />
    </div>
  ) : (
    <img
      src={getAssetPath(src)}
      alt={t(alt)}
      className={`object-contain ${className} z-10 ${mirrored ? 'scale-x-[-1]' : ''}`}
      style={{
        width: '43.59vw',
        height: 'auto',
        maxHeight: '90vh',
      }}
    />
  );
};

export default Avatar;
