import type { DisplayRole, Slide } from './store';

export class LiveEngine{
  async preflight(assignments:Record<string,DisplayRole>,presentation:{hasPresentation:boolean;activeSlideCount:number;media:string[]}):Promise<DesktopPreflight>{return window.desktop?.preflight(assignments,presentation)??{ok:false,errors:['Die Desktop-Ausgabe ist nicht verfügbar.'],warnings:[]}}
  async start(assignments:Record<string,DisplayRole>,slide:Slide){if(!window.desktop)throw new Error('Die Desktop-Ausgabe ist nicht verfügbar.');return window.desktop.goOnAir(assignments,structuredClone(slide))}
  async show(slide:Slide){return window.desktop?.sendLiveSlide(structuredClone(slide))??false}
  async stop(){return window.desktop?.goOffAir()??false}
}

export const liveEngine=new LiveEngine();
