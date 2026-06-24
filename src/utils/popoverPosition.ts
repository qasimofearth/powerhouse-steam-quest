import { POPOVER_CONSTANTS } from '../constants/constants';

export const calculateGlossaryPopoverPosition = (
  termRect: DOMRect,
  popoverWidth: number = 514
) => {
  if (!termRect) return { x: 0, y: 0 };

  const { HORIZONTAL_GAP } = POPOVER_CONSTANTS;

  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  const isNearRightEdge = termRect.right + popoverWidth + HORIZONTAL_GAP > windowWidth;

  let xPosition: number;

  if (isNearRightEdge) {
    xPosition = Math.max(HORIZONTAL_GAP, termRect.left - popoverWidth - HORIZONTAL_GAP);
  } else {
    xPosition = termRect.right + HORIZONTAL_GAP;
  }

  xPosition = Math.max(HORIZONTAL_GAP, Math.min(xPosition, windowWidth - popoverWidth - HORIZONTAL_GAP));

  let yPosition = termRect.top + termRect.height / 2 - 150;

  yPosition = Math.max(20, Math.min(yPosition, windowHeight - 300 - 20));

  return {
    x: xPosition,
    y: yPosition,
  };
};

export const calculatePopoverPosition = (boundingRect: DOMRect, yOffset: number) => {
  if (!boundingRect) return { x: 0, y: 0 };

  const { POPOVER_WIDTH, MIN_SPACE_BELOW_RATIO, HORIZONTAL_GAP, TOP_OFFSET, BOTTOM_OFFSET } = POPOVER_CONSTANTS;

  const minSpaceBelow = MIN_SPACE_BELOW_RATIO * window.innerHeight;

  const spaceLeft = boundingRect.left;
  const spaceRight = window.innerWidth - boundingRect.right;

  let xPosition: number;

  if (spaceRight >= POPOVER_WIDTH) {
    xPosition = boundingRect.right + HORIZONTAL_GAP;
  } else if (spaceLeft >= POPOVER_WIDTH) {
    xPosition = boundingRect.left - POPOVER_WIDTH - HORIZONTAL_GAP;
  } else {
    xPosition = Math.max(0, (window.innerWidth - POPOVER_WIDTH) / 2);
  }

  xPosition = Math.max(0, Math.min(xPosition, window.innerWidth - POPOVER_WIDTH));

  const spaceBelow = window.innerHeight - boundingRect.bottom;
  let yPosition: number;

  if (spaceBelow < minSpaceBelow) {
    yPosition = boundingRect.top - yOffset - TOP_OFFSET;
  } else {
    yPosition = boundingRect.bottom + yOffset - BOTTOM_OFFSET;
  }

  yPosition = Math.max(0, Math.min(yPosition, window.innerHeight));

  return {
    x: xPosition,
    y: yPosition,
  };
};
