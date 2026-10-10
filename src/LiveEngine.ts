import type { DisplayRole, Slide } from './store';
import { usePresentation } from './store';
import { lyricPacket } from './lyricScrolling';
import { checkLyricLayouts } from './lyricPreflight';
import { loopPreflight } from './loopDataService';
import {usePreferences} from './preferences';
import { stageChordRows } from './songStructure';
import { buildRenderedSlideSnapshot, cloneRenderedSlideSnapshot } from './renderedSlideSnapshot';
import {outputRevision} from './release54Model';
import {attachOutputRevision} from './release55Model';
import {communityPreflight} from './community/communityPreflight';
import {waitForCommunityRuntime} from './community/communityRuntime';
import {hydrateDynamicEventData} from './liveDynamicData';
import {audioPreflight} from './audio/audioPreflight';
import {backgroundAudioEngine} from './BackgroundAudioEngine';
import {useLiveOutputPreview} from './liveOutputPreview';

function withSongOutputs(slide: Slide): Slide {
  const snapshot=structuredClone(slide),item=usePresentation.getState().items.find(item=>item.id===slide.itemId);
  if(item?.type!=='song')return snapshot;
  const chords=String(item.metadata.chords||'');
  snapshot.songTranslationMode=usePreferences.getState().songTranslationMode;
  const packet=lyricPacket(item,slide,usePresentation.getState().lyricScrolling);
  if(packet)packet.slides=packet.slides.map(page=>({...page,songTranslationMode:snapshot.songTranslationMode}));
  return Object.assign(snapshot,{lyricScroll:packet,songOutput:{chords,stageRows:stageChordRows(slide.body,chords),showChords:item.metadata.showChordsStage===true,currentNext:item.metadata.stageCurrentNext!==false,next:item.slides.filter(page=>page.enabled).slice(item.slides.filter(page=>page.enabled).findIndex(page=>page.id===slide.id)+1)[0]?.body||'',lowerThird:item.metadata.livestreamLowerThird===true}});
}

export class LiveEngine{
  private revision=0;
  private lastHash=0;
  private delivery=0;
  async preflight(assignments:Record<string,DisplayRole>,presentation:{hasPresentation:boolean;activeSlideCount:number;media:string[]}):Promise<DesktopPreflight>{const result=await (window.desktop?.preflight(assignments,presentation)??{ok:false,errors:['Die Desktop-Ausgabe ist nicht verfügbar.'],warnings:[]});const snapshot=await waitForCommunityRuntime();const state=usePresentation.getState();const community=communityPreflight(snapshot,state.eventLink?.eventKey,state.items.filter(item=>item.itemCategory==='loop').map(item=>({id:item.title,type:item.type,target:item.sectionId})));const warnings=await checkLyricLayouts(state.items,state.lyricScrolling),loopWarnings=loopPreflight(state.items,state.sections).warnings;return {...result,warnings:[...result.warnings,...warnings,...loopWarnings,...community.warnings,...audioPreflight(backgroundAudioEngine.getHealth()).warnings]}}
  private snapshot(slide:Slide){const state=usePresentation.getState(),item=state.items.find(entry=>entry.id===slide.itemId),dynamic=hydrateDynamicEventData(withSongOutputs(slide)),rendered=item?cloneRenderedSlideSnapshot(buildRenderedSlideSnapshot(dynamic,item,'main')).slide:structuredClone(dynamic),hash=outputRevision(rendered);if(hash!==this.lastHash){this.lastHash=hash;this.revision+=1}return attachOutputRevision(rendered,this.revision)}
  async start(assignments:Record<string,DisplayRole>,slide:Slide){if(!window.desktop)throw new Error('Die Desktop-Ausgabe ist nicht verfügbar.');const delivery=++this.delivery,snapshot=this.snapshot(slide),ok=await window.desktop.goOnAir(assignments,snapshot);if(ok&&delivery===this.delivery)useLiveOutputPreview.setState({slide:snapshot});return ok}
  async show(slide:Slide){const delivery=++this.delivery,snapshot=this.snapshot(slide),ok=await(window.desktop?.sendLiveSlide(snapshot)??false);if(ok&&delivery===this.delivery)useLiveOutputPreview.setState({slide:snapshot});return ok}
  async stop(){++this.delivery;useLiveOutputPreview.setState({slide:null});return window.desktop?.goOffAir()??false}
}

export const liveEngine=new LiveEngine();
