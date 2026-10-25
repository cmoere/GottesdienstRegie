import {act,cleanup,render} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
vi.mock('./community/communityRuntime',()=>({startCommunityRuntime(){},subscribeCommunityRuntime:()=>()=>{},getCommunityAnnouncementRecords:()=>[{messageId:'public',status:'public',showMeldungBanner:true,textBanner:'Willkommen zum Gottesdienst'}]}));
import {AnnouncementBannerController,useAnnouncementBanner} from './AnnouncementBannerController';
import {useLiveOutputPreview} from './liveOutputPreview';
import {createServiceItem,usePresentation} from './store';
import {AppClock} from './community/AppClock';
afterEach(()=>{cleanup();useLiveOutputPreview.setState({slide:null});vi.restoreAllMocks()});
it('loads its actual bold font and remeasures at a safe cycle after the font arrives',async()=>{
 const descriptor=Object.getOwnPropertyDescriptor(document,'fonts');let finish!:(value:FontFace[])=>void,width=600,now=1000;
 const load=vi.fn(()=>new Promise<FontFace[]>(resolve=>{finish=resolve})),fontEvents=new EventTarget();
 Object.defineProperty(document,'fonts',{configurable:true,value:{ready:Promise.resolve(),load,addEventListener:fontEvents.addEventListener.bind(fontEvents),removeEventListener:fontEvents.removeEventListener.bind(fontEvents)}});
 vi.spyOn(AppClock,'now').mockImplementation(()=>new Date(now));vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({font:'',measureText:(text:string)=>({width:text==='Willkommen zum Gottesdienst'?width:340})} as any);
 const saved=usePresentation.getState(),item=createServiceItem('content',{sectionId:'pre'});usePresentation.setState({onAir:true,items:[item]});useLiveOutputPreview.setState({slide:{...item.slides[0],bannerContext:{liveSection:'pre',countdownActive:false}} as any});
 try{render(<AnnouncementBannerController quick={null}/>);expect(load).toHaveBeenCalledWith('700 44px "Cera Pro"');await act(async()=>{await Promise.resolve()});width=800;now=100000;await act(async()=>{finish([]);await Promise.resolve()});expect(useAnnouncementBanner.getState().banner?.textWidth).toBe(1140)}
 finally{cleanup();usePresentation.setState(saved,true);if(descriptor)Object.defineProperty(document,'fonts',descriptor);else delete (document as unknown as {fonts?:unknown}).fonts}
});
it('measures the same symmetric separator rendered between full banner messages',()=>{
  vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({font:'',measureText:(text:string)=>({width:text==='Willkommen zum Gottesdienst'?600:text==='                ·                '?340:32})} as any);
  const saved=usePresentation.getState(),item=createServiceItem('content',{sectionId:'pre'});
  usePresentation.setState({onAir:true,items:[item]});useLiveOutputPreview.setState({slide:{...item.slides[0],bannerContext:{liveSection:'pre',countdownActive:false}} as any});
  try{
    render(<AnnouncementBannerController quick={null}/>);
    expect(useAnnouncementBanner.getState().banner?.textWidth).toBe(940);
  }finally{cleanup();usePresentation.setState(saved,true)}
});
it('keeps the committed banner when its editor source moves or disappears until another take',()=>{
  vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({font:'',measureText:()=>({width:600})} as any);
  const saved=usePresentation.getState(),item=createServiceItem('content',{sectionId:'pre'}),slide={...item.slides[0],bannerContext:{liveSection:'pre',countdownActive:false}} as any;
  usePresentation.setState({onAir:true,items:[item]});useLiveOutputPreview.setState({slide});
  try{
    render(<AnnouncementBannerController quick={null}/>);
    const banner=useAnnouncementBanner.getState().banner;expect(banner?.reserved).toBe(true);
    act(()=>usePresentation.setState({items:[{...item,sectionId:'service'}]}));expect(useAnnouncementBanner.getState().banner).toBe(banner);
    act(()=>usePresentation.setState({items:[]}));expect(useAnnouncementBanner.getState().banner).toBe(banner);
    act(()=>useLiveOutputPreview.setState({slide:{...slide,id:'service-take',bannerContext:{liveSection:'service',countdownActive:false}}}));
    expect(useAnnouncementBanner.getState().banner).toBeNull();
  }finally{cleanup();usePresentation.setState(saved,true)}
});
