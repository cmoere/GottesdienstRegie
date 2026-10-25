import {useEffect} from 'react';
import {usePresentation} from '../store';
import {adSelectionForItem,isAdvertising,advertisingRuntime,advertisingSlide} from './model';
import {readAdCampaign} from '../../shared/advertising';
export function AdvertisingController(){
 useEffect(()=>{
  let disposed=false,lastAir=usePresentation.getState().onAir;const fetched=new Map<string,number>(),pending=new Set<string>(),prepared=new Map<string,string>();
  const tick=()=>{
   if(disposed)return;const state=usePresentation.getState();if(!state.onAir&&lastAir)advertisingRuntime.reset();lastAir=state.onAir;
   for(const item of state.items){if(!isAdvertising(item)||!item.enabled)continue;const settings=adSelectionForItem(item);if(!settings?.source)continue;const key=JSON.stringify(settings.source),next=prepared.get(key);
    if(next&&(!state.onAir||state.liveItemId!==item.id)&&item.metadata.advertisingCreativesJson!==next){state.updateItem(item.id,{metadata:{...item.metadata,advertisingCreativesJson:next},slides:item.slides.map((slide,index)=>index===0?advertisingSlide(slide,JSON.parse(next)[0]):slide)});continue}
    if(pending.has(key)||Date.now()-(fetched.get(key)??0)<300000)continue;pending.add(key);fetched.set(key,Date.now());
    const bridge=(window.desktop as any)?.advertising;if(!bridge){pending.delete(key);continue}
    void bridge.read(settings.source).then((value:unknown)=>{if(disposed)return;const campaign=readAdCampaign(value);prepared.set(key,JSON.stringify(campaign.creatives));tick()}).catch(()=>{}).finally(()=>pending.delete(key));
   }
  };
  const timer=setInterval(tick,5000),off=usePresentation.subscribe(tick);tick();return()=>{disposed=true;clearInterval(timer);off();advertisingRuntime.reset()};
 },[]);return null;
}
