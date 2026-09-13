import type {ServiceItem} from './store';
import {lyricSettings,type LyricScrollingSettings} from './lyricScrolling';
import {fontStack} from './fonts';

/** Runs during preflight, never on NEXT or an animation frame. */
export async function checkLyricLayouts(items:ServiceItem[],settings?:LyricScrollingSettings):Promise<string[]> {
 const warnings:string[]=[],canvas=document.createElement('canvas'),context=canvas.getContext('2d');
 if(!context)return warnings;
 const deadline=performance.now()+1000,loaded=new Set<string>();
 for(const item of items.filter(item=>item.enabled&&!item.disabled&&lyricSettings(item,settings).enabled)){
  for(const slide of item.slides.filter(slide=>slide.enabled&&slide.body.trim())){
   const text=slide.elements.find(element=>element.visible&&element.type==='text');if(!text)continue;
   const p=text.properties,size=Number(p.fontSize||72),font=`${String(p.fontStyle||'normal')} ${Number(p.fontWeight||400)} ${size}px ${fontStack(String(p.fontFamily||'Cera Pro'))}`;
   if(!loaded.has(font)&&performance.now()<deadline){loaded.add(font);try{await Promise.race([document.fonts.load(font),new Promise(resolve=>setTimeout(resolve,Math.max(0,deadline-performance.now())))])}catch{}}
   let fontReady=false;try{fontReady=document.fonts.check(font)}catch{}
   if(!fontReady)warnings.push(`Song „${item.title}“: Schrift ist noch nicht geladen. Vorschau und Ersatzschrift prüfen.`);
   context.font=font;const width=Math.max(1,text.width-2*Number(p.padding||0));let lines=0;
   for(const line of slide.body.split('\n')){let current='';lines++;for(const word of line.split(/\s+/)){const next=current?`${current} ${word}`:word;if(current&&context.measureText(next).width>width){lines++;current=word}else current=next}}
   if(lines*size*Number(p.lineHeight||1.15)>text.height-2*Number(p.padding||0))warnings.push(`Song „${item.title}“, ${slide.title}: Lyrics überschreiten die Textfläche. Abschnitt vor ON AIR aufteilen oder Textfläche vergrößern; überstehender Text wird abgeschnitten, nicht automatisch verkleinert.`);
  }
 }
 return [...new Set(warnings)];
}
