import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {RadioStationBrowser} from './RadioStationBrowser';
import {searchRadioStations,type RadioStation} from './radioStations';
import {usePreferences} from './preferences';
vi.mock('./radioStations',()=>({searchRadioStations:vi.fn()}));
const preferences=usePreferences.getState();
beforeEach(()=>{usePreferences.setState({language:'en',germanRegion:null});vi.mocked(searchRadioStations).mockReset()});
afterEach(()=>{cleanup();usePreferences.setState(preferences,true)});

it('updates pending and empty-search feedback when the operator language changes',async()=>{
 let resolve!:(value:RadioStation[])=>void;
 vi.mocked(searchRadioStations).mockReturnValue(new Promise(done=>{resolve=done}));
 render(<RadioStationBrowser add={()=>{}}/>);
 fireEvent.change(screen.getByPlaceholderText('Station, location or genre'),{target:{value:'Jazz'}});
 fireEvent.click(screen.getByRole('button',{name:'Search'}));
 expect(screen.getByRole('button',{name:'Searching …'})).toBeDisabled();
 act(()=>usePreferences.setState({language:'de'}));
 expect(screen.getByRole('button',{name:'Suchen …'})).toBeDisabled();
 await act(async()=>resolve([]));
 expect(screen.getByRole('alert')).toHaveTextContent('Keine passenden, erreichbaren HTTPS-Radiosender gefunden.');
 act(()=>usePreferences.setState({language:'en'}));
 expect(screen.getByRole('alert')).toHaveTextContent('No matching, reachable HTTPS radio stations found.');
 expect(searchRadioStations).toHaveBeenCalledWith('Jazz');
});

it('preserves supplied error details while translating only the operator template',async()=>{
 const detail='https://example.invalid/{station}?id=-Radio_ID';
 vi.mocked(searchRadioStations).mockRejectedValue(new Error(detail));
 render(<RadioStationBrowser add={()=>{}}/>);
 fireEvent.click(screen.getByRole('button',{name:'Search'}));
 expect(await screen.findByRole('alert')).toHaveTextContent(`Radio search failed: ${detail}. Please try again.`);
 act(()=>usePreferences.setState({language:'de'}));
 expect(screen.getByRole('alert')).toHaveTextContent(`Radiosuche fehlgeschlagen: ${detail}. Bitte erneut versuchen.`);
});

it('localizes result controls without translating station names, stream URLs or saved metadata',async()=>{
 const stations=Array.from({length:12},(_,index)=>({id:String(index),name:`Köln ÄÖÜ ${index}`,streamUrl:`https://example.test/stream/${index}`,country:'Deutschland',language:'Deutsch',tags:['Jazz'],codec:'MP3',bitrate:128,artworkUrl:'',homepage:'https://example.test/'}));
 vi.mocked(searchRadioStations).mockResolvedValue(stations);
 const tracks:unknown[]=[];render(<RadioStationBrowser add={track=>tracks.push(track)}/>);
 fireEvent.click(screen.getByRole('button',{name:'Search'}));
 await waitFor(()=>expect(screen.getAllByRole('article')).toHaveLength(10));
 expect(screen.getByRole('button',{name:'Play Köln ÄÖÜ 0'})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Load more'}));
 expect(screen.getAllByRole('article')).toHaveLength(12);
 fireEvent.click(screen.getByRole('button',{name:'Show less'}));
 expect(screen.getAllByRole('article')).toHaveLength(10);
 fireEvent.click(screen.getAllByRole('button',{name:'Add'})[0]);
 expect(tracks).toEqual([{assetId:'radio:0',name:'Köln ÄÖÜ 0',url:'https://example.test/stream/0',artist:'Online-Radio',album:'Köln ÄÖÜ 0',imageUrl:'',format:'MP3',status:'ready'}]);
 expect(screen.getAllByText('Deutschland · Deutsch · MP3 · 128 kbit/s')).toHaveLength(10);
});
