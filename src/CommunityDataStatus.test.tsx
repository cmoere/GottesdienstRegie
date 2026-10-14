import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {CommunityDataStatus} from './CommunityDataStatus';
afterEach(cleanup);
it('shows actual data timestamp in the operator online and offline status',()=>{
 const view=render(<CommunityDataStatus connection={{connected:true,mode:'online',updatedAt:Date.parse('2026-10-14T12:34:56Z')}}/>);
 expect(screen.getByText(/zuletzt aktualisiert/)).toHaveTextContent('14:34:56');
 view.rerender(<CommunityDataStatus connection={{connected:false,mode:'offline-cache',updatedAt:Date.parse('2026-10-14T12:34:56Z')}}/>);
 expect(screen.getByText(/letzter Stand/)).toHaveTextContent('14:34:56');
 view.rerender(<CommunityDataStatus connection={null}/>);expect(screen.getByText('Gemeindedaten nicht verfügbar')).toBeInTheDocument();
});
