import type {ExternalReply,ExternalRequest} from '../../shared/externalLoop';
import {NewsAdapter,type NewsDependencies} from './news';
import {ExternalCache} from './cache';
import {fetchBounded} from './http';
export class ExternalLoopService{
 private readonly news:NewsAdapter;
 private disposed=false;
 constructor(options:{cacheDirectory:string|null;fetchText?:NewsDependencies['fetchText'];now?:()=>number}){
  this.news=new NewsAdapter({fetchText:options.fetchText??fetchBounded,cache:new ExternalCache(options.cacheDirectory,options.now),now:options.now});
 }
 async read(request:ExternalRequest):Promise<ExternalReply>{
  if(this.disposed)return{snapshot:null,status:'unavailable'};
  return request.kind==='news'?this.news.load(request.sources):{snapshot:null,status:'unavailable'};
 }
 dispose(){this.disposed=true;this.news.dispose()}
}
