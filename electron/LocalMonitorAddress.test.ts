import {EventEmitter} from 'node:events';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {LocalMonitorAddress} from './LocalMonitorAddress';
const mock=vi.hoisted(()=>({createService:vi.fn(),shutdown:vi.fn(),getResponder:vi.fn()}));
vi.mock('@homebridge/ciao',()=>({getResponder:mock.getResponder}));
let service:EventEmitter&{advertise:ReturnType<typeof vi.fn>;getHostname:ReturnType<typeof vi.fn>};
beforeEach(()=>{vi.useFakeTimers();service=Object.assign(new EventEmitter(),{advertise:vi.fn(async()=>{}),getHostname:vi.fn(()=> 'regie.local.')});mock.createService.mockReset().mockReturnValue(service);mock.shutdown.mockReset().mockResolvedValue(undefined);mock.getResponder.mockReset().mockReturnValue({createService:mock.createService,shutdown:mock.shutdown})});
afterEach(()=>vi.useRealTimers());
it('publishes the fixed local name only after probing and shuts down on stop',async()=>{
 const states:any[]=[],address=new LocalMonitorAddress(state=>states.push(state));await address.start(43171);
 expect(mock.createService).toHaveBeenCalledWith(expect.objectContaining({hostname:'regie',type:'https',port:43171,txt:{path:'/lichtoperator'}}));
 expect(states.at(-1)).toEqual({status:'ready',hostname:'regie.local'});address.stop();await Promise.resolve();expect(mock.shutdown).toHaveBeenCalledTimes(1);expect(states.at(-1)).toEqual({status:'unavailable'});
});
it('does not publish a renamed address after a conflict or affect the HTTPS server',async()=>{
 const states:any[]=[],address=new LocalMonitorAddress(state=>states.push(state));await address.start(43171);service.emit('hostname-change','regie-(2)');await Promise.resolve();
 expect(states.at(-1)).toEqual({status:'conflict'});expect(mock.shutdown).toHaveBeenCalledTimes(1);address.stop();expect(mock.shutdown).toHaveBeenCalledTimes(1);
});
it('times out discovery without a late advertise completion reviving the address',async()=>{
 let finish!:()=>void;service.advertise.mockImplementation(()=>new Promise<void>(resolve=>finish=resolve));const states:any[]=[],address=new LocalMonitorAddress(state=>states.push(state));
 const pending=address.start(43171);await vi.advanceTimersByTimeAsync(10000);await pending;expect(states.at(-1)).toEqual({status:'unavailable'});finish();await Promise.resolve();expect(states.at(-1)).toEqual({status:'unavailable'});address.stop();
});
it('contains responder startup errors',async()=>{mock.getResponder.mockImplementation(()=>{throw Error('blocked')});const states:any[]=[];await new LocalMonitorAddress(s=>states.push(s)).start(43171);expect(states.at(-1)).toEqual({status:'unavailable'})});
it('settles an interrupted probe and ignores its late completion after stopping',async()=>{
 let finish!:()=>void;service.advertise.mockImplementation(()=>new Promise<void>(resolve=>finish=resolve));const states:any[]=[],address=new LocalMonitorAddress(s=>states.push(s));let settled=false;
 const pending=address.start(43171).then(()=>settled=true);address.stop();await vi.advanceTimersByTimeAsync(0);expect(settled).toBe(true);finish();await pending;expect(states.at(-1)).toEqual({status:'unavailable'});
});
