import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {AiGenerationStatus} from './AiGenerationStatus';
import {usePreferences} from './preferences';
const initial=usePreferences.getState();
afterEach(()=>{cleanup();vi.useRealTimers();usePreferences.setState(initial,true)});

it('localizes the current phase and keeps phase progression across a language change',()=>{
  vi.useFakeTimers();
  usePreferences.setState({language:'en',germanRegion:null});
  const view=render(<AiGenerationStatus active error="" onRetry={()=>{}}/>);
  expect(screen.getByRole('status')).toHaveTextContent('Creating artwork · Light');
  act(()=>vi.advanceTimersByTime(900));
  expect(screen.getByRole('status')).toHaveTextContent('Creating artwork · Color');
  act(()=>usePreferences.setState({language:'de'}));
  expect(screen.getByRole('status')).toHaveTextContent('Motiv wird erstellt · Farbe');
  view.rerender(<AiGenerationStatus active error="" reducedMotion onRetry={()=>{}}/>);
  act(()=>vi.advanceTimersByTime(2399));
  expect(screen.getByRole('status')).toHaveTextContent('Farbe');
  act(()=>vi.advanceTimersByTime(1));
  expect(screen.getByRole('status')).toHaveTextContent('Tiefe');
  view.rerender(<AiGenerationStatus active={false} error="" onRetry={()=>{}}/>);
  expect(screen.queryByRole('status')).toBeNull();
});

it('translates retry controls without rewriting a supplied error or changing the retry action',()=>{
  usePreferences.setState({language:'en',germanRegion:null});
  const onRetry=vi.fn(),error='Datei „Ölbild 123“ nicht vorhanden';
  render(<AiGenerationStatus active={false} error={error} onRetry={onRetry}/>);
  expect(screen.getByText(error)).toBeVisible();
  fireEvent.click(screen.getByRole('button',{name:'Try again'}));
  expect(onRetry).toHaveBeenCalledOnce();
});
