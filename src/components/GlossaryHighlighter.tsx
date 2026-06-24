import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import parse from 'html-react-parser';
import { GlossaryItem } from '../types/interfaces';
import { useGlossary } from '../hooks/useGlossary';
import { useTranslations } from '../hooks/useTranslations';
import { useGameContext } from '../hooks/useGameContext';
import MathJax from 'better-react-mathjax/MathJax';
import { calculateGlossaryPopoverPosition } from '../utils/popoverPosition';
import { getGlossaryItems } from '../services/GlossaryService';
import { ENTER_KEY, SPACEBAR_KEY } from '../constants/constants';

interface GlossaryHighlighterProps {
  content: string;
  glossaryItems?: GlossaryItem[];
  parentRef: React.RefObject<HTMLDivElement>;
}

const GlossaryHighlighter: React.FC<GlossaryHighlighterProps> = ({ content, glossaryItems = [], parentRef }) => {
  const { t } = useTranslations();
  const allGlossaryItems = useMemo(() => [...glossaryItems, ...getGlossaryItems()], [glossaryItems]);
  const { formattedText } = useGlossary(
    t(content),
    allGlossaryItems?.map((item) => (item.global ? item.word : t(item.word))) || [],
  );
  const { setPopoverState } = useGameContext();
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleGlossaryInteraction = useCallback(
    (target: HTMLSpanElement) => {
      const { dataset } = target;
      const word = dataset.word;
      if (!word || !parentRef.current) return;

      const glossaryItemIndex = allGlossaryItems?.findIndex(
        (item) => t(item.word).toLowerCase() === word.toLowerCase()
      );

      if (glossaryItemIndex !== -1) {
        const rect = target.getBoundingClientRect();
        const { x, y } = calculateGlossaryPopoverPosition(rect);

        setPopoverState({
          bodyAsHtml: t(allGlossaryItems[glossaryItemIndex].definitionAsHtml || ''),
          position: { x, y },
          customStyle: {
            width: '32.1875rem',
          },
          triggerRef: { current: target as HTMLDivElement },
        });
      }
    },
    [allGlossaryItems, parentRef, setPopoverState, t],
  );

  const handleGlossaryEvent = useCallback(
    (e: MouseEvent | KeyboardEvent) => {
      const target = e.target as HTMLSpanElement;

      if (target.classList.contains('glossary-highlight')) {
        if (
          e instanceof MouseEvent ||
          (e instanceof KeyboardEvent && (e.key === ENTER_KEY || e.key === SPACEBAR_KEY))
        ) {
          e.preventDefault();
          handleGlossaryInteraction(target);
          popoverRef.current?.focus();
        }
      }
    },
    [handleGlossaryInteraction],
  );

  useEffect(() => {
    document.querySelectorAll<HTMLSpanElement>('.glossary-highlight').forEach((el) => {
      el.addEventListener('click', handleGlossaryEvent as EventListener);
      el.addEventListener('keydown', handleGlossaryEvent as EventListener);
    });

    return () => {
      document.querySelectorAll<HTMLSpanElement>('.glossary-highlight').forEach((el) => {
        el.removeEventListener('click', handleGlossaryEvent as EventListener);
        el.removeEventListener('keydown', handleGlossaryEvent as EventListener);
      });
    };
  }, [formattedText, handleGlossaryEvent]);

  return (
    <MathJax inline dynamic>
      <div ref={popoverRef}>{parse(formattedText)}</div>
    </MathJax>
  );
};

export default GlossaryHighlighter;
