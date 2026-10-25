import {expect,it} from 'vitest';
import {AdvertisingRuntime,advertisingDurationMs,advertisingSlide} from './model';
import {createServiceItem} from '../store';
it('rotates prepared creatives only on a new take, applies the interval and rejects service/arrival placement',()=>{
 const first={id:'a',title:'Partner A',url:'gottesdienst-media://media/'+'a'.repeat(64)+'.png',kind:'image',durationSeconds:15},second={...first,id:'b',title:'Partner B'};
 const item=createServiceItem('content',{id:'ad',sectionId:'pre',metadata:{externalAdvertising:true,advertisingCreativesJson:JSON.stringify([first,second]),advertisingIntervalMinutes:5}}),runtime=new AdvertisingRuntime();
 expect(runtime.eligible(item,'other',1000)).toBe(true);expect(runtime.take(item,item.slides[0],1,1000)?.title).toBe('Partner A');
 expect(runtime.take(item,item.slides[0],1,2000)?.title).toBe('Partner A');expect(runtime.eligible(item,'other',2000)).toBe(false);expect(runtime.eligible(item,'ad',2000)).toBe(true);expect(runtime.eligible(item,'other',301000)).toBe(true);
 expect(runtime.take(item,item.slides[0],2,301000)?.title).toBe('Partner B');expect(runtime.take({...item,sectionId:'service'},item.slides[0],3,400000)).toBeNull();expect(runtime.eligible({...item,sectionId:'warmup'},'ad',400000)).toBe(false);
});
it('holds a sole video creative until its interval rather than replaying at media end',()=>{
 const creative={id:'v',title:'Partner',url:'gottesdienst-media://media/'+'a'.repeat(64)+'.mp4',kind:'video' as const,durationSeconds:15};
 const item=createServiceItem('content',{sectionId:'pre',metadata:{externalAdvertising:true,advertisingCreativesJson:JSON.stringify([creative]),advertisingIntervalMinutes:5}}),slide=advertisingSlide(item.slides[0],creative);
 expect(slide.elements[0].properties.endBehavior).toBe('hold');expect(advertisingDurationMs(item,slide,true)).toBe(300000);expect(advertisingDurationMs(item,slide,false)).toBe(15000);
});
