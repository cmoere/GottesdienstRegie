import type {Slide} from './store';

export type SongTranslationMode = 'off' | 'parentheses' | 'below' | 'interleaved' | 'columns' | 'translationOnly';
export interface SongTranslation {language: string; text: string}
export const translationModes: {value: SongTranslationMode; label: string}[] = [
  {value:'off',label:'Aus'},
  {value:'parentheses',label:'Unter der Strophe in Klammern'},
  {value:'below',label:'Unter der Strophe ohne Klammern'},
  {value:'interleaved',label:'Zeilenweise im Wechsel'},
  {value:'columns',label:'Nebeneinander in zwei Spalten'},
  {value:'translationOnly',label:'Nur Übersetzung'},
];

/** Pure layout data shared by renderer and overflow check. Never alters source lyrics. */
export function translationBlocks(original: string, translation: SongTranslation | undefined, mode: SongTranslationMode): string[] {
  const translated = translation?.text?.trim();
  if (!translated || mode === 'off') return [original];
  if (mode === 'translationOnly') return [translated];
  if (mode === 'columns') return [original, translated];
  if (mode === 'parentheses') return [`${original}\n\n(${translated})`];
  if (mode === 'below') return [`${original}\n\n${translated}`];
  if (mode === 'interleaved') {
    const source=original.split(/\r?\n/), target=translated.split(/\r?\n/);
    return [Array.from({length:Math.max(source.length,target.length)},(_,index)=>[source[index],target[index]].filter(value=>value!==undefined).join('\n')).join('\n')];
  }
  return [original];
}

/** Derived render copy; coordinates and original text remain untouched in the document. */
export function translatedSlide(slide: Slide, fallback: SongTranslationMode): Slide {
  const primary=slide.elements.find(element=>element.visible&&element.type==='text');
  if (!primary || !String(primary.properties.text??slide.body).trim() || !slide.translation?.text?.trim()) return slide;
  const blocks=translationBlocks(String(primary.properties.text??slide.body),slide.translation,slide.songTranslationMode??fallback);
  if (blocks.length===1 && blocks[0]===String(primary.properties.text??slide.body)) return slide;
  const width=blocks.length===2?primary.width*0.48:primary.width;
  const elements=slide.elements.flatMap(element=>element.id!==primary.id?[element]:blocks.map((text,index)=>({
    ...element,id:index===0?element.id:`${element.id}:translation`,x:element.x+(index?primary.width*0.52:0),width,
    properties:{...element.properties,text},
  })));
  return {...slide,elements};
}
