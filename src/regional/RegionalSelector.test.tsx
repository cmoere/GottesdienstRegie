import {fireEvent,render,screen,cleanup} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {RegionalSelector} from './RegionalSelector';
import {regionalVariants} from '../../shared/regional/catalog';
import {usePreferences} from '../preferences';
import {usePresentation} from '../store';
import {OutputComposition} from '../OutputComposition';
import {TestModeWatermark} from '../TestModeWatermark';
const initial=usePreferences.getState();
const complete={schemaVersion:1,complete:true,regionIds:["bavarian-upper","bavarian-lower","upper-palatinate","east-franconian","swabian","baden-alemannic","south-baden-alemannic","palatine","rhine-hessian","south-hessian","cologne","ruhr","hamburg","berlin","bielefeld-ravensberg"]};
afterEach(()=>{cleanup();usePreferences.setState(initial,true);localStorage.removeItem('gottesdienstregie.preferences')});
it('hides unready resources and never shows the German variant selector for another base language',()=>{
  usePreferences.setState({language:'de',germanRegion:null});
  const view=render(<RegionalSelector/>);
  expect(screen.queryByRole('combobox')).toBeNull();
  view.rerender(<RegionalSelector availability={{...complete,regionIds:complete.regionIds.slice(1)}}/>);
  expect(screen.queryByRole('combobox')).toBeNull();
  usePreferences.setState({language:'en',germanRegion:'ruhr'});
  view.rerender(<RegionalSelector availability={complete}/>);
  expect(screen.queryByRole('combobox')).toBeNull();
  expect(usePreferences.getState().germanRegion).toBe('ruhr');
});
it('offers only the approved15 variants plus Hochdeutsch and preserves live/audio/output fixtures',()=>{
  usePreferences.setState({language:'de',germanRegion:null});
  const presentation=usePresentation.getState(),audio=usePreferences.getState().audioRouting;
  render(<><RegionalSelector availability={complete}/><OutputComposition banner={null} testOverlay={<TestModeWatermark role="main" visible/>}>
    <video data-testid="running-video"/><p>Am Anfang schuf Gott Himmel und Erde.</p><p>Gemeindeforum</p><p>Bitte den Seiteneingang benutzen.</p>
  </OutputComposition></>);
  const select=screen.getByRole('combobox',{name:'Deutsche Regionalvariante'}),video=screen.getByTestId('running-video');
  expect(screen.getAllByRole('option')).toHaveLength(16);
  expect(screen.queryByRole('option',{name:'Mittelhessisch'})).toBeNull();
  expect(screen.queryByRole('option',{name:'Obersächsisch'})).toBeNull();
  expect(screen.getByRole('option',{name:'Hochdeutsch'})).toHaveValue('');
  for(const region of regionalVariants.filter(region=>complete.regionIds.includes(region.id))){
    expect(screen.getByRole('option',{name:region.name})).toHaveValue(region.id);
    fireEvent.change(select,{target:{value:region.id}});
    expect(usePreferences.getState().germanRegion).toBe(region.id);
    expect(JSON.parse(localStorage.getItem('gottesdienstregie.preferences')!).state.germanRegion).toBe(region.id);
    expect(usePreferences.getState().audioRouting).toBe(audio);
    expect(usePresentation.getState()).toBe(presentation);
    expect(screen.getByTestId('running-video')).toBe(video);
    expect(screen.getByTestId('test-mode-watermark')).toHaveTextContent(/^TESTBETRIEB$/);
    expect(screen.getByText('Am Anfang schuf Gott Himmel und Erde.')).toBeVisible();
    expect(screen.getByText('Gemeindeforum')).toBeVisible();
    expect(screen.getByText('Bitte den Seiteneingang benutzen.')).toBeVisible();
  }
  fireEvent.change(select,{target:{value:''}});
  expect(usePreferences.getState().germanRegion).toBeNull();
});
