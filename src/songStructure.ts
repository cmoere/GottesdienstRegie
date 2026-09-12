import type { ServiceItem, Slide } from './store';

export interface SongSection { id: string; label: string; slides: Slide[] }
export interface SongStructure { sections: SongSection[]; order: string[] }
export function readSong(item: ServiceItem): SongStructure {
  try {
    const value = JSON.parse(String(item.metadata.songStructure || ''));
    if (Array.isArray(value.sections) && Array.isArray(value.order)) return value;
  } catch { /* Existing songs are migrated only when explicitly edited. */ }
  const sections: SongSection[] = [];
  const order: string[] = [];
  for (const slide of item.slides) {
    const existing = sections.find(section => section.label === slide.title && section.slides[0].body === slide.body);
    if (existing) { order.push(existing.id); continue; }
    const section = { id: crypto.randomUUID(), label: slide.title || `Vers ${sections.length + 1}`, slides: [structuredClone(slide)] };
    sections.push(section); order.push(section.id);
  }
  return { sections, order };
}
export function songPatch(item: ServiceItem, structure: SongStructure): Partial<ServiceItem> {
  const slides: Slide[] = [];
  const occurrences = new Map<string, number>();
  for (const id of structure.order) {
    const section = structure.sections.find(section => section.id === id);
    if (!section) throw new Error('Unbekannter Songabschnitt');
    const occurrence = occurrences.get(id) || 0;
    occurrences.set(id, occurrence + 1);
    section.slides.forEach((template, part) => {
      const stableId = `${item.id}:song:${id}:${occurrence}:${part}`;
      slides.push({ ...structuredClone(template), id: stableId, itemId: item.id, order: slides.length,
        title: section.label, elements: template.elements.map((element, index) => ({ ...structuredClone(element), id: `${stableId}:element:${index}` })) });
    });
  }
  if (!slides.length) throw new Error('Bitte mindestens einen Abschnitt im Ablauf behalten.');
  return { slides, metadata: { ...item.metadata, songStructure: JSON.stringify(structure), songAdjusted: true,
    songOriginal: item.metadata.songOriginal || JSON.stringify({ slides: item.slides, metadata: item.metadata }) } };
}
export function shortSection(label: string) {
  return label.replace(/^(Verse?|Strophe)\s*/i, 'V').replace(/^(Chorus|Refrain)\s*/i, 'C').replace(/^Pre[- ]?Chorus/i, 'PC').replace(/^Bridge/i, 'B');
}
export function transposeChords(text: string, from: string, to: string) {
  from=from.split('/')[0];to=to.split('/')[0];
  const notes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const pitch = (note: string) => notes.indexOf(({Db:'C#',Eb:'D#',Gb:'F#',Ab:'G#',Bb:'A#'} as Record<string,string>)[note] || note);
  const shift = pitch(to) - pitch(from);
  if (pitch(from) < 0 || pitch(to) < 0) return text;
  return text.replace(/\[([A-G](?:#|b)?)([^\]]*)\]/g, (_, root, tail: string) => {
    const bass = tail.replace(/\/([A-G](?:#|b)?)/g, (_m, note) => '/' + notes[(pitch(note) + shift + 12) % 12]);
    return '[' + notes[(pitch(root) + shift + 12) % 12] + bass + ']';
  });
}
