import type {ExternalReply,ExternalRequest} from '../../shared/externalLoop';
import {NewsAdapter,type NewsDependencies} from './news';
import {ExternalCache} from './cache';
import {fetchBounded} from './http';
import {FootballAdapter} from './football';
import {createPreparedImageLoader} from './newsImages';
import {WeatherAdapter} from './weather';
export class ExternalLoopService{
 private readonly news:NewsAdapter;
 private readonly football:FootballAdapter;
 private readonly weather:WeatherAdapter;
 private disposed=false;
 constructor(options:{cacheDirectory:string|null;fetchText?:NewsDependencies['fetchText'];now?:()=>number}){
  const dependencies={fetchText:options.fetchText??fetchBounded,cache:new ExternalCache(options.cacheDirectory,options.now),now:options.now,loadImage:createPreparedImageLoader()};
  this.news=new NewsAdapter(dependencies);this.football=new FootballAdapter(dependencies);this.weather=new WeatherAdapter(dependencies);
 }
 async read(request:ExternalRequest):Promise<ExternalReply>{
  if(this.disposed)return{snapshot:null,status:'unavailable'};
  return request.kind==='weather'?this.weather.load(request):request.kind==='news'?this.news.load(request.sources):this.football.load(request);
 }
 searchWeatherLocations(query:string){return this.weather.search(query)}
 dispose(){this.disposed=true;this.news.dispose();this.football.dispose();this.weather.dispose()}
}
