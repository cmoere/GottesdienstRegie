import {renderHook} from '@testing-library/react';import{expect,it,vi,afterEach}from'vitest';
import {useUpdateSettingsRequest} from './useUpdateSettingsRequest';
afterEach(()=>{delete window.desktop});
it('opens the requested existing settings view and unsubscribes without altering updater work',()=>{
 let request:()=>void=()=>{};const cleanup=vi.fn(),open=vi.fn(),download=vi.fn(),cancelDownload=vi.fn();
 window.desktop={updates:{onOpenSettings:(callback:()=>void)=>{request=callback;return cleanup},download,cancelDownload}} as any;
 const hook=renderHook(()=>useUpdateSettingsRequest(open));request();request();expect(open).toHaveBeenCalledTimes(2);expect(download).not.toHaveBeenCalled();expect(cancelDownload).not.toHaveBeenCalled();hook.unmount();expect(cleanup).toHaveBeenCalledOnce();
});
it('is harmless without a desktop bridge',()=>{expect(()=>renderHook(()=>useUpdateSettingsRequest(vi.fn()))).not.toThrow()});
