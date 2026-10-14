import {createCountdownPresetMetadata,getCountdownPreset} from './countdownPresets';
import {usePresentation} from './store';
export function insertCountdownPreset(presetId:string,sectionId?:string):boolean{
  const preset=getCountdownPreset(presetId),metadata=createCountdownPresetMetadata(presetId);if(!preset||!metadata)return false;
  const state=usePresentation.getState(),section=sectionId??state.items.find(i=>i.id===state.selectedItemId)?.sectionId??'service';
  if(!state.sections.some(s=>s.id===section))return false;
  state.addItem('countdown',{title:`Countdown · ${preset.durationSeconds>=60?`${preset.durationSeconds/60} Min.`:`${preset.durationSeconds} Sek.`}`,section:'',sectionId:section,body:'',metadata:{...metadata,durationSeconds:preset.durationSeconds,endBehavior:'hold'}});
  const current=usePresentation.getState(),item=current.items.find(i=>i.id===current.selectedItemId);
  if(item?.type!=='countdown'||item.metadata.countdownPresetId!==presetId)return false;
  current.updateSlide({background:'#102029',elements:[{id:`${item.id}-countdown`,type:'text',name:'Countdown',x:0,y:0,width:1920,height:1080,rotation:0,opacity:1,locked:false,visible:true,zIndex:1,properties:{...metadata,text:'',timerDurationSeconds:preset.durationSeconds}}]});
  return true;
}
