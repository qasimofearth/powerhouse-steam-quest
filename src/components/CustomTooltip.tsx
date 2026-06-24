/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from 'react';
import { SceneData } from '../types/interfaces';
import { useTranslations } from '../hooks/useTranslations';
import { ENTER_KEY, POPOVER_ARROW_WIDTH, SPACEBAR_KEY } from '../constants/constants';

interface CustomTooltipProps {
  tooltipInfo: { visible: boolean; index: number };
  scenes: SceneData[];
  handleClick: (index: number) => void;
  popOverPosition: Map<number, { left: number; visible: boolean; width: number }>; // Center position of the arrow
  setTooltipInfo: any;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  tooltipInfo,
  scenes,
  handleClick,
  popOverPosition,
  setTooltipInfo,
}) => {
  const { t } = useTranslations();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipInfoRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        // Hide the tooltip if the click is outside of it
        setTooltipInfo((tooltipInfo: any) => ({ ...tooltipInfo, visible: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setTooltipInfo, tooltipInfo]);

  useEffect(() => {
    if (tooltipInfo.visible && tooltipInfoRef.current) {
      tooltipInfoRef.current.focus(); // Focus the anchor tag when tooltip is visible
    }
  }, [tooltipInfo]); // Run effect when tooltip visibility changes

  const handleTextClick = (event: React.MouseEvent | React.KeyboardEvent) => {
    if (tooltipInfo.visible) {
      event.stopPropagation(); // Prevent event from bubbling up
      handleClick(tooltipInfo.index);
    }
  };

  if (!tooltipInfo.visible) {
    return null;
  }

  return (
    <>
      <div
        ref={tooltipRef}
        className="absolute bg-white rounded-md"
        role="tooltip"
        style={{
          position: 'absolute',
          left: `${popOverPosition.get(tooltipInfo.index)?.left}px`,
          bottom: '30px',
          width: '400px',
          zIndex: 1000,
          borderWidth: '0',
          padding: '1.5rem 3.5rem',
          textWrap: 'wrap',
          boxShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px 0px',
          textAlign: 'center',
        }}
      >
        <a
          ref={tooltipInfoRef}
          tabIndex={0}
          className="text-center"
          style={{
            cursor: 'pointer',
            fontWeight: 'bold',
            textDecoration: 'underline',
            fontSize: '1.25rem',
            color: tooltipInfo.visible ? 'black' : 'transparent',
            width: 'auto', // Set width to auto to fit the text
            padding: '0', // Remove padding to avoid extra clickable area
          }}
          onClick={(event) => {
            event.preventDefault();
            handleTextClick(event);
          }}
          onKeyDown={(event) => {
            if (event.key === ENTER_KEY || event.key === SPACEBAR_KEY) {
              event.preventDefault();
              handleTextClick(event);
            }
          }}
        >
          {t(scenes[tooltipInfo.index].name as string)}
        </a>
      </div>

      <div
        style={{
          position: 'absolute',
          left: `${popOverPosition.get(tooltipInfo.index)?.width}px`, // Centered based on tooltip
          bottom: '20px', // Position just below the tooltip box
          width: '0',
          height: '0',
          borderLeft: '12px solid transparent', // Adjust based on border size
          borderRight: '12px solid transparent',
          borderTop: `${POPOVER_ARROW_WIDTH - 2}px solid white`, // White triangle
          zIndex: 1001,
          // For shadow, you can use boxShadow if needed
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: `${popOverPosition.get(tooltipInfo.index)?.width}px`, // Centered based on tooltip
          bottom: '17px', // Position just below the tooltip box
          width: '0',
          height: '0',
          borderLeft: '12px solid transparent', // Same value as border for size match
          borderRight: '12px solid transparent',
          borderTop: `${POPOVER_ARROW_WIDTH}px solid lightgrey`, // Change this to your border color
          marginTop: '-8px', // Negative margin to pull it up slightly
        }}
      />
    </>
  );
};

export default CustomTooltip;
