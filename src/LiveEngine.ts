import type { DisplayRole, Slide } from './store';
import { usePresentation } from './store';

function withSongOutputs(slide: Slide): Slide {
  const snapshot=structuredClone(slide),item=usePresentation.getState().items.find(item=>item.id===slide.itemId);
  if(item?.type!=='song')return snapshot;
  return Object.assign(snapshot,{songOutput:{chords:String(item.metadata.chords||''),showChords:item.metadata.showChordsStage===true,currentNext:item.metadata.stageCurrentNext!==false,next:item.slides[item.slides.findIndex(page=>page.id===slide.id)+1]?.body||'',lowerThird:item.metadata.livestreamLowerThird===true}});
}

export class LiveEngine{
  async preflight(assignments:Record<string,DisplayRole>,presentation:{hasPresentation:boolean;activeSlideCount:number;media:string[]}):Promise<DesktopPreflight>{return window.desktop?.preflight(assignments,presentation)??{ok:false,errors:['Die Desktop-Ausgabe ist nicht verfügbar.'],warnings:[]}}
  async start(assignments:Record<string,DisplayRole>,slide:Slide){if(!window.desktop)throw new Error('Die Desktop-Ausgabe ist nicht verfügbar.');return window.desktop.goOnAir(assignments,withSongOutputs(slide))}
  async show(slide:Slide){return window.desktop?.sendLiveSlide(withSongOutputs(slide))??false}
  async stop(){return window.desktop?.goOffAir()??false}
}

export const liveEngine=new LiveEngine();
