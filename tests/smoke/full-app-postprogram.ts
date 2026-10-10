// Only fixture data/bootstrap here. Start, preflight, community subscriptions,
// navigation and output effects below are the real App implementation.
import {createServiceItem,usePresentation} from '../../src/store';
localStorage.setItem('gottesdienstregie.interface-tour','done');
function seed(linked=true){
 usePresentation.getState().newDocument('Nachprogramm Integration');
 const item=createServiceItem('content',{id:'last-service',sectionId:'service',body:'Letzte Gottesdienstfolie'});
 usePresentation.setState({items:[item],selectedItemId:item.id,selectedSlideId:item.slides[0].id,previewItemId:item.id,previewSlideId:item.slides[0].id,displayRoles:{'123':'main'},mainDisplayId:123,previewLayout:'single'});
 if(linked)usePresentation.getState().updatePresentation({eventId:'current'});
}
seed();
(window as any).seedPostProgram=seed;
(window as any).postProgramState=()=>({onAir:usePresentation.getState().onAir,eventKey:usePresentation.getState().eventLink?.eventKey,scenario:usePresentation.getState().testPostProgramScenario});
(window as any).testConfirmations=[];
window.confirm=message=>{(window as any).testConfirmations.push(message);return true};
window.alert=message=>{throw new Error('Unexpected alert: '+message)};
await import('../../src/main');
