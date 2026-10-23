import type {ExternalReply,ExternalSnapshot,NewsEntry,NewsSource} from '../../shared/externalLoop';
import {createHash} from 'node:crypto';
import {SaxesParser} from 'saxes';
import {currentNewsSources,isCurrentNewsEntry} from '../../shared/newsSourcePolicy';
import {EXTERNAL_RESPONSE_LIMIT} from './http';
import type {ImageSource} from './newsImages';
export type SnapshotCache={read(key:string,maxAgeMs:number):Promise<ExternalSnapshot|null>;write(snapshot:ExternalSnapshot):Promise<void>};
export type NewsDependencies={fetchText:(url:string,signal:AbortSignal)=>Promise<string>;cache:SnapshotCache;now?:()=>number;loadImage?:(source:ImageSource,url:string,signal:AbortSignal)=>Promise<string|null>};
export const NEWS_FEEDS:Record<NewsSource,string>={
 'westfalen-blatt':'https://www.westfalen-blatt.de/rss/feed?subcategory=/owl/bielefeld',
 'wdr-owl':'https://www1.wdr.de/nrw/ostwestfalen-lippe/uebersicht-westfalen-lippe-100.feed',
};
const hash=(text:string)=>createHash('sha256').update(text).digest('hex');
function articleUrl(value:string):string|null{
 try{const url=new URL(value.trim());if(url.protocol!=='https:'||url.username||url.password||url.port)return null;url.hash='';for(const key of [...url.searchParams.keys()])if(/^utm_/i.test(key))url.searchParams.delete(key);return url.href}catch{return null}
}
function titleText(value:string):string{
 return value.replace(/<\/?[a-z][^>]*>/gi,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&#(x[0-9a-f]+|\d+);/gi,(_match,code:string)=>{const point=code[0].toLowerCase()==='x'?parseInt(code.slice(1),16):Number(code);return point>0&&point<=0x10ffff?String.fromCodePoint(point):''}).replace(/<\/?[a-z][^>]*>/gi,'').replace(/\s+/g,' ').trim();
}
function descriptionText(value:string){return titleText(value.replace(/<(script|style|iframe)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<\/?p\b[^>]*>|<br\s*\/?>/gi,'\uE000')).replace(/\s*\uE000\s*/g,'\n').replace(/\n+/g,'\n').trim().slice(0,10000)}
export function parseNews(xml:string,source:NewsSource):Array<NewsEntry&{imageUrl?:string}>{
 if(Buffer.byteLength(xml)>EXTERNAL_RESPONSE_LIMIT||/<!\s*(?:DOCTYPE|ENTITY)/i.test(xml))throw Error('unsafe-xml');
 const parser=new SaxesParser({xmlns:true}),path:string[]=[],entries:Array<NewsEntry&{imageUrl?:string}>=[],seen=new Set<string>();
 let item:Record<string,string>|null=null,depth=0,seenItems=0,root='';
 parser.on('doctype',()=>{throw Error('unsafe-xml')});
 parser.on('opentag',tag=>{
  path.push(tag.local);if(path.length>64)throw Error('xml-depth');if(path.length===1)root=tag.local;
  if((root==='rss'&&path.join('/')==='rss/channel/item')||(root==='feed'&&path.join('/')==='feed/entry')){seenItems++;if(seenItems<=100){item={};depth=path.length}return}
  if(!item)return;
  const attr=(name:string)=>Object.values(tag.attributes).find(attribute=>attribute.local===name)?.value;
  if(['enclosure','thumbnail','content'].includes(tag.local)&&attr('url')&&(tag.local!=='enclosure'||/^image\//.test(attr('type')??'')))item.imageUrl??=attr('url')!;
  if(path.length!==depth+1)return;
  if(tag.local==='link'){
   const attr=(name:string)=>Object.values(tag.attributes).find(attribute=>attribute.local===name)?.value;
   const href=attr('href'),rel=attr('rel');if(href&&(!rel||rel==='alternate'))item.link=href;
  }
 });
 const content=(text:string)=>{if(item&&path.length>=depth+1&&['title','link','guid','id','pubDate','published','updated','description','summary','content','credit'].includes(path[depth])){const key=path[depth];item[key]=(item[key]??'')+text}};
 parser.on('text',content);parser.on('cdata',content);
 parser.on('closetag',()=>{
  if(item&&path.length===depth){
   const title=titleText(item.title??''),url=articleUrl(item.link??item.id??item.guid??'');
   if(title&&title.length<=20000&&url&&!seen.has(url)){
    const value=item.published||item.pubDate||item.updated,date=value?Date.parse(value):NaN;
    const description=descriptionText(item.description||item.summary||item.content||''),imageCredit=titleText(item.credit??'').slice(0,1000);
    entries.push({id:hash(`${source}:${url||item.id||item.guid}`),title,source,url,publishedAt:Number.isFinite(date)?new Date(date).toISOString():null,...(description?{description}:{}),...(item.imageUrl?{imageUrl:item.imageUrl}:{}),...(imageCredit?{imageCredit}:{})});seen.add(url);
   }
   item=null;
  }
  path.pop();
 });
 parser.write(xml).close();
 if(root!=='rss'&&root!=='feed')throw Error('unsupported-feed');
 return entries;
}
export class NewsAdapter{
 private readonly now:()=>number;
 private readonly pending=new Map<NewsSource,Promise<ExternalSnapshot|null>>();
 private readonly memory=new Map<NewsSource,ExternalSnapshot>();
 private readonly attempted=new Map<NewsSource,number>();
 private readonly controllers=new Set<AbortController>();
 private disposed=false;
 constructor(private readonly dependencies:NewsDependencies){this.now=dependencies.now??Date.now}
 async load(sources:NewsSource[]):Promise<ExternalReply>{
  if(this.disposed)return{snapshot:null,status:'unavailable'};
  const unique=currentNewsSources(sources);
  if(!unique.length)return{snapshot:null,status:'empty'};
  const snapshots=await Promise.all(unique.map(source=>this.source(source)));
  if(this.disposed)return{snapshot:null,status:'unavailable'};
  const valid=snapshots.filter((snapshot):snapshot is ExternalSnapshot=>snapshot!==null),entries=valid.flatMap(snapshot=>snapshot.payload.kind==='news'?snapshot.payload.entries.filter(isCurrentNewsEntry):[]);
  const seen=new Set<string>(),merged=entries.sort((a,b)=>(Date.parse(b.publishedAt??'')||0)-(Date.parse(a.publishedAt??'')||0)).filter(entry=>{if(seen.has(entry.url))return false;seen.add(entry.url);return true}).slice(0,10);
  if(!valid.length)return{snapshot:null,status:'unavailable'};
  const stale=valid.length<unique.length||valid.some(snapshot=>snapshot.stale),payload={kind:'news' as const,entries:merged};
  return{snapshot:{version:1,key:`news:${unique.slice().sort().join(',')}`,revision:hash(JSON.stringify(payload)),fetchedAt:Math.min(...valid.map(snapshot=>snapshot.fetchedAt)),stale,payload},status:!merged.length?'empty':stale?'stale':'ready'};
 }
 private source(source:NewsSource):Promise<ExternalSnapshot|null>{
  const pending=this.pending.get(source);if(pending)return pending;
  const work=this.loadSource(source).finally(()=>{this.pending.delete(source)});this.pending.set(source,work);return work;
 }
 private async loadSource(source:NewsSource):Promise<ExternalSnapshot|null>{
  const key=`news:${source}`,persisted=await this.dependencies.cache.read(key,86400000).catch(()=>null),cached=this.memory.get(source)??persisted,now=this.now();
  if(this.disposed)return null;
  const valid=cached&&now-cached.fetchedAt<=86400000&&cached.fetchedAt<=now+60000?cached:null;
  if(!valid)this.memory.delete(source);
  if(valid&&now-valid.fetchedAt<300000)return structuredClone({...valid,stale:false});
  if(this.attempted.has(source)&&now-this.attempted.get(source)!<300000)return valid?structuredClone({...valid,stale:true}):null;
  this.attempted.set(source,now);
  const controller=new AbortController();this.controllers.add(controller);
  try{
   const parsed=parseNews(await this.dependencies.fetchText(NEWS_FEEDS[source],controller.signal),source);
   const newest=parsed.filter(isCurrentNewsEntry).sort((a,b)=>(Date.parse(b.publishedAt??'')||0)-(Date.parse(a.publishedAt??'')||0)).slice(0,10);
   const entries=await Promise.all(newest.map(async({imageUrl,...entry})=>{
    if(!imageUrl||!newest.some(value=>value.id===entry.id)||this.disposed||controller.signal.aborted)return entry;
    const image=await this.dependencies.loadImage?.(source,imageUrl,controller.signal).catch(()=>null);
    return image?{...entry,imageDataUrl:image}:entry;
   }));
   if(this.disposed)return null;
   const payload={kind:'news' as const,entries},snapshot:ExternalSnapshot={version:1,key,revision:hash(JSON.stringify(payload)),fetchedAt:this.now(),stale:false,payload};
   this.memory.set(source,snapshot);await this.dependencies.cache.write(snapshot).catch(()=>{});return structuredClone(snapshot);
  }catch{return valid?structuredClone({...valid,stale:true}):null}finally{this.controllers.delete(controller)}
 }
 dispose(){this.disposed=true;for(const controller of this.controllers)controller.abort();this.controllers.clear();this.memory.clear();this.attempted.clear()}
}
