import {afterEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MediaBrowser} from './MediaBrowser';
import {usePreferences} from './preferences';
afterEach(()=>{cleanup();delete window.desktop;vi.unstubAllGlobals()});
it('explains missing cloud permissions and retains selected source for retry',async()=>{
 usePreferences.setState({language:'de',germanRegion:null});
 const asset={id:'local',name:'Testbild',fileName:'test.png',kind:'image',extension:'PNG',tags:[],url:'local:test',syncState:'local-only'},api={onlineStatus:vi.fn().mockResolvedValue({online:true,writable:false}),cloudList:vi.fn().mockResolvedValue([]),import:vi.fn().mockResolvedValue([asset]),update:vi.fn().mockResolvedValue(asset),sync:vi.fn().mockRejectedValue(new Error('UPLOAD_PERMISSION_REQUIRED'))};
 Object.defineProperty(window,'desktop',{configurable:true,value:{media:api}});const alert=vi.fn();vi.stubGlobal('alert',alert);
 render(<MediaBrowser/>);await waitFor(()=>expect(api.cloudList).toHaveBeenCalled());fireEvent.click(screen.getByRole('button',{name:'MEDIEN HOCHLADEN'}));await screen.findByRole('button',{name:'JETZT HOCHLADEN'});fireEvent.click(screen.getByRole('button',{name:'JETZT HOCHLADEN'}));
 await waitFor(()=>expect(alert).toHaveBeenCalledWith('Die Anmeldung für die Medien-Cloud fehlt oder besitzt keine Upload-Berechtigung.'));expect(screen.getByRole('button',{name:'JETZT HOCHLADEN'})).toBeEnabled();expect(screen.getByDisplayValue('Testbild')).toBeTruthy();
});
it('shows a completed library without waiting for an optional permission status',async()=>{
 usePreferences.setState({language:'de',germanRegion:null});const asset={id:'ready',name:'Sofort sichtbar',path:'test.png',kind:'image',size:123,checksum:'test',downloadUrl:'test.png',visibility:'team'};
 Object.defineProperty(window,'desktop',{configurable:true,value:{media:{onlineStatus:()=>new Promise(()=>{}),cloudList:vi.fn().mockResolvedValue([asset])}}});render(<MediaBrowser/>);expect(await screen.findByText('Sofort sichtbar')).toBeTruthy();
});
it('does not overwrite the selected community tab with a late cloud result',async()=>{
 usePreferences.setState({language:'de',germanRegion:null});let resolve!:(value:unknown)=>void;const list=new Promise(done=>{resolve=done});Object.defineProperty(window,'desktop',{configurable:true,value:{media:{onlineStatus:vi.fn().mockResolvedValue({online:true}),cloudList:()=>list}}});render(<MediaBrowser/>);fireEvent.click(screen.getByRole('button',{name:'Community'}));await act(async()=>resolve([{id:'private',name:'Nur Team',path:'test.png',kind:'image',size:123,checksum:'test',downloadUrl:'test.png',visibility:'team'}]));expect(screen.queryByText('Nur Team')).toBeNull();
});
it('clears a cancelled load-more state before reopening Unsplash',async()=>{
 usePreferences.setState({language:'de',germanRegion:null});let loadMoreStarted=false;const photos=Array.from({length:30},(_,i)=>({id:'photo-'+i,name:'Foto '+i,path:'photo.png',kind:'image',size:1,checksum:String(i),downloadUrl:'photo.png'}));
 Object.defineProperty(window,'desktop',{configurable:true,value:{media:{onlineStatus:vi.fn().mockResolvedValue({online:true}),cloudList:vi.fn().mockResolvedValue([]),unsplashSearch:(_query:string,_key:string,page:number)=>page===2?(loadMoreStarted=true,new Promise(()=>{})):Promise.resolve(photos)}}});render(<MediaBrowser/>);fireEvent.click(screen.getByRole('button',{name:'Unsplash'}));fireEvent.click(await screen.findByRole('button',{name:'Mehr laden'}));await waitFor(()=>expect(loadMoreStarted).toBe(true));fireEvent.click(screen.getByRole('button',{name:'Cloud-Medien'}));fireEvent.click(screen.getByRole('button',{name:'Unsplash'}));expect(await screen.findByRole('button',{name:'Mehr laden'})).toBeEnabled();
});
