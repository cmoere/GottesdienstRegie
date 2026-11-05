import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {version} from '../package.json';
import {SettingsModal} from './App';
import {usePreferences} from './preferences';

afterEach(()=>{
  cleanup();
  vi.unstubAllGlobals();
  delete window.desktop;
});

it('loads version details only on the Updates tab and shows the result immediately',async()=>{
  usePreferences.setState({language:'de',germanRegion:null});
  const waitForever=()=>new Promise<never>(()=>{});
  let finishCheck!:(status:DesktopUpdateStatus)=>void;
  const updates={
    currentVersion:vi.fn(waitForever),
    metadata:vi.fn(waitForever),
    previous:vi.fn(async()=>{throw new Error('offline')}),
    status:vi.fn(async()=>({state:'idle'})),
    onStatus:vi.fn(),
    check:vi.fn(()=>new Promise<DesktopUpdateStatus>(resolve=>{finishCheck=resolve})),
  };
  window.desktop={updates,onDisplaysChanged:vi.fn()} as unknown as NonNullable<typeof window.desktop>;
  const request=vi.fn(async()=>new Response(JSON.stringify({versions:[{
    line:'0.98',builds:[{
      version:'0.98.0',releaseDate:'2026-11-04',sections:{},
      overview:{label:{de:'Archivierter Hinweis'},text:{de:'Alter Text'}},
    }],
  },{line:'0.97',builds:[{
    version:'0.97.0',releaseDate:'2026-11-03',sections:{},
    overview:{label:{de:'Älterer Hinweis'},text:{de:'Historischer Text'}},
  }]}]})));
  vi.stubGlobal('fetch',request);
  const close=vi.fn();
  const {rerender}=render(<SettingsModal close={close} canConfigure/>);
  expect(updates.metadata).not.toHaveBeenCalled();
  expect(updates.previous).not.toHaveBeenCalled();
  expect(request).not.toHaveBeenCalled();
  rerender(<SettingsModal close={close} canConfigure openUpdatesRequest={1}/>);
  expect(screen.getByText(version,{exact:true})).toBeVisible();
  expect(screen.getByText('Installationsdetails werden geladen …',{selector:'.loading-status'})).toBeVisible();
  await screen.findByText('Vorherige Version konnte nicht geladen werden.');
  expect(await screen.findByText('Archivierter Hinweis')).toBeVisible();
  expect(screen.queryByText('Historischer Text')).toBeNull();
  fireEvent.click(screen.getByText('Version 0.97'));
  fireEvent.click(await screen.findByText('Version 0.97.0'));
  expect(await screen.findByText('Historischer Text')).toBeVisible();
  fireEvent.click(screen.getByRole('button',{name:'Erneut versuchen'}));
  expect(updates.previous).toHaveBeenCalledTimes(2);
  const check=screen.getByRole('button',{name:/Updates suchen/i});
  fireEvent.click(check);
  expect(check).toBeDisabled();
  await act(async()=>finishCheck({state:'not-available'}));
  expect(check).toBeEnabled();
});
