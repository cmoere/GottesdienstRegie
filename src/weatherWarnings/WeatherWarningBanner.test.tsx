import {act,cleanup,render,renderHook,screen} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {WeatherWarningBanner,useCurrentWeatherWarning} from './WeatherWarningBanner';
import {AppClock} from '../community/AppClock';
import type {PublicWeatherWarning,WeatherWarningState} from '../../shared/weatherWarnings';
const start=Date.parse('2026-10-24T12:00:00Z');let now=start;
const make=(id:string,event:string,patch:Partial<PublicWeatherWarning>={}):PublicWeatherWarning=>({id,event,headline:'Amtliche Warnung',description:'Unveränderter Originaltext.',severity:'Minor',areaName:'Bielefeld',source:'DWD',validFrom:new Date(start-1000).toISOString(),validUntil:new Date(start+90000).toISOString(),...patch});
const state=(items:PublicWeatherWarning[]):WeatherWarningState=>({revision:1,cycleStartedAtMs:start,fetchedAt:start,items});
beforeEach(()=>{now=start;vi.useFakeTimers();vi.spyOn(AppClock,'now').mockImplementation(()=>new Date(now))});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.useRealTimers()});
function View({value}:{value:WeatherWarningState|null}){const current=useCurrentWeatherWarning(value);return current?<WeatherWarningBanner current={current}/>:null}
it('shows the matching 1/2 and 2/2 positions on the existing common cycle',()=>{
 render(<View value={state([make('a','STURM'),make('b','GEWITTER')])}/>);
 expect(screen.getByLabelText('Warnung 1 von 2')).toHaveTextContent('1/2');expect(screen.getByRole('img',{name:'Sturm und Wind'})).toBeVisible();
 now+=20000;act(()=>vi.advanceTimersByTime(250));expect(screen.getByLabelText('Warnung 2 von 2')).toHaveTextContent('2/2');expect(screen.getByRole('img',{name:'Gewitter'})).toBeVisible();
 expect(screen.getByText('Unveränderter Originaltext.')).toBeVisible();expect(screen.getByText('Quelle: Deutscher Wetterdienst')).toBeVisible();
});
it('removes expired warnings from selection and count instead of leaving an empty time slot',()=>{
 const value=state([make('a','STURM',{validUntil:new Date(start+5000).toISOString()}),make('b','FROST')]);
 const hook=renderHook(()=>useCurrentWeatherWarning(value));expect(hook.result.current).toMatchObject({index:0,total:2});
 now+=6000;act(()=>vi.advanceTimersByTime(250));expect(hook.result.current).toMatchObject({item:{id:'b'},index:0,total:1});
});
it.each([['STURM','Sturm und Wind'],['GEWITTER mit STURMBÖEN','Gewitter'],['STARKREGEN','Regen'],['SCHNEEFALL','Schnee'],['GLÄTTE','Glätte und Frost'],['FROST','Glätte und Frost'],['HITZE','Hitze'],['NEBEL','Nebel'],['UNBEKANNT','Wetterwarnung'],['REISEHINWEIS','Wetterwarnung']])('renders an accessible local icon for %s',(event,label)=>{
 render(<View value={state([make('one',event)])}/>);expect(screen.getByRole('img',{name:label}).tagName.toLowerCase()).toBe('svg');expect(screen.queryByLabelText(/Warnung 1 von/)).toBeNull();
});
it('selects identically for two renderers and hides unavailable, future and stale data',()=>{
 const value=state([make('future','STURM',{validFrom:new Date(start+50000).toISOString()}),make('valid','NEBEL')]);
 const one=renderHook(()=>useCurrentWeatherWarning(value)),two=renderHook(()=>useCurrentWeatherWarning(value));expect(one.result.current).toEqual(two.result.current);expect(one.result.current).toMatchObject({item:{id:'valid'},total:1});
 const view=render(<View value={null}/>);expect(screen.queryByRole('complementary')).toBeNull();view.rerender(<View value={{...value,fetchedAt:start-120001}}/>);expect(screen.queryByRole('complementary')).toBeNull();
});
