import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {ProductionWorkspace} from './ProductionWorkspace';
import {createServiceItem,usePresentation} from './store';
import {liveEngine} from './LiveEngine';
import {withPostProgramRoomNotice} from './community/PostProgramRoomNoticeService';
import {TestModeContext} from './TestModeWatermark';

beforeEach(()=>{
  usePresentation.getState().newDocument('Nachprogramm-Test');
  vi.stubGlobal('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}});
  Element.prototype.scrollIntoView=()=>{};
  window.desktop={sendLiveSlide:async()=>true,goOffAir:async()=>true} as unknown as typeof window.desktop;
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();delete window.desktop});

it.each([false,true])('allows the final service Next button to enter post program (test mode: %s)',testMode=>{
  const service=createServiceItem('content',{id:'service',sectionId:'service'});
  usePresentation.setState({items:[service],eventLink:{eventKey:'current'},onAir:true,mode:'preview',previewLayout:'single',liveItemId:service.id,liveSlideId:service.slides[0].id});
  render(<TestModeContext.Provider value={testMode}><ProductionWorkspace canEdit/></TestModeContext.Provider>);
  const next=screen.getByTitle('Nächste MAIN-Folie');
  expect(next).toBeEnabled();
  fireEvent.click(next);
  const state=usePresentation.getState();
  expect(state.items.find(item=>item.id===state.liveItemId)?.sectionId).toBe('post');
  expect(screen.queryAllByTestId('test-mode-watermark')).toHaveLength(testMode?2:0);
  expect(screen.getByTitle('Nächste MAIN-Folie')).toBeEnabled();
  const revision=state.liveTransitionRevision;
  fireEvent.click(screen.getByTitle('Nächste MAIN-Folie'));
  expect(usePresentation.getState().liveTransitionRevision).toBe(revision+1);
});

it('does not invent a post target for an unlinked final service slide',()=>{
  const service=createServiceItem('content',{id:'service',sectionId:'service'});
  usePresentation.setState({items:[service],eventLink:undefined,onAir:true,mode:'preview',previewLayout:'single',liveItemId:service.id,liveSlideId:service.slides[0].id});
  render(<ProductionWorkspace canEdit/>);
  expect(screen.getByTitle('Nächste MAIN-Folie')).toBeDisabled();
});

it('mirrors the committed room notice in both live previews without modifying the editable slide',async()=>{
  const post=createServiceItem('infoCard',{id:'post',sectionId:'post',body:'Ursprüngliche Folie'}),slide=post.slides[0];
  usePresentation.setState({items:[post],onAir:true,mode:'preview',previewLayout:'single',liveItemId:post.id,liveSlideId:slide.id,selectedItemId:post.id,selectedSlideId:slide.id});
  render(<ProductionWorkspace canEdit/>);
  await act(async()=>{await liveEngine.show(withPostProgramRoomNotice(slide,{sessionId:1,headerColor:'#608F9A',page:0,pageCount:1,notice:{type:'leave-room',text:'Wir bitten alle Besucher, den Raum zu verlassen.'}}))});
  expect(screen.getAllByText('Wir bitten alle Besucher, den Raum zu verlassen.')).toHaveLength(2);
  expect(usePresentation.getState().items[0].slides[0]).not.toHaveProperty('postProgramRoomNotice');
  act(()=>usePresentation.getState().setMode('edit'));
  expect(screen.queryByLabelText('Nachprogramm-Raumhinweis')).not.toBeInTheDocument();
  await act(async()=>{await liveEngine.stop();usePresentation.getState().setOnAir(false);usePresentation.getState().setMode('preview')});
  expect(screen.queryByLabelText('Nachprogramm-Raumhinweis')).not.toBeInTheDocument();
});
