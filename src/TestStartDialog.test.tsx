import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {TestStartDialog} from './TestStartDialog';
afterEach(cleanup);
it('selects a test notice explicitly before starting; cancel never starts output',()=>{
 const start=vi.fn(),cancel=vi.fn();
 render(<TestStartDialog onStart={start} onClose={cancel}/>);
 expect(screen.getByLabelText('Automatisch')).toBeChecked();
 fireEvent.click(screen.getByLabelText('Testveranstaltung'));
 fireEvent.click(screen.getByRole('button',{name:'Weiter zur Ausgabeprüfung'}));
 expect(start).toHaveBeenCalledWith('next-events');
 start.mockClear();fireEvent.click(screen.getByRole('button',{name:'Abbrechen'}));
 expect(cancel).toHaveBeenCalledOnce();expect(start).not.toHaveBeenCalled();
});
