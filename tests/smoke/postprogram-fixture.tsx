import React,{useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {ProductionWorkspace} from '../../src/ProductionWorkspace';
import {createServiceItem,usePresentation} from '../../src/store';
import {liveEngine} from '../../src/LiveEngine';
import {TestModeContext} from '../../src/TestModeWatermark';
import {EventService} from '../../src/community/EventService';
import {RoomService} from '../../src/community/RoomService';
import {PostProgramRoomNoticeController,PostProgramRoomNoticeService} from '../../src/community/PostProgramRoomNoticeService';
import '../../src/cera-pro.css';
import 'material-symbols/outlined.css';
import '../../src/styles.css';
import '../../src/settings-v08.css';
import '../../src/v09.css';
import '../../src/v010.css';
import '../../src/preview-workspace.css';
import '../../src/refinements.css';
import '../../src/v033.css';
import '../../src/version53.css';
import '../../src/version54.css';
import '../../src/version55.css';
import '../../src/version57.css';
import '../../src/version58.css';
import '../../src/version59.css';
import '../../src/version70.css';
import '../../src/version71.css';
import '../../src/version75.css';

const now=new Date(2026,9,9,12,0);
const event=(eventKey:string,time:string)=>({eventKey,titel:eventKey,start_datum:'2026-10-09',start_uhrzeit:time,ende_datum:'2026-10-09',ende_uhrzeit:'14:00',veranstaltungsort:'raum',raum:'-saal'});
const events=new EventService([event('current','10:00'),event('Gemeindeforum','12:30'),event('Zweiter Termin','13:01'),event('Zu spät','13:02')],new RoomService({'-saal':{raumname:'Gemeindesaal',etage:'EG'}}));
const controller=new PostProgramRoomNoticeController(new PostProgramRoomNoticeService(events),()=>0);
usePresentation.getState().newDocument('Native Nachprogramm-Prüfung');
const service=createServiceItem('content',{id:'service',sectionId:'service',body:'Letzte Gottesdienstfolie'});
usePresentation.setState({items:[service],eventLink:{eventKey:'current'},onAir:true,mode:'preview',previewLayout:'single',liveItemId:service.id,liveSlideId:service.slides[0].id});
(window as any).cancelNext=()=>{events.remove('Gemeindeforum');events.remove('Zweiter Termin');controller.prepare({linkedEventKey:'current'},now)};
function Fixture(){
  const state=usePresentation();
  useEffect(()=>{
    const item=state.items.find(item=>item.id===state.liveItemId),slide=item?.slides.find(slide=>slide.id===state.liveSlideId);
    if(!slide)return;
    if(item?.sectionId==='post')controller.prepare({eventLink:state.eventLink},now);
    void liveEngine.show(item?.sectionId==='post'?controller.outputForTake(slide,state.liveTransitionRevision):slide);
  },[state.liveTransitionRevision,state.liveSlideId]);
  return <TestModeContext.Provider value={true}><div style={{height:'100vh',display:'grid'}}><ProductionWorkspace canEdit/></div></TestModeContext.Provider>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
