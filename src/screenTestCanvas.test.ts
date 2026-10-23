import {afterEach,expect,it,vi} from 'vitest';
import {observeScreenTestPattern} from './screenTestCanvas';
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks()});
function canvas(){
 const element=document.createElement('canvas');
 vi.spyOn(element,'getBoundingClientRect').mockReturnValue({width:1280,height:720,x:0,y:0,top:0,bottom:720,left:0,right:1280,toJSON:()=>({})});
 const context={fillStyle:'',strokeStyle:'',lineWidth:1,fillRect:vi.fn(),beginPath:vi.fn(),arc:vi.fn(),stroke:vi.fn(),getImageData:()=>({data:new Uint8ClampedArray([0,0,0,255])})};
 vi.spyOn(element,'getContext').mockReturnValue(context as any);return element;
}
it('holds a pattern until a stable measured rendering window has completed',async()=>{
 vi.useFakeTimers();const report=vi.fn(),stop=observeScreenTestPattern(canvas(),{runId:'a'.repeat(32),pattern:'black'},report);
 await vi.advanceTimersByTimeAsync(4999);expect(report).not.toHaveBeenCalled();
 await vi.advanceTimersByTimeAsync(150);expect(report).toHaveBeenCalledTimes(1);
 expect(report.mock.calls[0][0]).toMatchObject({ok:true,width:1280,height:720,pattern:'black'});
 expect(report.mock.calls[0][0].frames).toBeGreaterThanOrEqual(12);
 stop();await vi.advanceTimersByTimeAsync(10000);expect(report).toHaveBeenCalledTimes(1);
});
it('reports actual pixel mismatch as failure and cancels callbacks after unmount',async()=>{
 vi.useFakeTimers();const report=vi.fn();observeScreenTestPattern(canvas(),{runId:'a'.repeat(32),pattern:'red'},report);
 await vi.advanceTimersByTimeAsync(5200);expect(report).toHaveBeenCalledWith(expect.objectContaining({ok:false,reason:'pattern-mismatch'}));
 const late=vi.fn(),stop=observeScreenTestPattern(canvas(),{runId:'b'.repeat(32),pattern:'black'},late);stop();
 await vi.advanceTimersByTimeAsync(2000);expect(late).not.toHaveBeenCalled();
});
it('extends the test until dimensions remain stable again after a resize',async()=>{
 vi.useFakeTimers();const element=canvas(),report=vi.fn();observeScreenTestPattern(element,{runId:'a'.repeat(32),pattern:'black'},report);
 await vi.advanceTimersByTimeAsync(4900);
 vi.mocked(element.getBoundingClientRect).mockReturnValue({width:1600,height:900,x:0,y:0,top:0,bottom:900,left:0,right:1600,toJSON:()=>({})});
 await vi.advanceTimersByTimeAsync(4500);expect(report).not.toHaveBeenCalled();
 await vi.advanceTimersByTimeAsync(600);expect(report).toHaveBeenCalledWith(expect.objectContaining({ok:true,width:1600,height:900}));
});
