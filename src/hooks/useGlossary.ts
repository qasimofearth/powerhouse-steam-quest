import { useMemo } from 'react';
import { EXCLUDE_TAGS_FOR_HIGHLIGHTING } from '../constants/constants';

interface GlossaryMatch {
  word: string;
  start: number;
  end: number;
}

export const useGlossary = (
  text: string,
  keywords: string[],
): {
  matches: GlossaryMatch[];
  formattedText: string;
} => {
  return useMemo(() => {
    if (!text || !keywords.length) return { matches: [], formattedText: text };

    const excludedTagsPattern = new RegExp(`<\\s*(/?)(${EXCLUDE_TAGS_FOR_HIGHLIGHTING.join('|')})[^>]*>`, 'gi');

    // Track start and end positions of tags to exclude from highlighting
    const excludedRanges: Array<[number, number, boolean]> = [];
    let tagMatch;
    let depth = 0;

    // Populate excludedRanges with the start and end of excluded tags
    while ((tagMatch = excludedTagsPattern.exec(text)) !== null) {
      const isClosing = tagMatch[1] === '/';
      if (!isClosing) {
        excludedRanges.push([tagMatch.index, text.length, true]);
        depth++;
      } else {
        depth--;
        if (depth === 0) {
          excludedRanges[excludedRanges.length - 1][1] = tagMatch.index;
        }
      }
    }

    // Helper to check if a position falls within an excluded range
    const isPositionExcluded = (pos: number): boolean => {
      return excludedRanges.some(([start, end]) => pos > start && pos < end);
    };

    // Find and store matches for each keyword in text
    const matches: GlossaryMatch[] = [];
    const lowerText = text.toLowerCase();
    const keywordMap = new Map(keywords.sort((a, b) => b.length - a.length).map((k) => [k.toLowerCase(), k]));

    for (const [lowerKeyword] of keywordMap) {
      // Search for the first valid instance of the keyword
      let position = 0;
      let found = false;

      while (!found) {
        const start = lowerText.indexOf(lowerKeyword, position);
        if (start === -1) break; // No more instances

        const end = start + lowerKeyword.length;

        // Check if this instance overlaps with an existing match
        const overlapsExisting = matches.some(
          (match) => (start >= match.start && start < match.end) || (end > match.start && end <= match.end),
        );

        if (overlapsExisting) {
          // Skip this instance and continue searching
          position = end;
          continue;
        }

        // Check word boundaries and exclusions before adding the match
        const prevChar = start > 0 ? lowerText[start - 1] : ' ';
        const nextChar = end < lowerText.length ? lowerText[end] : ' ';
        const isWordBoundary = /\W/.test(prevChar) && /\W/.test(nextChar);

        if (isWordBoundary && !isPositionExcluded(start)) {
          matches.push({
            word: text.slice(start, end),
            start,
            end,
          });
          found = true; // Found a valid match, stop searching for this keyword
        } else {
          // This instance doesn't meet criteria, continue searching
          position = start + 1;
        }
      }
    }

    // Sort matches to ensure correct ordering in the formatted output
    matches.sort((a, b) => a.start - b.start);

    // Construct the formatted text with highlighted spans for matched keywords
    const parts: string[] = [];
    let lastIndex = 0;

    matches.forEach((match) => {
      parts.push(
        text.slice(lastIndex, match.start),
        `<span tabindex='0' class="glossary-highlight underline" data-word="${match.word}">${match.word}</span>`,
      );
      lastIndex = match.end;
    });

    parts.push(text.slice(lastIndex));

    return {
      matches,
      formattedText: parts.join(''),
    };
  }, [text, keywords]);
};