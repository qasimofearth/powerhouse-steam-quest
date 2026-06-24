import { useMemo } from 'react';
import { CHAT_BUBBLE_AVATAR_TYPES } from '../constants/constants';
import { AvatarChatBubbleSize, AvatarSize } from '../types/interfaces';

export const useIsChatBubbleType = (size?: AvatarSize): size is AvatarChatBubbleSize => {
  return useMemo(() => {
    return CHAT_BUBBLE_AVATAR_TYPES.includes(size as AvatarChatBubbleSize);
  }, [size]);
};
