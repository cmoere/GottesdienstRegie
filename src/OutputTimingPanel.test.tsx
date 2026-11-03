import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {render,screen,waitFor,cleanup} from '@testing-library/react';
import {OutputTimingPanel} from './OutputTimingPanel';
import {usePresentation} from './store';
import {usePreferences} from './preferences';
import {useLiveOutputPreview} from './liveOutputPreview';
describe('output diagnostics protocol resilience',()=>{
 beforeEach(()=>{usePresentation.setState({onAir:true});usePreferences.setState({language:'de',germanRegion:null});useLiveOutputPreview.setState({slide:null})});
 afterEach(()=>{cleanup();delete window.desktop});
 it('does not crash the live workspace when an older or incomplete bridge returns null',async()=>{
  const get=vi.fn(async()=>null);window.desktop={outputTiming:{get}} as any;
  render(<OutputTimingPanel/>);await waitFor(()=>expect(get).toHaveBeenCalledOnce());
  expect(screen.queryByText('Ausgabe-Diagnose')).not.toBeInTheDocument();
 });
 it('renders a validated measurement without changing the live slide',async()=>{
  window.desktop={outputTiming:{get:async()=>[{role:'main',status:'confirmed',samples:1,lastMs:50,renderMs:20,p95Ms:50,previewDeltaMs:2}]}} as any;
  render(<OutputTimingPanel/>);await screen.findByText('Ausgabe-Diagnose');
  expect(screen.getByText(/MAIN: 50 ms/)).toBeInTheDocument();expect(useLiveOutputPreview.getState().slide).toBeNull();
 });
});
