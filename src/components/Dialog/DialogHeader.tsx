import React from 'react';
import Avatar from '../Avatar';
import SmallIconButton from '../SmallIconButton';
import { useTranslations } from '../../hooks/useTranslations';
import parse from 'html-react-parser';
import { AvatarData, PopoverData } from '../../types/interfaces';
import { useIsChatBubbleType } from '../../hooks/useIsChatBubbleType';
import useScreenSize from '../../hooks/useScreenSize';
import { DialogSizeType } from '../../constants/constants';

interface DialogHeaderProps {
  heading?: string;
  avatar?: AvatarData;
  help?: PopoverData[];
  about?: PopoverData[];
  styles: {
    heading: React.CSSProperties;
    full: {
      heading: React.CSSProperties;
    };
  };
  dialogSizeType?: DialogSizeType.FULL;
  isPrimaryHeading?: boolean;
}

const DialogHeader: React.FC<DialogHeaderProps> = ({
  heading,
  avatar,
  help,
  about,
  styles,
  dialogSizeType,
  isPrimaryHeading,
}) => {
  const { t } = useTranslations();
  const { isZoomed200 } = useScreenSize();
  const isChatBubbleType = useIsChatBubbleType(avatar?.size);

  return (
    <div
      className="flex items-center justify-between"
      style={dialogSizeType === DialogSizeType.FULL ? styles.full.heading : {}}
    >
      <div
        role={isPrimaryHeading ? 'heading' : undefined}
        aria-level={isPrimaryHeading ? 1 : undefined}
        className={`flex items-center ${isZoomed200 ? 'flex-col' : 'flex-row'}`}
      >
        {avatar?.src && isChatBubbleType && (
          <div className="mr-4 shrink-0">
            <Avatar {...avatar} size={avatar.size} />
          </div>
        )}
        {heading && (
          <div
            className={`${
              isChatBubbleType || dialogSizeType === DialogSizeType.FULL ? 'text-2xl' : 'text-[2rem]'
            } leading-8 ${dialogSizeType !== DialogSizeType.FULL ? 'mb-4' : ''}`}
            style={{ ...styles.heading }}
          >
            {parse(t(heading))}
          </div>
        )}
      </div>
      <div className="flex gap-3">
        {help?.[0] && <SmallIconButton type="help" content={help[0]} />}
        {about?.[0] && <SmallIconButton type="info" content={about[0]} shouldShake={false} />}
      </div>
    </div>
  );
};

export default DialogHeader;
