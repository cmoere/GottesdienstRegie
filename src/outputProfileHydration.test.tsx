import {afterEach,expect,it} from 'vitest';
import {renderHook,waitFor,cleanup} from '@testing-library/react';
import {useOutputDisplayProfile} from './useOutputDisplayProfile';
import {usePresentation} from './store';
it('reconciles hot-plug IDs after stopping without changing a live assignment',async()=>{
 usePresentation.setState({displayRoles:{'12':'main'},onAir:true});
 window.desktop={outputDisplays:{read:async()=>({profile:{version:1,assignments:[]},assignments:{'42':'main'},unresolved:[]}),write:async()=>{throw Error('No manual edit')}}} as unknown as typeof window.desktop;
 renderHook(()=>useOutputDisplayProfile());await new Promise(resolve=>setTimeout(resolve,0));
 expect(usePresentation.getState().displayRoles).toEqual({'12':'main'});
 usePresentation.setState({onAir:false});
 await waitFor(()=>expect(usePresentation.getState().displayRoles).toEqual({'42':'main'}));
});
afterEach(()=>{cleanup();delete window.desktop});
it('restores machine assignments without changing the presentation or starting output',async()=>{
 usePresentation.setState({displayRoles:{},mainDisplayId:undefined,title:'Bestehender Gottesdienst',onAir:false});
 const writes:unknown[]=[];
 window.desktop={outputDisplays:{read:async()=>({profile:{version:1,assignments:[{role:'main',lastDisplayId:12,identity:{label:'MAIN',pixelWidth:1080,pixelHeight:1920}}]},assignments:{'42':'main'},unresolved:[]}),write:async(value:unknown)=>{writes.push(value);throw Error('Restoration must not overwrite the profile')}}} as unknown as typeof window.desktop;
 renderHook(()=>useOutputDisplayProfile());
 await waitFor(()=>expect(usePresentation.getState().mainDisplayId).toBe(42));
 expect(usePresentation.getState().title).toBe('Bestehender Gottesdienst');expect(usePresentation.getState().onAir).toBe(false);
 expect(writes).toEqual([]);
});
it('persists a manual assignment even when the operator closes immediately',async()=>{
 usePresentation.setState({displayRoles:{},onAir:false});
 const writes:unknown[]=[];
 window.desktop={outputDisplays:{read:async()=>({profile:null,assignments:{},unresolved:[]}),write:async(value:unknown)=>{writes.push(value);return {profile:null,assignments:{},unresolved:[]}}}} as unknown as typeof window.desktop;
 const view=renderHook(()=>useOutputDisplayProfile());
 await new Promise(resolve=>setTimeout(resolve,0));
 usePresentation.setState({displayRoles:{'42':'main'}});view.unmount();
 expect(writes).toEqual([{'42':'main'}]);
});
