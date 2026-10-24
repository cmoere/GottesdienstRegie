import {act,cleanup,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {OutputComposition} from './OutputComposition';
import {useSpeechStatus} from './announcements/AnnouncementIndicator';
afterEach(cleanup);
it('mirrors the speaker in real output previews without an operator-wide overlay',()=>{
 const view=render(<OutputComposition banner={null}><video/></OutputComposition>);
 act(()=>useSpeechStatus.setState({active:true}));expect(screen.getByRole('img',{name:'Durchsage läuft'})).toBeVisible();
 act(()=>useSpeechStatus.setState({active:false}));expect(screen.queryByRole('img',{name:'Durchsage läuft'})).toBeNull();view.unmount();
});
it('shows a small speaker above content only during an active announcement without remounting content',()=>{
 const view=render(<OutputComposition banner={null} announcementActive><video data-testid="kept"/></OutputComposition>),video=screen.getByTestId('kept');
 expect(screen.getByRole('img',{name:'Durchsage läuft'}).closest('.output-content-fit')).toBeNull();
 view.rerender(<OutputComposition banner={null} announcementActive={false}><video data-testid="kept"/></OutputComposition>);
 expect(screen.queryByRole('img',{name:'Durchsage läuft'})).toBeNull();expect(screen.getByTestId('kept')).toBe(video);
});
it('reserves independent warning space without remounting content or hiding the test overlay',()=>{
 const now=Date.now(),warning:any={revision:1,cycleStartedAtMs:now,fetchedAt:now,items:[{id:'dwd',event:'Wind',headline:'Amtliche Warnung',description:'Originaltext',validFrom:new Date(now-1000).toISOString(),validUntil:new Date(now+60000).toISOString(),severity:'Minor',areaName:'Bielefeld',source:'DWD'}]};
 const view=render(<OutputComposition banner={null} testOverlay={<span>TESTBETRIEB</span>}><video data-testid="preserved"/></OutputComposition>),video=screen.getByTestId('preserved');
 view.rerender(<OutputComposition banner={null} weatherWarnings={warning} testOverlay={<span>TESTBETRIEB</span>}><video data-testid="preserved"/></OutputComposition>);
 expect(view.container.querySelector('.output-composition')).toHaveAttribute('data-weather-warning','true');expect(screen.getByTestId('preserved')).toBe(video);expect(screen.getByText('Quelle: Deutscher Wetterdienst')).toBeVisible();expect(screen.getByText('TESTBETRIEB').closest('.output-weather-layer')).toBeNull();
});
it('keeps content mounted as banner state changes and puts the watermark outside its scaled layer',()=>{
  const state={revision:1,position:'bottom' as const,items:[{id:'x',text:'Meldung',priority:'normal' as const}],cycleStartedAtMs:1000,reserved:true};
  const view=render(<OutputComposition banner={state} testOverlay={<span>TESTBETRIEB</span>}><video data-testid="movie"/></OutputComposition>),video=screen.getByTestId('movie');
  view.rerender(<OutputComposition banner={{...state,revision:2,position:'top'}} testOverlay={<span>TESTBETRIEB</span>}><video data-testid="movie"/></OutputComposition>);
  expect(screen.getByTestId('movie')).toBe(video);
  expect(screen.getByText('TESTBETRIEB').closest('.output-content-fit')).toBeNull();
  expect(view.container.querySelector('.output-composition')).toHaveAttribute('data-banner-position','top');
  expect(view.container.querySelector('.output-content-fit')).toContainElement(video);
});
it('keeps emergency quick screens free of the optional service countdown',()=>{
 const view=render(<OutputComposition banner={null} serviceCountdownAtMs={Date.now()+60000}><div/></OutputComposition>);
 expect(screen.getByText(/Beginn in/)).toBeVisible();
 view.rerender(<OutputComposition banner={null} serviceCountdownAtMs={Date.now()+60000} hideCountdown><div/></OutputComposition>);
 expect(screen.queryByText(/Beginn in/)).toBeNull();
});
