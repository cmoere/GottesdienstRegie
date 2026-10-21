import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {OutputComposition} from './OutputComposition';
afterEach(cleanup);
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
