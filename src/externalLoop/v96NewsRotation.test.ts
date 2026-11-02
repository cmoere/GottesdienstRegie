import {expect,it} from 'vitest';
import {ExternalLoopController} from './controller';
import {createServiceItem} from '../store';
import {normalizeExternalSettings} from './model';
import {prepareNewsPresentation,newsFrameAt} from './newsPresentation';
import type {ExternalReply} from '../../shared/externalLoop';
it('advances one story per actual take, preserving its frozen snapshot on repeat and refresh',async()=>{
 const entries=['a','b','c'].map(id=>({id,title:id,source:'westfalen-blatt' as const,publishedAt:null,url:'https://www.westfalen-blatt.de/'+id}));
 let reply:ExternalReply={status:'ready',snapshot:{version:1,key:'news:westfalen-blatt',revision:'v1',fetchedAt:1000,stale:false,payload:{kind:'news',entries}}};
 const c=new ExternalLoopController(async()=>reply,()=>1000),item=createServiceItem('news',{sectionId:'pre'}),slide=item.slides[0];slide.elements=[{id:'n',type:'loop',name:'N',x:0,y:0,width:1920,height:1080,rotation:0,opacity:1,locked:true,visible:true,zIndex:1,properties:{loopType:'news'}}];
 const request={kind:'news' as const,sources:['westfalen-blatt' as const]};await c.prepare(request);
 const ids=(out:ReturnType<typeof c.outputForTake>)=>JSON.parse(String(out!.elements[0].properties.externalSnapshotJson)).payload.entries.map((x:{id:string})=>x.id);
 expect(ids(c.outputForTake(item,slide,1,1000))).toEqual(['a']);expect(ids(c.outputForTake(item,slide,1,2000))).toEqual(['a']);
 reply={...reply,snapshot:{...reply.snapshot!,revision:'v2'}};await c.prepare(request);
 expect(ids(c.outputForTake(item,slide,1,3000))).toEqual(['a']);expect(ids(c.outputForTake(item,slide,2,4000))).toEqual(['b']);expect(ids(c.outputForTake(item,slide,3,5000))).toEqual(['c']);expect(ids(c.outputForTake(item,slide,4,6000))).toEqual(['a']);
 expect(entries.map(e=>e.id)).toEqual(['a','b','c']);
});
it('defaults to per-take news and uses an explicit interval with exactly configured boundaries',()=>{
 expect(normalizeExternalSettings({externalKind:'news'})).toMatchObject({newsRotation:'per-take',newsIntervalSeconds:20});
 const entries=['a','b'].map(id=>({id,title:id,source:'westfalen-blatt' as const,publishedAt:null,url:'https://www.westfalen-blatt.de/'+id}));const plan=prepareNewsPresentation(entries,5,true);
 expect(newsFrameAt(plan,4999)?.entry.id).toBe('a');expect(newsFrameAt(plan,5000)?.entry.id).toBe('b');expect(plan.minDurationMs).toBe(10000);
});
