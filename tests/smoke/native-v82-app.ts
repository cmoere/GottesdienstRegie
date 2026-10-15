import {usePreferences} from '../../src/preferences';
import {createServiceItem,usePresentation} from '../../src/store';
// This isolated smoke profile may have ended its previous run in the Arabic chapter.
usePreferences.getState().setLanguage('de');
await import('./native-v77');
(window as any).v82Locale=(language:any)=>usePreferences.getState().setLanguage(language);
(window as any).seedV82Countdown=()=>{
  usePresentation.getState().newDocument('Countdown · Probe');
  const item=createServiceItem('countdown',{id:'demo-countdown',title:'Countdown',sectionId:'service',autoAdvance:false,plannedDuration:60000}),next=createServiceItem('content',{id:'demo-next',sectionId:'service',title:'Nächster Inhalt'});
  item.slides[0].elements[0].properties={timerDurationSeconds:60,countdownPresetId:'countdown:60:cross'};
  usePresentation.setState({items:[item,next,...usePresentation.getState().items],selectedItemId:item.id,selectedSlideId:item.slides[0].id,previewItemId:item.id,previewSlideId:item.slides[0].id,displayRoles:{'123':'main'},mainDisplayId:123,previewLayout:'single'});
};
(window as any).v82EditNext=()=>usePresentation.setState(state=>({items:state.items.map(item=>item.id==='demo-next'?{...item,title:'Nächster Inhalt bearbeitet'}:item)}));
