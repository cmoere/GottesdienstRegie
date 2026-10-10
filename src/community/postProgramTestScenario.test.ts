import {expect,it} from 'vitest';
import {PostProgramRoomNoticeService,PostProgramRoomNoticeController} from './PostProgramRoomNoticeService';
import {EventService} from './EventService';
import {canAdvanceLive,createServiceItem,presentationDocument,usePresentation} from '../store';

it('prepares either explicit test scenario without inventing a real event link',()=>{
 const controller=new PostProgramRoomNoticeController(new PostProgramRoomNoticeService(new EventService()));
 const now=new Date('2026-10-10T10:00:00Z');
 controller.prepare({},now,{mode:'test',scenario:'next-events'});
 const first=controller.beginTransition();
 expect(first?.notice).toMatchObject({type:'next-events',events:[{title:'Testveranstaltung (Beispieldaten)',room:'Testraum · EG'}]});
 controller.prepare({},now,{mode:'test',scenario:'leave-room'});
 expect(controller.current()).toEqual(first);
 expect(controller.beginTransition()?.notice).toEqual({type:'leave-room',text:'Wir bitten alle Besucher, den Raum zu verlassen.'});
 controller.prepare({},now,{mode:'normal',scenario:'next-events'});
 expect(controller.beginTransition()).toBeNull();
});
it('allows unlinked test navigation and clears the choice on stop and document load',()=>{
 usePresentation.getState().newDocument('Test');
 const item=createServiceItem('content',{sectionId:'service'});
 usePresentation.setState({items:[item],onAir:true,liveItemId:item.id,liveSlideId:item.slides[0].id});
 usePresentation.getState().setTestPostProgramScenario('leave-room');
 expect(canAdvanceLive(usePresentation.getState())).toBe(true);
 usePresentation.getState().nextLive();
 expect(usePresentation.getState().items.find(i=>i.id===usePresentation.getState().liveItemId)?.sectionId).toBe('post');
 expect(presentationDocument(usePresentation.getState())).not.toHaveProperty('testPostProgramScenario');
 usePresentation.getState().setOnAir(false);
 expect(usePresentation.getState().testPostProgramScenario).toBeUndefined();
 usePresentation.getState().setTestPostProgramScenario('next-events');
 usePresentation.getState().newDocument('Normal');
 expect(usePresentation.getState().testPostProgramScenario).toBeUndefined();
});
