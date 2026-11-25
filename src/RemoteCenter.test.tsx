import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {afterEach, expect, it, vi} from 'vitest';
import {RemoteCenter} from './RemoteCenter';
import {usePreferences} from './preferences';

vi.mock('./ScreenSharing', () => ({ScreenSharingPanel: () => null}));
vi.mock('./RemoteQrDialog', () => ({RemoteQrDialog: ({url}:{url:string}) => <output data-testid="monitor-url">{url}</output>}));
const originalDesktop = window.desktop, originalPreferences = usePreferences.getState();
afterEach(() => {cleanup(); window.desktop = originalDesktop; usePreferences.setState(originalPreferences, true);});

it('creates a separate lighting monitor with MAIN, four previews and its own stable link', async () => {
 usePreferences.setState({language: 'de', germanRegion: null});
 const saveMonitor = vi.fn(async value => value);
 window.desktop = {remote: {get: async () => ({active: true, address: '192.168.1.2', securePort: 43171,
  monitors: [], remotes: []}), saveMonitor}} as any;
 render(<RemoteCenter/>);
 const add = screen.getByRole('button', {name: '+ Lichtoperator'});
 await waitFor(() => expect(add).toBeEnabled());
 fireEvent.click(add);
 expect(screen.getByLabelText('Name')).toHaveValue('Lichtoperator (Lighting Operator)');
 expect(screen.getByLabelText(/^URL-Kennung/)).toHaveValue('lichtoperator');
 expect(screen.getByLabelText('Quelle')).toHaveValue('main');
 expect(screen.getByLabelText('Ansicht')).toHaveValue('lighting');
 fireEvent.change(screen.getByLabelText('Ansicht'), {target: {value: 'lighting-grid'}});
 fireEvent.click(screen.getByRole('button', {name: 'ERSTELLEN'}));
 await waitFor(() => expect(saveMonitor).toHaveBeenCalledWith(expect.objectContaining({
  profile: 'lighting', name: 'Lichtoperator (Lighting Operator)', slug: 'lichtoperator',
  layout: 'lighting-grid', sourceType: 'main', showCurrent: true, showNext: true,
  showNotes: false, enabled: true,
 })));
 await screen.findByRole('button', {name: '+ Personal Monitor'});
 fireEvent.click(screen.getByRole('button', {name: '+ Personal Monitor'}));
 expect(screen.getByLabelText('Ansicht')).toHaveValue('current-next');
 expect(screen.getByLabelText('Quelle')).toHaveValue('stage');
});

it('opens the fixed lighting URL without exposing the stored secret in its QR code',async()=>{
 usePreferences.setState({language:'de',germanRegion:null});window.desktop={remote:{get:async()=>({active:true,address:'192.168.1.2',securePort:43171,monitors:[{id:'light',name:'Lichtoperator',profile:'lighting',token:'stored-secret',enabled:true,sourceType:'main',slug:'old-slug',layout:'lighting'}],remotes:[]})}} as any;
 render(<RemoteCenter/>);fireEvent.click(await screen.findByRole('button',{name:'Lichtoperator öffnen'}));expect(screen.getByTestId('monitor-url')).toHaveTextContent('https://192.168.1.2:43171/lichtoperator');expect(screen.getByTestId('monitor-url')).not.toHaveTextContent('stored-secret');
});
