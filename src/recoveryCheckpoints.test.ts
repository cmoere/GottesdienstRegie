import {afterEach,expect,it,vi} from 'vitest';
import * as checkpoints from './recoveryCheckpoints';
afterEach(()=>vi.useRealTimers());
it('checkpoints latest dirty edits after quiet time and during continuous edits without saving original',async()=>{
 vi.useFakeTimers();
 let changed!:()=>void,state={presentationId:'id',updatedAt:'1',saveState:'dirty',title:'A'},saved:any[]=[];
 const start=(checkpoints as any).startRecoveryCheckpoints;
 expect(start).toBeTypeOf('function');
 const stop=start((listener:()=>void)=>{changed=listener;return()=>{}},()=>state,async(value:any)=>{saved.push({...value})});
 await vi.advanceTimersByTimeAsync(1000);expect(saved.map(x=>x.title)).toEqual(['A']);
 for(let i=0;i<8;i++){state={...state,updatedAt:String(i+2),title:'Edit '+i};changed();await vi.advanceTimersByTimeAsync(700)}
 expect(saved.length).toBeGreaterThanOrEqual(2);expect(saved.at(-1).title).not.toBe('A');
 stop();await vi.advanceTimersByTimeAsync(5000);
});
