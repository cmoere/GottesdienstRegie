export interface LyricLayoutOptions {
  charactersPerLine: number;
}

export interface LyricSplitOptions {
  maxLines: number;
}

const cleanLines = (text: string) => text.replace(/\r/g, '').trim().split('\n').map(line => line.trim()).filter(Boolean);

export function estimateLyricLines(text: string, options: LyricLayoutOptions): number {
  const width = Math.max(1, Math.floor(options.charactersPerLine));
  return cleanLines(text).reduce((total, line) => {
    const words = line.split(/\s+/).filter(Boolean);
    if (!words.length) return total + 1;
    let lines = 1;
    let current = '';
    for (const word of words) {
      if (word.length > width) {
        lines += Math.ceil(word.length / width) - (current ? 0 : 1);
        current = word.slice(-((word.length - 1) % width + 1));
        continue;
      }
      const next = current ? `${current} ${word}` : word;
      if (current && next.length > width) {
        lines += 1;
        current = word;
      } else current = next;
    }
    return total + lines;
  }, 0);
}

export function splitLyrics(text: string, options: LyricSplitOptions): string[] {
  const maxLines = Math.max(1, Math.floor(options.maxLines));
  const normalized = text.replace(/\r/g, '').trim();
  if (!normalized) return [];
  const paragraphs = normalized.split(/\n\s*\n/).map(paragraph => paragraph.split('\n').map(line => line.trim()).filter(Boolean).join('\n')).filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  for (const paragraph of paragraphs) {
    const lines = paragraph.split('\n');
    if (lines.length > maxLines) {
      if (current) { chunks.push(current); current = ''; }
      for (let index = 0; index < lines.length; index += maxLines) chunks.push(lines.slice(index, index + maxLines).join('\n'));
      continue;
    }
    if (!current) { current = paragraph; continue; }
    const currentLines = current.split('\n').length;
    if (currentLines + lines.length <= maxLines) current = `${current}\n${paragraph}`;
    else { chunks.push(current); current = paragraph; }
  }
  if (current) chunks.push(current);
  return chunks.filter(Boolean);
}

export function hasLyricOverflow(text: string, options: LyricSplitOptions): boolean {
  return splitLyrics(text, options).length > 1;
}
