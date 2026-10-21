import {afterEach,expect,it,vi} from 'vitest';
import {act,cleanup,render,screen} from '@testing-library/react';
import {prepareServiceCountdown,ServiceCountdownBadge} from './ServiceCountdownBadge';
afterEach(()=>{cleanup();vi.useRealTimers()});
it('uses effective event time and only prepares pre-service output',()=>{
 const event={eventKey:'linked',titel:'Gottesdienst',start_datum:'2026-10-21',start_uhrzeit:'10:30',Verspaetungsanfangsuhrzeit:'10:38'};
 const input={enabled:true,sectionId:'warmup',eventKey:'linked',date:'2026-10-21',serviceTime:'10:30'};
 expect(prepareServiceCountdown(input,[event])).toBe(new Date('2026-10-21T10:38:00').getTime());
 expect(prepareServiceCountdown({...input,sectionId:'service'},[event])).toBeUndefined();
 expect(prepareServiceCountdown({...input,enabled:false},[event])).toBeUndefined();
 expect(prepareServiceCountdown(input,[{...event,cancelled:true}])).toBeUndefined();
 expect(prepareServiceCountdown(input,[])).toBeUndefined();
});
it('counts against the shared wall clock and disappears when the service starts',()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-21T10:00:00Z'));
 render(<ServiceCountdownBadge startsAtMs={Date.now()+61000}/>);
 expect(screen.getByText('Beginn in 01:01')).toBeVisible();
 act(()=>vi.advanceTimersByTime(1000));expect(screen.getByText('Beginn in 01:00')).toBeVisible();
 act(()=>vi.advanceTimersByTime(60000));expect(screen.queryByText(/Beginn in/)).toBeNull();
});
