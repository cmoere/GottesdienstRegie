import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const community=vi.hoisted(()=>({events:[] as Record<string,unknown>[],listeners:new Set<()=>void>()}));
vi.mock('./community/communityRuntime',()=>({startCommunityRuntime(){},getCommunityRuntimeSnapshot:()=>({events:community.events}),subscribeCommunityRuntime:(listener:()=>void)=>{community.listeners.add(listener);return()=>community.listeners.delete(listener)}}));
import {ServiceOnAirReminder} from './ServiceOnAirReminder';
import {usePresentation} from './store';
import {usePreferences} from './preferences';
const saved=usePresentation.getState(),preferences=usePreferences.getState();
const start=new Date('2026-10-25T10:30:00').getTime();
beforeEach(()=>{vi.useFakeTimers();vi.setSystemTime(start-21*60000);community.events=[{eventKey:'linked',titel:'Gottesdienst',start_datum:'2026-10-25',start_uhrzeit:'10:30'}];usePreferences.setState({language:'de',germanRegion:null});usePresentation.setState({onAir:false,eventLink:{eventKey:'linked'}})});
afterEach(()=>{cleanup();vi.useRealTimers();community.listeners.clear();usePresentation.setState(saved,true);usePreferences.setState(preferences,true)});
it('shows the reminder at20minutes, not earlier, and does not repeat after acknowledgement',()=>{
 render(<ServiceOnAirReminder/>);
 expect(screen.queryByRole('status')).toBeNull();
 act(()=>vi.advanceTimersByTime(60000));
 expect(screen.getByRole('status')).toHaveTextContent('20 Minuten');
 fireEvent.click(screen.getByRole('button',{name:'BESTÄTIGEN'}));
 act(()=>vi.advanceTimersByTime(120000));
 expect(screen.queryByRole('status')).toBeNull();
});
it('never displays a reminder when already ON AIR and hides an existing reminder immediately',()=>{
 vi.setSystemTime(start-19*60000);usePresentation.setState({onAir:true});
 render(<ServiceOnAirReminder/>);
 act(()=>vi.advanceTimersByTime(1000));expect(screen.queryByRole('status')).toBeNull();
 act(()=>usePresentation.setState({onAir:false}));expect(screen.getByRole('status')).toBeInTheDocument();
 act(()=>usePresentation.setState({onAir:true}));expect(screen.queryByRole('status')).toBeNull();
 act(()=>usePresentation.setState({onAir:false}));expect(screen.queryByRole('status')).toBeNull();
});
it('uses effective start from the linked event and ignores cancelled or unresolved events',()=>{
 vi.setSystemTime(start-19*60000);
 community.events=[{...community.events[0],start_uhrzeit:'09:00',Verspaetungsanfangsuhrzeit:'10:30'}];
 render(<ServiceOnAirReminder/>);expect(screen.getByRole('status')).toHaveTextContent('19 Minuten');
 act(()=>{community.events=[{...community.events[0],cancelled:true}];community.listeners.forEach(listener=>listener())});
 expect(screen.queryByRole('status')).toBeNull();
 act(()=>usePresentation.setState({eventLink:{eventKey:'missing'}}));expect(screen.queryByRole('status')).toBeNull();
});
it('does not remind after the event has started or without a linked event',()=>{
 vi.setSystemTime(start);render(<ServiceOnAirReminder/>);expect(screen.queryByRole('status')).toBeNull();
 act(()=>{vi.setSystemTime(start-15*60000);usePresentation.setState({eventLink:undefined});vi.advanceTimersByTime(1000)});
 expect(screen.queryByRole('status')).toBeNull();
});
it('recalculates the window after a live delay and reminds only once for the new effective start',()=>{
 vi.setSystemTime(start-19*60000);render(<ServiceOnAirReminder/>);
 expect(screen.getByRole('status')).toHaveTextContent('19 Minuten');
 fireEvent.click(screen.getByRole('button',{name:'BESTÄTIGEN'}));
 act(()=>{community.events=[{...community.events[0],Verspaetungsanfangsuhrzeit:'10:40'}];community.listeners.forEach(listener=>listener())});
 expect(screen.queryByRole('status')).toBeNull();
 act(()=>vi.advanceTimersByTime(9*60000));
 expect(screen.getByRole('status')).toHaveTextContent('20 Minuten');
 fireEvent.click(screen.getByRole('button',{name:'BESTÄTIGEN'}));
 act(()=>{community.events=[{...community.events[0],titel:'Neuer Titel'}];community.listeners.forEach(listener=>listener());vi.advanceTimersByTime(60000)});
 expect(screen.queryByRole('status')).toBeNull();
});
it('ignores other upcoming events and trashed linked records',()=>{
 vi.setSystemTime(start-19*60000);
 community.events=[{...community.events[0],trash:true},{...community.events[0],eventKey:'another'}];
 render(<ServiceOnAirReminder/>);expect(screen.queryByRole('status')).toBeNull();
});
