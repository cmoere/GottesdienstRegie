import type {ServiceItem,Slide} from '../store';
import {readAdSelection,type AdCreative,type AdSelection} from '../../shared/advertising';
export const isAdvertising=(item:Pick<ServiceItem,'metadata'>|undefined|null)=>item?.metadata.externalAdvertising===true;
export function advertisingDurationMs(item:ServiceItem,slide:Slide|null|undefined,soleCandidate:boolean){const duration=(slide?.timing?.durationSeconds??15)*1000;return soleCandidate?Math.max(duration,(adSelectionForItem(item)?.intervalMinutes??5)*60000):duration}
export function adSelectionForItem(item:Pick<ServiceItem,'metadata'>):AdSelection|null{
 try{return readAdSelection({creatives:JSON.parse(String(item.metadata.advertisingCreativesJson??'')),source:item.metadata.advertisingSourceJson?JSON.parse(String(item.metadata.advertisingSourceJson)):undefined,intervalMinutes:Number(item.metadata.advertisingIntervalMinutes??5)})}catch{return null}
}
export function advertisingSlide(slide:Slide,creative:AdCreative):Slide{return{...structuredClone(slide),title:creative.title,body:'',background:'#000000',timing:{durationSeconds:creative.durationSeconds},elements:[{id:slide.id+'-ad',type:creative.kind,name:creative.title,x:0,y:0,width:1920,height:1080,rotation:0,opacity:1,locked:true,visible:true,zIndex:1,properties:{src:creative.url,fit:'contain',autoplay:creative.kind==='video',volume:100,loop:false,endBehavior:'hold'}}]}}
export class AdvertisingRuntime{
 private shown=new Map<string,number>();private indices=new Map<string,number>();private takeKey='';private frozen:Slide|null=null;
 eligible(item:ServiceItem,currentItemId:string,now:number){if(!isAdvertising(item))return true;if(!['pre','post'].includes(item.sectionId))return false;const settings=adSelectionForItem(item);return Boolean(settings&&(item.id===currentItemId||now-(this.shown.get(item.id)??-Infinity)>=settings.intervalMinutes*60000))}
 take(item:ServiceItem,slide:Slide,revision:number,now:number):Slide|null{
  const key=`${item.id}:${slide.id}:${revision}`;if(key===this.takeKey)return this.frozen;this.takeKey=key;this.frozen=null;const settings=adSelectionForItem(item);if(!settings||!['pre','post'].includes(item.sectionId))return null;
  const index=this.indices.get(item.id)??0,creative=settings.creatives[index%settings.creatives.length];this.indices.set(item.id,index+1);this.shown.set(item.id,now);this.frozen=advertisingSlide(slide,creative);return this.frozen;
 }
 reset(){this.shown.clear();this.indices.clear();this.takeKey='';this.frozen=null}
}
export const advertisingRuntime=new AdvertisingRuntime();
