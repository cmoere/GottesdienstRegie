import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {WindowControls} from './WindowControls';
import {usePreferences} from './preferences';
import {loadRegionalInterfacePack} from './regional/resources';
import type {Language} from './preferences';

const initial=usePreferences.getState();
afterEach(()=>{cleanup();vi.unstubAllGlobals();usePreferences.setState(initial,true)});

it('regionalizes actual fullscreen controls without changing their native actions or audio route',async()=>{
  usePreferences.setState({language:'de',germanRegion:'ruhr'});
  await loadRegionalInterfacePack('ruhr');
  const audio=usePreferences.getState().audioRouting,control=vi.fn();
  vi.stubGlobal('desktop',{operator:{fullscreen:async()=>true,onFullscreen:()=>()=>{},control}});
  render(<WindowControls/>);
  fireEvent.click(await screen.findByRole('button',{name:'Fenster klein machen'}));
  fireEvent.click(screen.getByRole('button',{name:'Aussem Vollbild raus'}));
  fireEvent.click(screen.getByRole('button',{name:'Programm zumachen'}));
  expect(control.mock.calls).toEqual([['minimize'],['restore'],['close']]);
  expect(usePreferences.getState().audioRouting).toBe(audio);
});

it('uses the selected non-German base language despite a saved German region',async()=>{
  usePreferences.setState({language:'en',germanRegion:'ruhr'});
  vi.stubGlobal('desktop',{operator:{fullscreen:async()=>true,onFullscreen:()=>()=>{},control:vi.fn()}});
  render(<WindowControls/>);
  expect(await screen.findByRole('button',{name:'Minimize'})).toBeVisible();
  expect(screen.getByRole('button',{name:'Exit fullscreen'})).toBeVisible();
  expect(screen.getByRole('button',{name:'Close application'})).toBeVisible();
});

it.each<[Language,string,string,string]>([
  ['de','Minimieren','Vollbild verlassen','Programm schließen'],
  ['fr','Réduire','Quitter le plein écran','Fermer l’application'],
  ['ar','تصغير','الخروج من ملء الشاشة','إغلاق التطبيق'],
  ['uk','Згорнути','Вийти з повноекранного режиму','Закрити програму'],
])('shows real control names in %s without replacing native command IDs',async(language,minimize,restore,close)=>{
  usePreferences.setState({language,germanRegion:null});
  const control=vi.fn();
  vi.stubGlobal('desktop',{operator:{fullscreen:async()=>true,onFullscreen:()=>()=>{},control}});
  render(<WindowControls/>);
  fireEvent.click(await screen.findByRole('button',{name:minimize}));
  fireEvent.click(screen.getByRole('button',{name:restore}));
  fireEvent.click(screen.getByRole('button',{name:close}));
  expect(control.mock.calls).toEqual([['minimize'],['restore'],['close']]);
});
