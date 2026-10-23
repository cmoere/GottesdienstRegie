import {it,expect,afterEach,vi} from 'vitest';
import {render,screen,fireEvent,act,cleanup} from '@testing-library/react';
import {WeatherDesigner} from './WeatherDesigner';
import type {WeatherLocation} from '../../shared/externalLoop';
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
const settings={kind:'weather' as const,name:'Bielefeld',latitude:52.0302,longitude:8.5325,durationSeconds:20};
it('saves a selected place only on explicit selection, and ignores an old result after editing the query',async()=>{
 let finish:(value:WeatherLocation[])=>void=()=>{},saved:unknown=null;
 vi.stubGlobal('desktop',{externalLoop:{searchLocations:()=>new Promise<WeatherLocation[]>(resolve=>{finish=resolve})}});
 render(<WeatherDesigner settings={settings} canEdit onChange={patch=>{saved=patch}}/>);
 fireEvent.change(screen.getByRole('textbox',{name:'Ort suchen'}),{target:{value:'Berlin'}});fireEvent.click(screen.getByRole('button',{name:'Ort suchen'}));
 fireEvent.change(screen.getByRole('textbox',{name:'Ort suchen'}),{target:{value:'Hamburg'}});
 await act(async()=>finish([{name:'Berlin',latitude:52.52,longitude:13.4}]));expect(screen.queryByRole('button',{name:'Berlin'})).toBeNull();expect(saved).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Ort suchen'}));await act(async()=>finish([{name:'Hamburg',latitude:53.55,longitude:10.0}]));fireEvent.click(screen.getByRole('button',{name:'Hamburg'}));expect(saved).toEqual({weatherName:'Hamburg',weatherLatitude:53.55,weatherLongitude:10});
});
