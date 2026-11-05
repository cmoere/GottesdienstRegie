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
 it('accepts a text draft ON AIR without changing the current take or requesting images',async()=>{
  const generateImage=vi.fn();
  window.desktop!.localImages={status:vi.fn(async()=>({state:'missing' as const,downloadedBytes:0,totalBytes:10,busy:false,progress:0})),generate:generateImage,accept:vi.fn(),discard:vi.fn(async()=>{})};
  usePresentation.setState({onAir:true,liveItemId:'live-song',liveSlideId:'live-verse',mode:'preview'});
  render(<LocalSlideDraftDialog sectionId="service" close={()=>{}}/>);
  fireEvent.change(screen.getByLabelText('Thema'),{target:{value:'Dankbarkeit'}});
  await waitFor(()=>expect(screen.getByRole('button',{name:'Folien erstellen'})).toBeEnabled());
  fireEvent.click(screen.getByRole('button',{name:'Folien erstellen'}));
  fireEvent.click(await screen.findByRole('button',{name:'In den Ablauf übernehmen'}));
  expect(generateImage).not.toHaveBeenCalled();
  expect(usePresentation.getState().items.some(item=>item.title==='Dankbarkeit')).toBe(true);
  expect(usePresentation.getState()).toMatchObject({onAir:true,liveItemId:'live-song',liveSlideId:'live-verse',mode:'preview'});
 });
 it('generates real image previews sequentially and saves them only on acceptance',async()=>{
  window.desktop!.localSlides!.generate=vi.fn(async():Promise<SlideDraft[]>=>[{title:'Hoffnung',body:'Gemeinsam hoffen.',design:{layout:'cover',accent:'#699f3e',imagePrompt:'A peaceful meadow'}}]);
  const imageApi={status:vi.fn(async()=>({state:'ready' as const,downloadedBytes:10,totalBytes:10,busy:false,progress:0})),generate:vi.fn(async()=>({id:'owned-id',preview:'data:image/png;base64,preview'})),accept:vi.fn(async()=>['gottesdienst-media://media/owned.png']),discard:vi.fn(async()=>{})};window.desktop!.localImages=imageApi;
  const before=usePresentation.getState().items.length;render(<LocalSlideDraftDialog sectionId="service" close={()=>{}}/>);
  fireEvent.change(screen.getByLabelText('Thema'),{target:{value:'Hoffnung'}});await waitFor(()=>expect(screen.getByRole('button',{name:'Folien erstellen'})).toBeEnabled());fireEvent.click(screen.getByRole('button',{name:'Folien erstellen'}));
  await waitFor(()=>expect(imageApi.generate).toHaveBeenCalledWith('A peaceful meadow'));await waitFor(()=>expect(screen.getByRole('button',{name:'In den Ablauf übernehmen'})).toBeEnabled());expect(imageApi.accept).not.toHaveBeenCalled();expect(usePresentation.getState().items).toHaveLength(before);
  fireEvent.click(screen.getByRole('button',{name:'In den Ablauf übernehmen'}));await waitFor(()=>expect(usePresentation.getState().items).toHaveLength(before+1));expect(usePresentation.getState().items.find(item=>item.title==='Hoffnung')?.slides[0].elements.some(element=>element.type==='image'&&element.properties.src==='gottesdienst-media://media/owned.png')).toBe(true);
 });
 it('optionally generates one image ON AIR and inserts it without taking the draft live',async()=>{
  const api={status:vi.fn(async()=>({state:'ready' as const,downloadedBytes:10,totalBytes:10,busy:false,progress:0})),generate:vi.fn(async()=>({id:'live-image',preview:'data:image/png;base64,preview'})),accept:vi.fn(async()=>['gottesdienst-media://media/live.png']),discard:vi.fn(async()=>{})};
  window.desktop!.localImages=api;
  usePresentation.setState({onAir:true,liveSlideId:'current'});
  render(<LocalSlideDraftDialog sectionId="service" close={()=>{}}/>);
  fireEvent.change(screen.getByLabelText('Thema'),{target:{value:'Hoffnung'}});
  fireEvent.click(screen.getByRole('checkbox',{name:'Bilder lokal erzeugen'}));
  await waitFor(()=>expect(screen.getByRole('button',{name:'Folien erstellen'})).toBeEnabled());
  fireEvent.click(screen.getByRole('button',{name:'Folien erstellen'}));
  await waitFor(()=>expect(screen.getByRole('button',{name:'In den Ablauf übernehmen'})).toBeEnabled());
  expect(api.generate).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('Hoffnung'));
  fireEvent.click(screen.getByRole('button',{name:'In den Ablauf übernehmen'}));
  await waitFor(()=>expect(usePresentation.getState().items.find(item=>item.title==='Hoffnung')?.slides[0].elements.some(element=>element.properties.src==='gottesdienst-media://media/live.png')).toBe(true));
  expect(usePresentation.getState().liveSlideId).toBe('current');
 });
 it('waits for both model packs when images are requested, without wasting an image download',async()=>{
  let ready=false;window.desktop!.localImages={status:vi.fn(async()=>({state:ready?'ready':'missing',downloadedBytes:0,totalBytes:10,busy:false,progress:0})),generate:vi.fn(),accept:vi.fn(),discard:vi.fn(async()=>{})} as any;
  render(<LocalSlideDraftDialog sectionId="service" close={()=>{}}/>);fireEvent.change(screen.getByLabelText('Thema'),{target:{value:'Hoffnung'}});await waitFor(()=>expect(window.desktop!.localSlides!.status).toHaveBeenCalled());await act(async()=>{await Promise.resolve()});expect(screen.getByRole('button',{name:'Folien erstellen'})).toBeDisabled();ready=true;await waitFor(()=>expect(screen.getByRole('button',{name:'Folien erstellen'})).toBeEnabled(),{timeout:2500});
 });
 it('does not insert a draft if its dialog closes while image acceptance is pending',async()=>{
  let finish!:(urls:string[])=>void;window.desktop!.localSlides!.generate=vi.fn(async():Promise<SlideDraft[]>=>[{title:'Hoffnung',body:'Gemeinsam hoffen.',design:{layout:'photo',accent:'#699f3e',imagePrompt:'A meadow'}}]);window.desktop!.localImages={status:vi.fn(async()=>({state:'ready',downloadedBytes:10,totalBytes:10,busy:false,progress:0})),generate:vi.fn(async()=>({id:'owned-id',preview:'data:image/png;base64,owned'})),accept:vi.fn(()=>new Promise<string[]>(resolve=>{finish=resolve})),discard:vi.fn(async()=>{})} as any;
  const before=usePresentation.getState().items.length,view=render(<LocalSlideDraftDialog sectionId="service" close={()=>{}}/>);fireEvent.change(screen.getByLabelText('Thema'),{target:{value:'Hoffnung'}});await waitFor(()=>expect(screen.getByRole('button',{name:'Folien erstellen'})).toBeEnabled());fireEvent.click(screen.getByRole('button',{name:'Folien erstellen'}));await waitFor(()=>expect(screen.getByRole('button',{name:'In den Ablauf übernehmen'})).toBeEnabled());fireEvent.click(screen.getByRole('button',{name:'In den Ablauf übernehmen'}));await waitFor(()=>expect(finish).toBeTypeOf('function'));view.unmount();await act(async()=>{finish(['gottesdienst-media://media/owned.png']);await Promise.resolve()});expect(usePresentation.getState().items).toHaveLength(before);
 });
 it('keeps a text result when ON AIR starts while inference is pending',async()=>{
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
  expect(await screen.findByRole('button',{name:'In den Ablauf übernehmen'})).toBeEnabled();
  expect(usePresentation.getState().items).toHaveLength(before);
 });
});
