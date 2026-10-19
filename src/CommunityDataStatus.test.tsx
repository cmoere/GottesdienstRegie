import {act,cleanup,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {CommunityDataStatus} from './CommunityDataStatus';
import {usePreferences} from './preferences';
import {loadRegionalInterfacePack} from './regional/resources';
const initial=usePreferences.getState();
afterEach(()=>{cleanup();usePreferences.setState(initial,true)});
it('shows actual data timestamp in the operator online and offline status',()=>{
 usePreferences.setState({language:'de',germanRegion:null});
 const view=render(<CommunityDataStatus connection={{connected:true,mode:'online',updatedAt:Date.parse('2026-10-14T12:34:56Z')}}/>);
 expect(screen.getByText(/zuletzt aktualisiert/)).toHaveTextContent('14:34:56');
 view.rerender(<CommunityDataStatus connection={{connected:false,mode:'offline-cache',updatedAt:Date.parse('2026-10-14T12:34:56Z')}}/>);
 expect(screen.getByText(/letzter Stand/)).toHaveTextContent('14:34:56');
 view.rerender(<CommunityDataStatus connection={null}/>);expect(screen.getByText('Gemeindedaten nicht verfügbar')).toBeInTheDocument();
});

it('changes the operator status language without changing the connection timestamp or German date format',async()=>{
 await loadRegionalInterfacePack('ruhr');
 usePreferences.setState({language:'de',germanRegion:'ruhr'});
 const connection={connected:true,mode:'online',updatedAt:Date.parse('2026-10-14T12:34:56Z')};
 const view=render(<CommunityDataStatus connection={connection}/>);
 expect(screen.getByText(/Gemeindedaten sind online/)).toHaveTextContent('14:34:56');
 expect(screen.getByText(/Gemeindedaten sind online/)).toHaveTextContent('14.10.2026');
 act(()=>usePreferences.setState({language:'en'}));
 expect(screen.getByText(/Community data online/)).toHaveTextContent('14:34:56');
 expect(connection.updatedAt).toBe(Date.parse('2026-10-14T12:34:56Z'));
 view.rerender(<CommunityDataStatus connection={{...connection,connected:false,mode:'offline-cache'}}/>);
 expect(screen.getByText(/Community data offline/)).toHaveTextContent('14:34:56');
});

it('keeps loading, unknown cache age and unavailable data distinct in the selected base language',()=>{
 usePreferences.setState({language:'en',germanRegion:'ruhr'});
 const view=render(<CommunityDataStatus connection={{connected:true,mode:'online'}}/>);
 expect(screen.getByText('Community data online · loading')).toBeVisible();
 view.rerender(<CommunityDataStatus connection={{connected:false,mode:'offline-cache',updatedAt:NaN}}/>);
 expect(screen.getByText('Community data offline · last update unknown')).toBeVisible();
 view.rerender(<CommunityDataStatus connection={null}/>);
 expect(screen.getByText('Community data unavailable')).toBeVisible();
 expect(screen.queryByText(/Invalid Date/)).toBeNull();
});
