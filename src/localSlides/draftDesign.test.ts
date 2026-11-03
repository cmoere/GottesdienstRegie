import {expect,it} from 'vitest';
import {DRAFT_COMPOSITIONS,type SlideDraft} from '../../shared/localSlideDraft';
import {buildDraftItem} from './draftInsertion';

it('turns each validated AI composition into bounded editable text/shapes and real image elements',()=>{
 const drafts:SlideDraft[]=DRAFT_COMPOSITIONS.map(layout=>({title:'Gemeinsam Hoffnung teilen',body:'Wir hören einander zu. Wir unterstützen Menschen im Alltag. Wir beten gemeinsam.',design:{layout,accent:'#608f9a',imagePrompt:'A peaceful sunlit meadow'}})),images=Object.fromEntries(drafts.map((_,i)=>[i,'gottesdienst-media://media/owned.png']));
 const item=buildDraftItem('Hoffnung',drafts,'service','ai',images);
 expect(item.slides).toHaveLength(8);expect(new Set(item.slides.flatMap(slide=>slide.elements.map(element=>element.id))).size).toBe(item.slides.flatMap(slide=>slide.elements).length);
 for(const slide of item.slides){expect(slide.elements.filter(element=>element.type==='text').map(element=>element.properties.text)).toEqual([slide.title,slide.body]);for(const element of slide.elements){expect(element.x).toBeGreaterThanOrEqual(0);expect(element.y).toBeGreaterThanOrEqual(0);expect(element.x+element.width).toBeLessThanOrEqual(1920);expect(element.y+element.height).toBeLessThanOrEqual(1080);expect(element.visible).toBe(true)}}
 for(const index of [0,1,2,7])expect(item.slides[index].elements.some(element=>element.type==='image')).toBe(true);
 expect(new Set(item.slides.map(slide=>JSON.stringify(slide.elements.map(element=>[element.type,element.x,element.y,element.width,element.height])))).size).toBeGreaterThanOrEqual(6);
});
it('does not turn a picture prompt or remote model string into an executable image URL',()=>{const item=buildDraftItem('Thema',[{title:'Titel',body:'Text',design:{layout:'photo',accent:'#699f3e',imagePrompt:'https://untrusted.invalid'}}],'service','ai');expect(item.slides[0].elements.some(element=>element.type==='image')).toBe(false);});
