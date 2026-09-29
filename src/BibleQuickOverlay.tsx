import type { CSSProperties } from 'react';
import type { QuickScreenConfig } from './preferences';
import {OSB_COLORS,OSB_SPEED_FACTOR} from './osb/settingsModel';
import {normalizeBibleDisplayText} from './quickScreenUi';

const verseParts = (line: string) => {
  const match = line.match(/^(\d+)\s+(.*)$/);
  return { number: match?.[1], text: match?.[2] ?? line };
};

export function BibleQuickOverlay({ quick, reducedMotion, staticPreview }: { quick: QuickScreenConfig; reducedMotion: boolean; staticPreview: boolean }) {
  const pageIndex = Math.min(quick.pageIndex ?? 0, Math.max(0, (quick.pages?.length ?? 1) - 1));
  const lines = (quick.pages?.[pageIndex] ?? (quick.text ?? '').split('\n').filter(Boolean)).map(normalizeBibleDisplayText);
  const characters = lines.reduce((total, line) => total + line.length, 0);
  const density = characters > 800 || lines.length > 8 ? 'high' : characters > 440 || lines.length > 5 ? 'medium' : 'normal';
  const noAnimation = reducedMotion || staticPreview;

  const osb=quick.osb,style=osb?.style??'book',accent=OSB_COLORS[osb?.accentColor??'turquoise'],speed=OSB_SPEED_FACTOR[osb?.animationSpeed??'normal'];
  return <div className={`bible-book osb-style-${style} reference-${osb?.referencePosition??'top-left'}`} style={{'--osb-accent':accent,'--osb-speed':speed} as CSSProperties}>
    <article className={`bible-page density-${density}${noAnimation ? ' no-animation' : ''}`} key={pageIndex} aria-label={`${quick.reference ?? quick.name}, ${quick.translation ?? ''}`}>
      {osb?.showReference!==false&&<header><span>{quick.reference ?? quick.name}</span>{osb?.showTranslationName!==false&&<small>{quick.translation}</small>}</header>}
      <main>{lines.map((line, index) => {
        const verse = verseParts(line);
        return <p key={`${index}-${line}`} style={{ '--verse-delay': `${0.22 + index * 0.13}s` } as CSSProperties}>
          {verse.number && <sup>{verse.number}</sup>}<span className="bible-verse-text">{verse.text}</span>
        </p>;
      })}</main>
      {(quick.pages?.length ?? 0) > 1 && <footer>{pageIndex + 1} / {quick.pages!.length}</footer>}
    </article>
  </div>;
}
