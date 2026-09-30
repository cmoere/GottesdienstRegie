import {describe,expect,it,vi} from 'vitest';
import {sendToLiveWindow} from './windowSafety';

describe('sendToLiveWindow',()=>{
  it('does not touch webContents after the window was destroyed',()=>{
    const window={isDestroyed:()=>true,get webContents():never{throw new Error('Object has been destroyed')}};
    expect(()=>sendToLiveWindow(window as never,'test:event',{ok:true})).not.toThrow();
  });

  it('does not send through destroyed webContents',()=>{
    const send=vi.fn(),window={isDestroyed:()=>false,webContents:{isDestroyed:()=>true,send}};
    expect(sendToLiveWindow(window as never,'test:event')).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it('sends to a live window',()=>{
    const send=vi.fn(),window={isDestroyed:()=>false,webContents:{isDestroyed:()=>false,send}};
    expect(sendToLiveWindow(window as never,'test:event',{ok:true})).toBe(true);
    expect(send).toHaveBeenCalledWith('test:event',{ok:true});
  });
});
