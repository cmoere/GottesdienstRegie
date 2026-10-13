import {useCallback,useEffect,useRef,useState} from 'react';
import type {Slide} from './store';
export type ScheduledOutputSlide=Slide&{_presentAtMs?:number};
export function outputPresentationDelay(value:ScheduledOutputSlide|null,now=Date.now()){
 const deadline=value?._presentAtMs;
 if(typeof deadline!=='number'||!Number.isFinite(deadline))return 0;
 const delay=deadline-now;return delay>0&&delay<=1000?delay:0;
}
export function useScheduledOutputSlide(){
 const [slide,setSlide]=useState<Slide|null>(null),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const schedule=useCallback((value:Slide|null)=>{
  clearTimeout(timer.current);const delay=outputPresentationDelay(value);
  if(!delay){setSlide(value);return}
  timer.current=setTimeout(()=>setSlide(value),delay);
 },[]);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 return [slide,schedule] as const;
}
