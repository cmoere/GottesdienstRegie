import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {ClockLoopView,ActiveClockLoopView} from './ClockLoopView';
import {CLOCK_DESIGNS,normalizeClockSettings} from './model';
afterEach(()=>{cleanup();vi.useRealTimers()});
describe('six clock output designs',()=>{
 it('runs one tick only while mounted and no ticks for static previews',()=>{
  vi.useFakeTimers();const settings=normalizeClockSettings({});
  const active=render(<ActiveClockLoopView settings={settings}/>);expect(vi.getTimerCount()).toBe(1);active.unmount();expect(vi.getTimerCount()).toBe(0);
  render(<ActiveClockLoopView settings={settings} staticPreview/>);expect(vi.getTimerCount()).toBe(0);
 });
 it('renders every design with fixed typography and without six live timers',()=>{
  for(const design of CLOCK_DESIGNS){const {container}=render(<ClockLoopView settings={{...normalizeClockSettings({}),design}} now={new Date(2026,9,23,13,5,7)}/>);expect(container.querySelector('[data-clock-design]')).toHaveAttribute('data-clock-design',design);expect(screen.getByText('Fr., 23.10.2026')).toBeVisible();cleanup()}
  expect(CLOCK_DESIGNS.length).toBe(6);
 });
 it('shows analog hands, optional seconds/date and 12-hour time independently',()=>{
  const settings=normalizeClockSettings({clockDesign:'analog-digital',clockHourCycle:'12',clockShowSeconds:false,clockShowDate:false});
  const {container}=render(<ClockLoopView settings={settings} now={new Date(2026,9,23,13,5,7)}/>);
  expect(screen.getByText('01:05 PM')).toBeVisible();expect(container.querySelectorAll('[data-clock-hand]')).toHaveLength(2);expect(screen.queryByText(/23.10/)).toBeNull();
 });
});
