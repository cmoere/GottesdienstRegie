import {act,cleanup,render,fireEvent,screen} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {AutomaticAnnouncements} from './AutomaticAnnouncements';
import {createServiceItem,usePresentation} from '../store';
import {usePreferences} from '../preferences';
import {startCommunityRuntime} from '../community/communityRuntime';
import {useSpeechStatus} from './AnnouncementIndicator';
import {AnnouncementSettings} from './AnnouncementSettings';
const boundary=vi.hoisted(()=>({events:[] as string[],hold:false,signal:null as AbortSignal|null}));
vi.mock('../BackgroundAudioEngine',()=>({backgroundAudioEngine:{setAnnouncementDucking:async(value:number|null)=>{boundary.events.push(`duck:${value}`)}}}));
vi.mock('./AnnouncementPlayer',()=>({playAnnouncementAudio:async(url:string,signal:AbortSignal,playing:()=>void)=>{boundary.events.push(url.includes('gong')?'gong':'speech');playing();if(boundary.hold){boundary.signal=signal;await new Promise<void>((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('abort')),{once:true}))}}}));
const saved=usePresentation.getState(),prefs=usePreferences.getState(),desktop=window.desktop;
let messages:(records:any[])=>void,started=false;
const settings={enabled:true,intervalMinutes:1,musicRemainingPercent:20,voiceId:'marytts:dfki-pavoque-neutral',speakerId:0,voiceAccepted:true};
beforeEach(()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-24T10:00:00Z'));boundary.events=[];boundary.hold=false;boundary.signal=null;
 window.desktop={community:{start:async()=>true,onEvents:()=>{},onRooms:()=>{},onConnection:()=>{},onAnnouncements:(callback:any)=>{messages=callback}},announcements:{readSettings:async()=>settings,writeSettings:async(value:import('./settings').AnnouncementSettings)=>value,synthesize:async()=>new Uint8Array([1]),cancel:async()=>{},setIndicator:async()=>{}}} as any;
 if(!started){startCommunityRuntime();started=true}
 messages([{messageId:'one',titel:'Hinweis',textDurchsageSaalscreen:'Bitte kommen.',status:'public',showDurchsage:true,durchsageSaalscreen:true}]);
 URL.createObjectURL=()=> 'blob:speech';URL.revokeObjectURL=()=>{};
 const item=createServiceItem('content',{sectionId:'pre'});usePresentation.setState({items:[item],onAir:true,liveItemId:item.id});useSpeechStatus.setState({active:false,message:''});
});
afterEach(async()=>{cleanup();await act(async()=>{});vi.useRealTimers();usePresentation.setState(saved,true);usePreferences.setState(prefs,true);window.desktop=desktop;useSpeechStatus.setState({active:false,message:''})});
describe('single control shell announcement owner',()=>{
 it('stops current audio when the operator disables and saves announcements',async()=>{
  usePreferences.setState({language:'de',germanRegion:null});boundary.hold=true;
  window.desktop!.announcements!.engineStatus=async()=>({ready:true,name:'eSpeak NG'});
  let selected={...settings};
  window.desktop!.announcements!.readSettings=async()=>selected;
  window.desktop!.announcements!.writeSettings=async value=>{selected=value as typeof settings;return value};
  render(<><AutomaticAnnouncements quick={null}/><AnnouncementSettings rows={[]}/></>);await act(async()=>{});
  await act(async()=>{await vi.advanceTimersByTimeAsync(60000)});expect(useSpeechStatus.getState().active).toBe(true);
  fireEvent.click(screen.getByRole('checkbox',{name:'Automatische Ansagen aktivieren'}));
  fireEvent.click(screen.getByRole('button',{name:'Ansageneinstellungen speichern'}));await act(async()=>{});
  expect(boundary.signal?.aborted).toBe(true);expect(useSpeechStatus.getState().active).toBe(false);
 });
 it('resets its session even when ON AIR is restarted before cancelled playback has finished cleaning up',async()=>{
  const spoken:string[]=[];window.desktop!.announcements!.synthesize=async text=>{spoken.push(text);return new Uint8Array([1])};
  messages([{messageId:'one',titel:'Hinweis',textDurchsageSaalscreen:'Erste.',status:'public',showDurchsage:true,durchsageSaalscreen:true},{messageId:'two',titel:'Hinweis',textDurchsageSaalscreen:'Zweite.',status:'public',showDurchsage:true,durchsageSaalscreen:true}]);
  boundary.hold=true;render(<AutomaticAnnouncements quick={null}/>);await act(async()=>{});await act(async()=>{await vi.advanceTimersByTimeAsync(60000)});
  act(()=>{usePresentation.setState({onAir:false});usePresentation.setState({onAir:true})});await act(async()=>{});
  await act(async()=>{await vi.advanceTimersByTimeAsync(60000)});expect(spoken).toEqual(['Erste.','Erste.']);
 });
 it('runs gong and speech only after the configured interval and restores music',async()=>{render(<AutomaticAnnouncements quick={null}/>);await act(async()=>{});await act(async()=>{await vi.advanceTimersByTimeAsync(59000)});expect(boundary.events).toEqual([]);await act(async()=>{await vi.advanceTimersByTimeAsync(1000)});expect(boundary.events).toEqual(['duck:20','gong','speech','duck:null']);expect(useSpeechStatus.getState().active).toBe(false)});
 it('cancels on OFF AIR and revocation while keeping the source out of the next run',async()=>{boundary.hold=true;render(<AutomaticAnnouncements quick={null}/>);await act(async()=>{});await act(async()=>{await vi.advanceTimersByTimeAsync(60000)});expect(useSpeechStatus.getState().active).toBe(true);act(()=>usePresentation.setState({onAir:false}));await act(async()=>{});expect(boundary.signal?.aborted).toBe(true);expect(useSpeechStatus.getState().active).toBe(false);expect(boundary.events).toEqual(['duck:20','gong','duck:null'])});
 it('does not schedule in the service section or OFF AIR',async()=>{usePresentation.setState({items:[{...usePresentation.getState().items[0],sectionId:'service'}]});render(<AutomaticAnnouncements quick={null}/>);await act(async()=>{});await act(async()=>{await vi.advanceTimersByTimeAsync(180000)});expect(boundary.events).toEqual([])});
 it('removes the speaker immediately when an emergency quick screen interrupts playback',async()=>{boundary.hold=true;const view=render(<AutomaticAnnouncements quick={null}/>);await act(async()=>{});await act(async()=>{await vi.advanceTimersByTimeAsync(60000)});view.rerender(<AutomaticAnnouncements quick={{id:'black',type:'black',name:'Schwarz',enabled:true,targets:['main'],order:0}}/>);await act(async()=>{});expect(boundary.signal?.aborted).toBe(true);expect(useSpeechStatus.getState().active).toBe(false)});
});
