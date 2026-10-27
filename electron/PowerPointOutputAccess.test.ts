import {expect,it,vi} from 'vitest';
import {createPowerPointOutputAccess} from './PowerPointOutputAccess';

it('allows only registered unchanged top-level application frames to receive native pixels',()=>{
 const frame={},child={},window={webContents:{id:1,mainFrame:frame,getURL:()=>url},isDestroyed:()=>false};let url='file:///app/index.html';
 const player={addReceiver:vi.fn(()=>vi.fn()),binding:()=>({sessionId:'a'.repeat(32),generation:'b'.repeat(32)}),ready:vi.fn(()=>true),ack:vi.fn(()=>true),frameFault:vi.fn()};
 const access=createPowerPointOutputAccess(player as any);access.synchronize([{window:window as any,required:true}]);
 const event={sender:window.webContents,senderFrame:frame};
 expect(access.boot(event)).toEqual(player.binding());expect(access.boot({...event,senderFrame:child})).toBeNull();
 expect(access.ack({...event,senderFrame:child},{key:{}})).toBe(false);expect(player.ack).not.toHaveBeenCalled();
 url='https://attacker.invalid';expect(access.boot(event)).toBeNull();expect(access.ready(event,{})).toBe(false);
});
it('rejects receiver over-budget atomically and unregisters destroyed or replaced outputs',()=>{
 const stops=[vi.fn(),vi.fn()],player={addReceiver:vi.fn().mockReturnValueOnce(stops[0]).mockReturnValueOnce(stops[1])};
 const access=createPowerPointOutputAccess(player as any),windows=Array.from({length:5},(_,i)=>({window:{webContents:{id:i+1,mainFrame:{},getURL:()=>`file:///app/index.html#${i}`},isDestroyed:()=>false} as any,required:true}));
 expect(()=>access.synchronize(windows)).toThrow('POWERPOINT_RECEIVER_LIMIT');expect(player.addReceiver).not.toHaveBeenCalled();
 access.synchronize(windows.slice(0,2));access.synchronize(windows.slice(1,2));expect(stops[0]).toHaveBeenCalledOnce();access.clear();expect(stops[1]).toHaveBeenCalledOnce();
});
