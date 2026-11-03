import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,act,cleanup} from '@testing-library/react';
import {LocalSlideDraftDialog} from './LocalSlideDraftDialog';
import {usePresentation} from '../store';
import {usePreferences} from '../preferences';
import type {SlideDraft} from '../../shared/localSlideDraft';
vi.mock('../SlideRenderer',()=>({SlideRenderer:({slide}:any)=><div>{slide.body}</div>}));
describe('local AI draft review',()=>{
 beforeEach(()=>{
  usePreferences.setState({language:'de',germanRegion:null});
  usePresentation.getState().newDocument('Owned AI UI test','2026-11-03');
  window.desktop={localSlides:{status:vi.fn(async()=>({state:'ready',downloadedBytes:10,totalBytes:10,busy:false})),generate:vi.fn(async()=>[{title:'Danke sagen',body:'Wem möchtest du heute danken?'}]),cancel:vi.fn(async()=>true)}} as any;
 });
 afterEach(()=>{cleanup();delete window.desktop});
 it('requires explicit acceptance and cancels isolated work when closed',async()=>{
  const initial=usePresentation.getState().items.length,close=vi.fn();
  const {unmount}=render(<LocalSlideDraftDialog sectionId="service" close={close}/>);
  await screen.findByRole('button',{name:'Folien erstellen'});
  fireEvent.change(screen.getByLabelText('Thema'),{target:{value:'Dankbarkeit'}});
  fireEvent.change(screen.getByLabelText('Anzahl Folien'),{target:{value:'1'}});
  fireEvent.click(screen.getByRole('button',{name:'Folien erstellen'}));
  await screen.findByRole('button',{name:'In den Ablauf übernehmen'});
  expect(usePresentation.getState().items).toHaveLength(initial);
  fireEvent.click(screen.getByRole('button',{name:'In den Ablauf übernehmen'}));
  expect(usePresentation.getState().items).toHaveLength(initial+1);expect(close).toHaveBeenCalledOnce();
  unmount();expect(window.desktop?.localSlides?.cancel).toHaveBeenCalled();
 });
 it('blocks drafting and acceptance as soon as ON AIR is active',async()=>{
  usePresentation.setState({onAir:true});render(<LocalSlideDraftDialog sectionId="service" close={()=>{}}/>);
  await screen.findByText('Die Folien-KI steht nur OFF AIR zur Verfügung.');
  expect(screen.getByRole('button',{name:'Folien erstellen'})).toBeDisabled();
 });
 it('discards a late inference result when ON AIR starts while the request is pending',async()=>{
  let finish!:(value:SlideDraft[])=>void;
  window.desktop!.localSlides!.generate=vi.fn(()=>new Promise<SlideDraft[]>(resolve=>{finish=resolve}));
  const before=usePresentation.getState().items.length;
  render(<LocalSlideDraftDialog sectionId="service" close={()=>{}}/>);
  await screen.findByRole('button',{name:'Folien erstellen'});
  fireEvent.change(screen.getByLabelText('Thema'),{target:{value:'Dankbarkeit'}});
  fireEvent.click(screen.getByRole('button',{name:'Folien erstellen'}));
  await waitFor(()=>expect(window.desktop!.localSlides!.generate).toHaveBeenCalledOnce());
  act(()=>usePresentation.setState({onAir:true}));
  await act(async()=>{finish([{title:'Late draft',body:'Must not be accepted'}]);await Promise.resolve()});
  expect(screen.queryByRole('button',{name:'In den Ablauf übernehmen'})).not.toBeInTheDocument();
  expect(usePresentation.getState().items).toHaveLength(before);
 });
});
