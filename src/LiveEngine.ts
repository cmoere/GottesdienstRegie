import type { DisplayRole, Slide } from './store';
import { usePresentation } from './store';
import { lyricPacket } from './lyricScrolling';
import { checkLyricLayouts } from './lyricPreflight';
import { loopPreflight } from './loopDataService';
import { stageChordRows } from './songStructure';

function withSongOutputs(slide: Slide): Slide {
  const snapshot=structuredClone(slide),item=usePresentation.getState().items.find(item=>item.id===slide.itemId);
  if(item?.type!=='song')return snapshot;
  const chords=String(item.metadata.chords||'');
  return Object.assign(snapshot,{lyricScroll:lyricPacket(item,slide,usePresentation.getState().lyricScrolling),songOutput:{chords,stageRows:stageChordRows(slide.body,chords),showChords:item.metadata.showChordsStage===true,currentNext:item.metadata.stageCurrentNext!==false,next:item.slides.filter(page=>page.enabled).slice(item.slides.filter(page=>page.enabled).findIndex(page=>page.id===slide.id)+1)[0]?.body||'',lowerThird:item.metadata.livestreamLowerThird===true}});
}

export class LiveEngine{
  async preflight(assignments:Record<string,DisplayRole>,presentation:{hasPresentation:boolean;activeSlideCount:number;media:string[]}):Promise<DesktopPreflight>{const result=await (window.desktop?.preflight(assignments,presentation)??{ok:false,errors:['Die Desktop-Ausgabe ist nicht verfügbar.'],warnings:[]});const state=usePresentation.getState();const warnings=await checkLyricLayouts(state.items,state.lyricScrolling),loopWarnings=loopPreflight(state.items,state.sections).warnings;return {...result,warnings:[...result.warnings,...warnings,...loopWarnings]}}
  async start(assignments:Record<string,DisplayRole>,slide:Slide){if(!window.desktop)throw new Error('Die Desktop-Ausgabe ist nicht verfügbar.');return window.desktop.goOnAir(assignments,withSongOutputs(slide))}
  async show(slide:Slide){return window.desktop?.sendLiveSlide(withSongOutputs(slide))??false}
  async stop(){return window.desktop?.goOffAir()??false}
}

export const liveEngine=new LiveEngine();
