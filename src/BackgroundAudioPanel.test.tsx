import {useState} from 'react';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {BackgroundAudioPanel,defaultBackgroundAudio} from './BackgroundAudioPanel';
import {searchRadioStations} from './radioStations';
import {createServiceItem,usePresentation,type BackgroundAudioConfig} from './store';
import {usePreferences} from './preferences';
vi.mock('./radioStations',()=>({searchRadioStations:vi.fn()}));
const prefs=usePreferences.getState(),saved=usePresentation.getState();
const file={assetId:'file:one',name:'Lied',url:'file:///one.mp3'},old={assetId:'radio:old',name:'Alt',url:'https://example.test/old'};
const station={id:'new',name:'Neuer Sender',streamUrl:'https://example.test/new',country:'Deutschland',language:'Deutsch',tags:[],codec:'MP3',bitrate:128,artworkUrl:'',homepage:''};
let writes:BackgroundAudioConfig[]=[];let closes=0;
beforeEach(()=>{
 writes=[];closes=0;usePreferences.setState({language:'de',germanRegion:null});vi.mocked(searchRadioStations).mockResolvedValue([station]);
 vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});vi.spyOn(HTMLMediaElement.prototype,'load').mockImplementation(()=>{});vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();
 usePresentation.setState({sections:[{id:'pre',title:'PRE',order:0,backgroundAudio:defaultBackgroundAudio([file,old])},{id:'post',title:'POST',order:1,backgroundAudio:defaultBackgroundAudio([{...old,assetId:'radio:post'}])}],items:[{...createServiceItem('content',{id:'item',sectionId:'pre'}),backgroundAudio:defaultBackgroundAudio([file,old])}]});
});
afterEach(()=>{cleanup();delete window.desktop;vi.restoreAllMocks();usePreferences.setState(prefs,true);usePresentation.setState(saved,true)});
function Fixture({type='section',id='pre',initialRadio=true}:{type?:'section'|'serviceItem';id?:string;initialRadio?:boolean}){
 const state=usePresentation(),[closed,setClosed]=useState(false),value=type==='section'?state.sections.find(s=>s.id===id)?.backgroundAudio:state.items.find(i=>i.id===id)?.backgroundAudio;
 return closed?<p>Geschlossen</p>:<BackgroundAudioPanel title={id} targetType={type} targetId={id} initialRadio={initialRadio} value={value} onChange={next=>{if(next)writes.push(next);type==='section'?state.updateSectionAudio(id,next):state.updateItemAudio(id,next)}} onClose={()=>{closes++;setClosed(true)}}/>;
}
async function search(){fireEvent.click(screen.getByRole('button',{name:'Suchen'}));return screen.findByRole('button',{name:'Hinzufügen'})}
it.each([['section','pre'],['section','post'],['serviceItem','item']] as const)('updates only %s %s and closes the pure radio dialog immediately',async(type,id)=>{
 render(<Fixture type={type} id={id}/>);const untouchedPost=usePresentation.getState().sections.find(s=>s.id==='post')!.backgroundAudio,untouchedItem=usePresentation.getState().items.find(i=>i.id==='item')!.backgroundAudio;
 const add=await search();fireEvent.click(add);
 expect(writes).toHaveLength(1);expect(writes[0].tracks.filter(t=>t.assetId.startsWith('radio:'))).toEqual([expect.objectContaining({assetId:'radio:new',name:'Neuer Sender'})]);
 if(id!=='post'){expect(writes[0].tracks[0]).toEqual(file);expect(usePresentation.getState().sections.find(s=>s.id==='post')!.backgroundAudio).toBe(untouchedPost)}
 if(type==='section')expect(usePresentation.getState().items.find(i=>i.id==='item')!.backgroundAudio).toBe(untouchedItem);
 expect(screen.queryByRole('dialog',{name:'Radiosender'})).toBeNull();expect(screen.getByText('Geschlossen')).toBeVisible();expect(closes).toBe(1);
});
it('ignores a second fast add even before its owner unmounts',async()=>{
 render(<BackgroundAudioPanel title="PRE" targetType="section" targetId="pre" initialRadio value={defaultBackgroundAudio([file,old])} onChange={next=>{if(next)writes.push(next)}} onClose={()=>{closes++}}/>);
 const add=await search();fireEvent.click(add);fireEvent.click(add);expect(writes).toHaveLength(1);expect(closes).toBe(1);
});
it('removes only the pure radio dialog Done button while keeping its close control',()=>{
 render(<Fixture/>);expect(screen.queryByRole('button',{name:'FERTIG'})).toBeNull();expect(screen.getByRole('button',{name:'Schließen'})).toBeVisible();
});
it('collapses an embedded station search but keeps settings and permits a later replacement',async()=>{
 render(<Fixture initialRadio={false}/>);fireEvent.click(screen.getByRole('button',{name:'RADIO'}));fireEvent.click(await search());
 expect(screen.queryByPlaceholderText('Sender, Ort oder Musikrichtung')).toBeNull();expect(screen.getByRole('dialog',{name:'Background Audio'})).toBeVisible();expect(screen.getByRole('button',{name:'FERTIG'})).toBeVisible();expect(closes).toBe(0);
 vi.mocked(searchRadioStations).mockResolvedValue([{...station,id:'later',name:'Später'}]);fireEvent.click(screen.getByRole('button',{name:'RADIO'}));fireEvent.click(await search());
 expect(writes).toHaveLength(2);expect(writes[1].tracks.map(t=>t.assetId)).toEqual(['file:one','radio:later']);
});
it('releases only its own preview media and preview metadata subscription on close',async()=>{
 const stopMetadata=vi.fn(),off=vi.fn();let session='';window.desktop={radio:{startMetadata:async(_id:string,_url:string,id:string)=>{session=id},stopMetadata,onMetadata:()=>off}} as any;
 const view=render(<Fixture/>);await search();const audio=view.container.querySelector('audio')!;
 fireEvent.click(screen.getByRole('button',{name:'Neuer Sender abspielen'}));await waitFor(()=>expect(session).not.toBe(''));expect(audio.getAttribute('src')).toBe('https://example.test/new');
 fireEvent.click(screen.getByRole('button',{name:'Hinzufügen'}));expect(audio.getAttribute('src')).toBeNull();expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();expect(off).toHaveBeenCalledTimes(1);expect(stopMetadata).toHaveBeenCalledWith(session,'preview');
});
