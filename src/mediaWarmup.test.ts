import {afterEach,expect,it,vi} from 'vitest';
import {createServiceItem,usePresentation} from './store';
import {LiveEngine} from './LiveEngine';
import {MediaWarmupPool,upcomingMedia} from './mediaWarmup';
afterEach(()=>{delete window.desktop;vi.useRealTimers()});
it('limits requests, keeps media muted, never plays and releases obsolete resources',()=>{
 vi.useFakeTimers();
 const nodes:HTMLMediaElement[]=[],create=document.createElement.bind(document);
 vi.spyOn(document,'createElement').mockImplementation(((tag:string)=>{const node=create(tag);if(tag==='video')nodes.push(node as HTMLMediaElement);return node}) as typeof document.createElement);
 vi.spyOn(HTMLMediaElement.prototype,'load').mockImplementation(()=>{});
 vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
 const play=vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();
 const pool=new MediaWarmupPool();
 pool.prepare(Array.from({length:10},(_,i)=>({kind:'video',src:`gottesdienst-media://clip${i}.mp4`})));
 expect(nodes).toHaveLength(2);expect(nodes[0].muted).toBe(true);expect(nodes[0].preload).toBe('metadata');expect(nodes[0].autoplay).toBe(false);
 nodes[0].dispatchEvent(new Event('loadedmetadata'));expect(nodes).toHaveLength(3);
 vi.advanceTimersByTime(8000);expect(nodes[1].hasAttribute('src')).toBe(false);expect(nodes[2].hasAttribute('src')).toBe(false);
 pool.prepare([]);expect(nodes.every(node=>!node.hasAttribute('src'))).toBe(true);expect(play).not.toHaveBeenCalled();
 pool.clear();vi.restoreAllMocks();
});
it('excludes live streams, hidden media and websites from warming',()=>{
 const a=createServiceItem('content'),b=createServiceItem('web');
 b.slides[0].elements=['web','audio','video'].map((kind,index)=>({id:String(index),type:kind as any,name:kind,x:0,y:0,width:1,height:1,rotation:0,opacity:1,locked:false,visible:true,zIndex:0,properties:{src:kind==='video'?'https://example.org/radio.m3u8':'https://example.org/radio'}}));
 expect(upcomingMedia([a,b],a.slides[0].id)).toEqual([]);
});
it('sends only the next enabled static media to output windows, never radio/web/audio streams',async()=>{
 vi.useFakeTimers();
 const a=createServiceItem('content',{id:'a',order:0}),b=createServiceItem('video',{id:'b',order:1}),disabled=createServiceItem('image',{id:'disabled',order:2,enabled:false}),c=createServiceItem('image',{id:'c',order:3}),later=createServiceItem('image',{id:'later',order:4});
 b.slides[0].elements=[{id:'video',type:'video',name:'video',x:0,y:0,width:1920,height:1080,rotation:0,opacity:1,locked:false,visible:true,zIndex:0,properties:{src:'gottesdienst-media://video.mp4'}}];
 c.slides[0].backgroundImage='gottesdienst-media://poster.png';
 later.slides[0].backgroundImage='gottesdienst-media://later.png';
 usePresentation.setState({items:[a,b,disabled,c,later]});let sent:any;
 window.desktop={sendLiveSlide:async(value:unknown)=>{sent=value;return true}} as any;
 const pending=new LiveEngine().show(a.slides[0]);await vi.advanceTimersByTimeAsync(100);await pending;
 expect(sent._mediaWarmup).toEqual([{kind:'video',src:'gottesdienst-media://video.mp4'},{kind:'image',src:'gottesdienst-media://poster.png'}]);
});
