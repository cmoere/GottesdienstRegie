import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,beforeEach,expect,it} from 'vitest';
import {usePreferences} from './preferences';
const savedPreferences=usePreferences.getState();
beforeEach(()=>usePreferences.setState({language:'de',germanRegion:null}));
import {CountdownPresetBrowser} from './CountdownPresetBrowser';
import {insertCountdownPreset} from './countdownInsertion';
import {usePresentation} from './store';
afterEach(()=>{cleanup();usePreferences.setState(savedPreferences,true)});
it('selects offline presets without representing them as media files',()=>{
  const selected:string[]=[];render(<CountdownPresetBrowser purpose="background" onSelect={id=>selected.push(id)}/>);
  expect(screen.getAllByRole('button',{name:/Vorschau:/})).toHaveLength(60);
  fireEvent.click(screen.getByRole('button',{name:'Vorschau: 20:00 · Kreuz'}));
  fireEvent.click(screen.getByRole('button',{name:'Als Countdown zum Ablauf hinzufügen'}));
  expect(selected).toEqual(['countdown:1200:cross']);
});
it('filters by duration and design and hides presets in audio selection',()=>{
  const view=render(<CountdownPresetBrowser purpose="item" onSelect={()=>{}}/>);
  fireEvent.change(screen.getByLabelText('Dauer'),{target:{value:'10'}});
  fireEvent.change(screen.getByLabelText(/^Design$/i),{target:{value:'clear'}});
  expect(screen.getAllByRole('button',{name:/Vorschau:/})).toHaveLength(1);
  view.rerender(<CountdownPresetBrowser purpose="audio" onSelect={()=>{}}/>);expect(screen.queryByRole('button',{name:/Vorschau:/})).toBeNull();
});
it('inserts one native countdown without modifying the mandatory postprogram item',()=>{
  usePresentation.getState().newDocument('Probe');const initial=usePresentation.getState().items.find(i=>i.sectionId==='post')!;
  expect(insertCountdownPreset('countdown:60:candle','post')).toBe(true);
  const state=usePresentation.getState(),item=state.items.find(i=>i.type==='countdown')!;
  expect(item.sectionId).toBe('post');expect(item.autoAdvance).toBe(false);expect(item.slides[0].elements[0].properties.countdownPresetId).toBe('countdown:60:candle');
  expect(state.items.find(i=>i.id===initial.id)).toEqual(initial);
  expect(insertCountdownPreset('bad','post')).toBe(false);expect(usePresentation.getState().items.filter(i=>i.type==='countdown')).toHaveLength(1);
});
