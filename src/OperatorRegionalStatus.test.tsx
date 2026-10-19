import {act,cleanup,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {FontAvailabilityWarning} from './FontAvailabilityWarning';
import {MainLivePreview} from './MainLivePreview';
import {TestModeContext} from './TestModeWatermark';
import * as fonts from './fonts';
import {createServiceItem} from './store';
import {usePreferences} from './preferences';
import {loadRegionalInterfacePack} from './regional/resources';

const initial=usePreferences.getState();
afterEach(()=>{cleanup();vi.restoreAllMocks();usePreferences.setState(initial,true)});

it('changes operator font warnings immediately without rewriting font names or rescanning on a language change',async()=>{
  const item=createServiceItem('content',{body:'Unveränderter Text'});
  const text=item.slides[0].elements.find(element=>element.type==='text')!;
  text.properties.fontFamily='Cera Pro {fonts}';
  const check=vi.spyOn(fonts,'findMissingFonts').mockResolvedValue({missing:['Cera Pro {fonts}'],unchecked:[]});
  await loadRegionalInterfacePack('ruhr');
  usePreferences.setState({language:'de',germanRegion:'ruhr'});
  render(<FontAvailabilityWarning items={[item]}/>);
  expect(await screen.findByText('Diese Schriften fehlen: Cera Pro {fonts}')).toHaveAttribute('title','Diese Schriften fehlen: Cera Pro {fonts}');
  act(()=>usePreferences.setState({language:'en'}));
  expect(screen.getByText('Missing fonts: Cera Pro {fonts}')).toBeVisible();
  expect(check).toHaveBeenCalledTimes(1);
});

it('keeps an unavailable font check distinct from an actual missing-font warning',async()=>{
  vi.spyOn(fonts,'findMissingFonts').mockResolvedValue({missing:[],unchecked:['Cera Pro']});
  usePreferences.setState({language:'en',germanRegion:'ruhr'});
  render(<FontAvailabilityWarning items={[createServiceItem('content',{body:'Text'})]}/>);
  expect(await screen.findByText('Font checking is not fully available')).toBeVisible();
  expect(screen.queryByText(/Missing fonts:/)).toBeNull();
});

it('regionalizes only the live-preview heading while preserving the mounted output, title and test watermark',async()=>{
  await loadRegionalInterfacePack('ruhr');
  usePreferences.setState({language:'de',germanRegion:'ruhr'});
  render(<TestModeContext.Provider value={true}><MainLivePreview title="Gemeindeforum"><video data-testid="active-media"/><p>Am Anfang schuf Gott Himmel und Erde.</p></MainLivePreview></TestModeContext.Provider>);
  const media=screen.getByTestId('active-media');
  expect(screen.getByRole('heading',{name:'LIVE AUFM MAIN'})).toBeVisible();
  act(()=>usePreferences.setState({language:'en'}));
  expect(screen.getByRole('heading',{name:'LIVE ON MAIN'})).toBeVisible();
  expect(screen.getByTestId('active-media')).toBe(media);
  expect(screen.getByText('Gemeindeforum')).toBeVisible();
  expect(screen.getByText('Am Anfang schuf Gott Himmel und Erde.')).toBeVisible();
  expect(screen.getByTestId('test-mode-watermark')).toHaveTextContent(/^TESTBETRIEB$/);
});
