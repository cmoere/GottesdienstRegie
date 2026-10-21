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
import {hydrateDynamicEventData,hydrateNowPlayingData} from './liveDynamicData';
import {audioPreflight} from './audio/audioPreflight';
import {backgroundAudioEngine} from './BackgroundAudioEngine';
import {useLiveOutputPreview} from './liveOutputPreview';
import {outputPresentationDelay} from './outputPresentation';
import {upcomingMedia} from './mediaWarmup';
import type {BannerContext} from './announcementBannerModel';
import {prepareServiceCountdown} from './ServiceCountdownBadge';
import {getCommunityRuntimeSnapshot} from './community/communityRuntime';

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
  private takeRevision:number|undefined;
  private takeMetadata=new Map<string,{countdownStartedAtMs:number;serviceCountdownAtMs?:number;bannerContext:Pick<BannerContext,'liveSection'|'countdownActive'>}>();
  private revision=0;
  private lastHash=0;
  private delivery=0;
  private committedDelivery=0;
  private commitTimer?:ReturnType<typeof setTimeout>;
  private pendingCommit?:()=>void;
  private cancelCommit(){clearTimeout(this.commitTimer);this.pendingCommit?.();this.pendingCommit=undefined}
  private async commit(snapshot:ReturnType<LiveEngine['snapshot']>,delivery:number){
    if(delivery!==this.delivery)return;
    this.cancelCommit();const committedDelivery=++this.committedDelivery;
    await new Promise<void>(resolve=>{
      const finish=()=>{this.pendingCommit=undefined;resolve()};
      const show=()=>{if(committedDelivery===this.committedDelivery)useLiveOutputPreview.setState({slide:snapshot});finish()};
      const delay=outputPresentationDelay(snapshot);
      if(!delay){show();return}
      this.pendingCommit=finish;this.commitTimer=setTimeout(show,delay);
    });
  }
  async preflight(assignments:Record<string,DisplayRole>,presentation:{hasPresentation:boolean;activeSlideCount:number;media:string[]}):Promise<DesktopPreflight>{const result=await (window.desktop?.preflight(assignments,presentation)??{ok:false,errors:['Die Desktop-Ausgabe ist nicht verfügbar.'],warnings:[]});const snapshot=await waitForCommunityRuntime();const state=usePresentation.getState();const community=communityPreflight(snapshot,state.eventLink?.eventKey,state.items.filter(item=>item.itemCategory==='loop').map(item=>({id:item.title,type:item.type,target:item.sectionId})));const warnings=await checkLyricLayouts(state.items,state.lyricScrolling),loopWarnings=loopPreflight(state.items,state.sections).warnings;return {...result,warnings:[...result.warnings,...warnings,...loopWarnings,...community.warnings,...audioPreflight(backgroundAudioEngine.getHealth()).warnings]}}
  private snapshot(slide:Slide){
    const state=usePresentation.getState(),item=state.items.find(entry=>entry.id===slide.itemId),dynamic=hydrateDynamicEventData(hydrateNowPlayingData(withSongOutputs(slide))),rendered=item?cloneRenderedSlideSnapshot(buildRenderedSlideSnapshot(dynamic,item,'main')).slide:structuredClone(dynamic),hash=outputRevision(rendered),presentAtMs=Date.now()+100;
    if(hash!==this.lastHash){this.lastHash=hash;this.revision+=1}
    // A delivery can refresh the same take. Editor edits must not restart its clock
    // or silently replace the section eligibility captured when it went live.
    if(this.takeRevision!==state.liveTransitionRevision){this.takeRevision=state.liveTransitionRevision;this.takeMetadata.clear()}
    let take=this.takeMetadata.get(slide.id);
    if(!take){
      const type=state.sections.find(section=>section.id===item?.sectionId)?.type;
      const liveSection:BannerContext['liveSection']=type==='preLoop'||type==='preProgram'?'pre':type==='postLoop'?'post':type==='warmup'?'warmup':type==='service'?'service':'other';
      take={countdownStartedAtMs:state.liveSlideId===slide.id?state.liveTakenAtMs??presentAtMs:presentAtMs,serviceCountdownAtMs:prepareServiceCountdown({enabled:usePreferences.getState().showServiceCountdown,sectionId:item?.sectionId??'',eventKey:state.eventLink?.eventKey,date:state.date,serviceTime:state.serviceTime},getCommunityRuntimeSnapshot().events),bannerContext:{liveSection,countdownActive:item?.type==='countdown'||item?.type==='loopCountdown'}};
      this.takeMetadata.set(slide.id,take);
    }
    return {...attachOutputRevision(rendered,this.revision),_serviceCountdownAtMs:take.serviceCountdownAtMs,_mediaWarmup:upcomingMedia(state.items,slide.id,state.sections.map(section=>section.id)),_presentAtMs:presentAtMs,_countdownStartedAtMs:take.countdownStartedAtMs,bannerContext:{...take.bannerContext}};
  }
  async start(assignments:Record<string,DisplayRole>,slide:Slide){if(!window.desktop)throw new Error('Die Desktop-Ausgabe ist nicht verfügbar.');this.takeRevision=undefined;this.takeMetadata.clear();const delivery=++this.delivery,snapshot=this.snapshot(slide),ok=await window.desktop.goOnAir(assignments,snapshot);if(ok)await this.commit(snapshot,delivery);return ok}
  async show(slide:Slide){const delivery=++this.delivery,snapshot=this.snapshot(slide),ok=await(window.desktop?.sendLiveSlide(snapshot)??false);if(ok)await this.commit(snapshot,delivery);return ok}
  async stop(){++this.delivery;++this.committedDelivery;this.cancelCommit();this.takeRevision=undefined;this.takeMetadata.clear();useLiveOutputPreview.setState({slide:null});return window.desktop?.goOffAir()??false}
}

export const liveEngine=new LiveEngine();
