import type { CSSProperties } from 'react';
import type { QuickScreenConfig } from './preferences';

const verseParts = (line: string) => {
  const match = line.match(/^(\d+)\s+(.*)$/);
  return { number: match?.[1], text: match?.[2] ?? line };
};

export function BibleQuickOverlay({ quick, reducedMotion, staticPreview }: { quick: QuickScreenConfig; reducedMotion: boolean; staticPreview: boolean }) {
  const pageIndex = Math.min(quick.pageIndex ?? 0, Math.max(0, (quick.pages?.length ?? 1) - 1));
  const lines = quick.pages?.[pageIndex] ?? (quick.text ?? '').split('\n').filter(Boolean);
  const characters = lines.reduce((total, line) => total + line.length, 0);
  const density = characters > 800 || lines.length > 8 ? 'high' : characters > 440 || lines.length > 5 ? 'medium' : 'normal';
  const noAnimation = reducedMotion || staticPreview;

  return <div className="bible-book">
    <article className={`bible-page density-${density}${noAnimation ? ' no-animation' : ''}`} key={pageIndex} aria-label={`${quick.reference ?? quick.name}, ${quick.translation ?? ''}`}>
      <header><span>{quick.reference ?? quick.name}</span><small>{quick.translation}</small></header>
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
