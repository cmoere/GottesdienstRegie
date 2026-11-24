import {EventEmitter} from 'node:events';
import {expect,it,vi} from 'vitest';
import {streamLiveImages} from './LiveImageStream';
class Response extends EventEmitter {headers:any;chunks:Buffer[]=[];ended=false;writable=true;writeHead(_status:number,headers:any){this.headers=headers}write(bytes:Buffer){this.chunks.push(bytes);return this.writable}end(){this.ended=true;this.emit('close')}}
it('streams successive fresh frames and ends when live access disappears',async()=>{
 vi.useFakeTimers();try{const res=new Response(),capture=vi.fn().mockResolvedValueOnce(Buffer.from('one')).mockResolvedValueOnce(Buffer.from('two')).mockResolvedValue(null);const pending=streamLiveImages(res as any,capture);await vi.advanceTimersByTimeAsync(250);await pending;expect(res.headers['content-type']).toContain('multipart/x-mixed-replace');expect(Buffer.concat(res.chunks).toString()).toContain('one');expect(Buffer.concat(res.chunks).toString()).toContain('two');expect(res.ended).toBe(true);expect(capture).toHaveBeenCalledTimes(3)}finally{vi.useRealTimers()}
});
it('does not queue captures behind a slow connection and stops on disconnect',async()=>{
 vi.useFakeTimers();try{const res=new Response();res.writable=false;const capture=vi.fn(async()=>Buffer.from('frame')),pending=streamLiveImages(res as any,capture);await vi.advanceTimersByTimeAsync(2000);expect(capture).toHaveBeenCalledTimes(1);res.emit('close');await pending;await vi.advanceTimersByTimeAsync(1000);expect(capture).toHaveBeenCalledTimes(1)}finally{vi.useRealTimers()}
});
