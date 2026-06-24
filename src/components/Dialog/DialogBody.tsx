import React from 'react';
import GlossaryHighlighter from '../GlossaryHighlighter';
import { GlossaryItem } from '../../types/interfaces';

interface DialogBodyProps {
  body?: string;
  bodyAsHtml?: string;
  glossary?: GlossaryItem[];
  dialogRef: React.RefObject<HTMLDivElement>;
}

const DialogBody: React.FC<DialogBodyProps> = ({ body, bodyAsHtml, glossary, dialogRef }) => {
  if (!body && !bodyAsHtml) return null;

  return (
    <>
      {body && (
        <div className="text-1.5xl">
          <GlossaryHighlighter content={body} glossaryItems={glossary} parentRef={dialogRef} />
        </div>
      )}
      {bodyAsHtml && (
        <div className="text-1.5xl">
          <GlossaryHighlighter content={bodyAsHtml} glossaryItems={glossary} parentRef={dialogRef} />
        </div>
      )}
    </>
  );
};

export default DialogBody;
