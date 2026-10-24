import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {AnnouncementSettings} from './AnnouncementSettings';
import type {AnnouncementSettings as Settings} from './settings';
import {usePreferences} from '../preferences';
const initial:Settings={enabled:false,intervalMinutes:5,musicRemainingPercent:20,voiceId:'de_DE-mls-medium',speakerId:null,voiceAccepted:false};
const savedPreferences=usePreferences.getState();
beforeEach(()=>usePreferences.setState({language:'de',germanRegion:null}));
afterEach(()=>{cleanup();usePreferences.setState(savedPreferences,true)});

describe('inactive announcement preparation settings',()=>{
 it('can disable saved announcements even when their engine has become unavailable',async()=>{
  let stored:Settings={...initial,enabled:true,voiceId:'espeak-ng:de',speakerId:0,voiceAccepted:true};
  render(<AnnouncementSettings rows={[]} bridge={{readSettings:async()=>stored,writeSettings:async value=>{stored=value;return value},engineStatus:async()=>({ready:false,name:'Nicht verfügbar'})}}/>);
  await waitFor(()=>expect(screen.getByRole('checkbox',{name:'Automatische Ansagen aktivieren'})).toBeEnabled());
  fireEvent.click(screen.getByRole('checkbox',{name:'Automatische Ansagen aktivieren'}));fireEvent.click(screen.getByRole('button',{name:'Ansageneinstellungen speichern'}));
  await screen.findByText('Einstellungen gespeichert.');expect(stored.enabled).toBe(false);
 });
 it('enables the included voice explicitly without an engine picker or separate download',async()=>{
  let stored=initial;
  render(<AnnouncementSettings rows={[]} bridge={{readSettings:async()=>initial,writeSettings:async value=>{stored=value;return value},engineStatus:async()=>({ready:true,name:'eSpeak NG'}),chooseEngine:async()=>({ready:true,name:'eSpeak NG'})}}/>);
  await waitFor(()=>expect(screen.getByRole('checkbox',{name:'Automatische Ansagen aktivieren'})).toBeEnabled());
  expect(screen.getByRole('checkbox',{name:'Automatische Ansagen aktivieren'})).not.toBeChecked();
  expect(screen.queryByRole('button',{name:'eSpeak NG auswählen'})).toBeNull();
  expect(screen.queryByRole('button',{name:'eSpeak-NG-Downloadseite'})).toBeNull();
  fireEvent.click(screen.getByRole('checkbox',{name:'Automatische Ansagen aktivieren'}));
  fireEvent.click(screen.getByRole('button',{name:'Ansageneinstellungen speichern'}));
  await screen.findByText('Einstellungen gespeichert.');
  expect(stored).toEqual({...initial,enabled:true,voiceId:'marytts:dfki-pavoque-neutral',speakerId:0,voiceAccepted:true});
 });
 it('loads and saves numeric values without choosing a voice or enabling speech',async()=>{
  let saved=initial;
  const bridge={readSettings:async()=>initial,writeSettings:async(value:Settings)=>{saved=value;return value}};
  render(<AnnouncementSettings bridge={bridge} rows={[]}/>);
  const interval=await screen.findByLabelText('Intervall (Minuten)');
  await waitFor(()=>expect(interval).toBeEnabled());
  fireEvent.change(interval,{target:{value:'8'}});
  fireEvent.change(screen.getByLabelText('Musikpegel während der Ansage (%)'),{target:{value:'15'}});
  fireEvent.click(screen.getByRole('button',{name:'Ansageneinstellungen speichern'}));
  await screen.findByText('Einstellungen gespeichert.');
  expect(saved).toEqual({...initial,intervalMinutes:8,musicRemainingPercent:15});
  expect(screen.getByRole('checkbox',{name:'Automatische Ansagen aktivieren'})).toBeDisabled();
  expect(screen.getByRole('checkbox',{name:'Automatische Ansagen aktivieren'})).not.toBeChecked();
 });
 it('displays only public plain speech texts without executing markup',async()=>{
  const bridge={readSettings:async()=>initial,writeSettings:async(value:Settings)=>value};
  const rows=[{id:'one',title:'Gemeindehinweis',text:'Bitte nehmen Sie im Saal Platz. <script>alarm()</script>',revision:'1',priority:'normal' as const}];
  const view=render(<AnnouncementSettings bridge={bridge} rows={rows}/>);
  await screen.findByText('Gemeindehinweis');
  expect(screen.getByText(rows[0].text)).toBeInTheDocument();
  expect(view.container.querySelector('script')).toBeNull();
  expect(screen.getByText(/Durchsagen laufen nur im Vor- und Nachprogramm/)).toBeInTheDocument();
 });
 it('rejects an invalid interval without writing',async()=>{
  const writeSettings=vi.fn(async(value:Settings)=>value);
  render(<AnnouncementSettings bridge={{readSettings:async()=>initial,writeSettings}} rows={[]}/>);
  await waitFor(()=>expect(screen.getByLabelText('Intervall (Minuten)')).toBeEnabled());
  fireEvent.change(screen.getByLabelText('Intervall (Minuten)'),{target:{value:'0'}});
  fireEvent.click(screen.getByRole('button',{name:'Ansageneinstellungen speichern'}));
  await screen.findByRole('alert');expect(writeSettings).not.toHaveBeenCalled();
 });
 it('does not claim a save when native persistence fails',async()=>{
  render(<AnnouncementSettings bridge={{readSettings:async()=>initial,writeSettings:async()=>{throw Error('disk')}}} rows={[]}/>);
  await waitFor(()=>expect(screen.getByLabelText('Intervall (Minuten)')).toBeEnabled());
  fireEvent.click(screen.getByRole('button',{name:'Ansageneinstellungen speichern'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('konnten nicht gespeichert');
  expect(screen.queryByText('Einstellungen gespeichert.')).toBeNull();
 });
 it('is silent and unavailable without the desktop bridge',async()=>{
  render(<AnnouncementSettings rows={[]}/>);
  expect(screen.getByRole('button',{name:'Ansageneinstellungen speichern'})).toBeDisabled();
  expect(screen.getByText(/Desktop-Version/)).toBeInTheDocument();
 });
 it('distinguishes unloaded community data from no eligible texts',()=>{
  render(<AnnouncementSettings/>);
  expect(screen.getByText('Gemeindemeldungen sind noch nicht geladen.')).toBeInTheDocument();
  expect(screen.queryByText('Keine gültigen Saal-Durchsagen vorhanden.')).toBeNull();
 });
 it('uses central realtime data and removes revoked messages without a second Firebase start',async()=>{
  const original=window.desktop;
  const listeners:Record<string,(value:any)=>void>={};
  const start=vi.fn(async()=>true);
  window.desktop={community:{start,onEvents:(callback:any)=>{listeners.events=callback},onRooms:(callback:any)=>{listeners.rooms=callback},onAnnouncements:(callback:any)=>{listeners.messages=callback},onConnection:(callback:any)=>{listeners.connection=callback}}} as any;
  try {
   const {startCommunityRuntime}=await import('../community/communityRuntime');
   startCommunityRuntime();
   const view=render(<AnnouncementSettings bridge={{readSettings:async()=>initial,writeSettings:async value=>value}}/>);
   const now=Date.now();
   act(()=>listeners.messages([{messageId:'one',titel:'Hinweis',status:'public',showDurchsage:true,durchsageSaalscreen:true,giltBis:new Date(now+60_000).toISOString(),textDurchsageSaalscreen:'Bitte kommen Sie in den Saal.',internalComment:'VERTRAULICH'},
    {messageId:'two',titel:'Nicht freigegeben',status:'internal',showDurchsage:true,durchsageSaalscreen:true,textDurchsageSaalscreen:'INTERN'}]));
   expect(await screen.findByText('Bitte kommen Sie in den Saal.')).toBeInTheDocument();
   expect(view.container.textContent).not.toContain('VERTRAULICH');
   expect(view.container.textContent).not.toContain('Nicht freigegeben');
   vi.useFakeTimers();vi.setSystemTime(now+120_000);
   fireEvent.click(screen.getByRole('button',{name:'Texte aktualisieren'}));
   expect(screen.queryByText('Bitte kommen Sie in den Saal.')).toBeNull();
   vi.useRealTimers();
   act(()=>listeners.messages([]));
   expect(screen.queryByText('Bitte kommen Sie in den Saal.')).toBeNull();
   expect(start).toHaveBeenCalledTimes(1);
  } finally {vi.useRealTimers();window.desktop=original;}
 });
});
