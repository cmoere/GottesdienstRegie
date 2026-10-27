import {usePresentation} from '../../src/store';
import {liveEngine} from '../../src/LiveEngine';
import {usePowerPointStatus} from '../../src/powerPointLiveModel';
localStorage.setItem('gottesdienstregie.interface-tour','done');
const api=window as any;
api.seedOriginal=(document:unknown,displayId:number)=>{
 usePresentation.getState().loadDocument(document);
 const state=usePresentation.getState(),item=state.items.find(item=>item.metadata.powerPointSourceHash)!;
 state.updateItem(item.id,{sectionId:'service',section:'Gottesdienst',metadata:{...item.metadata,importMode:'original'}});
 // Repository imports retain their own source section. The fixture explicitly
 // assigns the imported item to the normal service for its postprogram handoff.
 usePresentation.setState(current=>({items:current.items.map(entry=>entry.id===item.id?{...entry,sectionId:'service',section:'Gottesdienst'}:entry),displayRoles:{[String(displayId)]:'main'},mainDisplayId:displayId,selectedItemId:item.id,selectedSlideId:item.slides[0].id,previewItemId:item.id,previewSlideId:item.slides[0].id,testPostProgramScenario:'leave-room'}));
 state.setMode('edit');
};
api.startOriginal=async()=>{const state=usePresentation.getState(),item=state.items.find(item=>item.metadata.powerPointSourceHash)!;state.setMode('preview');state.goLive(item.id,item.slides[0].id);const ok=await liveEngine.start(state.displayRoles,item.slides[0]);state.setOnAir(ok);return ok};
api.originalState=()=>{const state=usePresentation.getState();return{onAir:state.onAir,liveItemId:state.liveItemId,liveSlideId:state.liveSlideId,selectedSlideId:state.selectedSlideId,status:usePowerPointStatus.getState()}};
api.nextOriginal=()=>usePresentation.getState().nextLive();
api.pauseOriginal=(paused:boolean)=>{const state=usePresentation.getState();state.setLiveTimerPaused(paused?state.liveSlideId:undefined)};
api.stopOriginal=async()=>{await liveEngine.stop();usePresentation.getState().setOnAir(false)};
api.selectOtherOriginal=()=>{const state=usePresentation.getState(),item=state.items.find(item=>item.id===state.liveItemId)!;state.select(item.id,item.slides.at(-1)!.id)};
window.confirm=()=>true;
api.fixtureAlerts=[];window.alert=message=>api.fixtureAlerts.push(message);
await import('../../src/main');
