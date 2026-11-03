import {afterEach,expect,it,vi} from 'vitest';import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {LocalModelSettings} from './LocalModelSettings';import {usePreferences} from '../preferences';import {usePresentation} from '../store';import type {LocalModelsStatus} from '../../electron/localSlides/LocalModelManager';
afterEach(()=>{cleanup();vi.useRealTimers();delete window.desktop});
it('treats an explicit download cancellation as a choice rather than a model error',async()=>{
 vi.useFakeTimers();usePreferences.setState({language:'de',germanRegion:null});usePresentation.setState({onAir:false});let reject!:(error:Error)=>void;
 const status:LocalModelsStatus={autoDownload:true,models:[{id:'text',enabled:true,state:'missing',totalBytes:10,downloadedBytes:0}]};
 window.desktop={localModels:{status:vi.fn(async()=>structuredClone(status)),download:vi.fn(()=>{status.models[0].state='downloading';return new Promise<void>((_resolve,fail)=>{reject=fail})}),cancelDownload:vi.fn(async()=>{status.models[0].state='missing';status.models[0].enabled=false;reject(Error('cancelled'))}),configure:vi.fn(),remove:vi.fn()}} as any;
 render(<LocalModelSettings/>);await act(async()=>{await Promise.resolve()});fireEvent.click(screen.getByRole('button',{name:'Herunterladen'}));await act(async()=>{await vi.advanceTimersByTimeAsync(2000)});fireEvent.click(screen.getByRole('button',{name:'Download abbrechen'}));await act(async()=>{await Promise.resolve();await Promise.resolve()});expect(screen.queryByRole('alert')).toBeNull();expect(window.desktop!.localModels!.cancelDownload).toHaveBeenCalledWith('text');
});
