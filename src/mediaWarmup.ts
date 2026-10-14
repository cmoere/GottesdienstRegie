import {useEffect,useRef} from 'react';
import type {ServiceItem} from './store';
export type WarmupAsset={kind:'image'|'video'|'audio';src:string};
function allowed(asset:WarmupAsset){
 if(typeof asset?.src!=='string'||asset.src.length>4096)return false;
 if(!/^(https?:|file:|gottesdienst-media:|gottesdienst-cloud:|blob:)/i.test(asset.src))return false;
 if(asset.kind==='image')return true;
 if(asset.kind==='audio')return /^(file:|gottesdienst-media:|gottesdienst-cloud:|blob:)/i.test(asset.src);
 return asset.kind==='video'&&(/^(file:|gottesdienst-media:|gottesdienst-cloud:|blob:)/i.test(asset.src)||/\.(mp4|webm|mov|m4v)([?#]|$)/i.test(asset.src));
}
export function upcomingMedia(items:ServiceItem[],currentSlideId?:string,sections:string[]=[]):WarmupAsset[]{
 const slides=items.filter(item=>item.enabled&&!item.disabled).sort((a,b)=>(sections.indexOf(a.sectionId)-sections.indexOf(b.sectionId))||a.order-b.order).flatMap(item=>item.slides.filter(slide=>slide.enabled));
 const index=slides.findIndex(slide=>slide.id===currentSlideId),result:WarmupAsset[]=[];
 for(const slide of slides.slice(index+1,index+3)){
  if(slide.backgroundImage)result.push({kind:'image',src:slide.backgroundImage});
  for(const element of slide.elements)if(element.visible&&['image','video','audio'].includes(element.type))result.push({kind:element.type as WarmupAsset['kind'],src:String(element.properties.src??element.properties.url??'')});
 }
 return result.filter((asset,index,all)=>allowed(asset)&&all.findIndex(other=>other.kind===asset.kind&&other.src===asset.src)===index).slice(0,6);
}
type Entry={asset:WarmupAsset;node?:HTMLImageElement|HTMLMediaElement;timer?:ReturnType<typeof setTimeout>;done:boolean};
/** Per-window bounded preparation. Never calls play(), routes audio or advances slides. */
export class MediaWarmupPool{
 private entries=new Map<string,Entry>();private active=0;
 prepare(input:WarmupAsset[]){
  const assets=(Array.isArray(input)?input:[]).filter(allowed).slice(0,6),keys=new Set(assets.map(a=>a.kind+':'+a.src));
  for(const [key,entry]of this.entries)if(!keys.has(key)){this.release(entry);this.entries.delete(key)}
  for(const asset of assets){const key=asset.kind+':'+asset.src;if(!this.entries.has(key))this.entries.set(key,{asset,done:false})}
  this.pump();
 }
 clear(){for(const entry of this.entries.values())this.release(entry);this.entries.clear()}
 private release(entry:Entry){
  clearTimeout(entry.timer);
  if(entry.node){entry.node.onload=null;entry.node.onerror=null;entry.node.onloadedmetadata=null;
   if(entry.asset.kind!=='image'){const node=entry.node as HTMLMediaElement;node.pause();node.removeAttribute('src');node.load()}else entry.node.removeAttribute('src');
   if(!entry.done)this.active--;entry.node=undefined;
  }
 }
 private pump(){
  for(const entry of this.entries.values()){
   if(this.active>=2)break;if(entry.node||entry.done)continue;
   const node=entry.asset.kind==='image'?new Image():document.createElement(entry.asset.kind);
   entry.node=node;this.active++;
   const finish=()=>{if(entry.done||!entry.node)return;entry.done=true;this.active--;clearTimeout(entry.timer);this.pump()};
   node.onerror=finish;entry.timer=setTimeout(()=>{this.release(entry);entry.done=true;this.pump()},8000);
   if(entry.asset.kind==='image'){node.onload=finish;(node as HTMLImageElement).decoding='async';node.src=entry.asset.src}
   else{const media=node as HTMLMediaElement;media.autoplay=false;media.muted=true;media.volume=0;media.preload='metadata';media.onloadedmetadata=finish;media.src=entry.asset.src;media.load()}
  }
 }
}
export function useMediaWarmup(assets:WarmupAsset[]){
 const pool=useRef<MediaWarmupPool|null>(null),key=JSON.stringify(assets);
 useEffect(()=>{pool.current??=new MediaWarmupPool();pool.current.prepare(JSON.parse(key))},[key]);
 useEffect(()=>()=>{pool.current?.clear();pool.current=null},[]);
}
