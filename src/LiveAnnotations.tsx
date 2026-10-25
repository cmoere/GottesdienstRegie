import {useEffect,useRef} from 'react';
import {create} from 'zustand';
import {usePresentation} from './store';
import {readAnnotationStroke,type AnnotationState} from '../shared/liveAnnotations';
export const useLiveAnnotations=create<{state:AnnotationState|null}>(()=>({state:null}));
export function annotationTakeId(state:{onAir:boolean;liveSlideId:string;liveTakenAtMs?:number}){return state.onAir&&state.liveSlideId?`${state.liveSlideId}:${state.liveTakenAtMs??0}`:''}
export function LiveAnnotationsController({quickActive=false}:{quickActive?:boolean}){
 const quick=useRef(quickActive);quick.current=quickActive;
 useEffect(()=>{if(quickActive){useLiveAnnotations.setState({state:null});void window.desktop?.sendAnnotations?.(null)}},[quickActive]);
 useEffect(()=>{
  let takeId=annotationTakeId(usePresentation.getState()),revision=0;
  const publish=(state:AnnotationState|null)=>{useLiveAnnotations.setState({state});void window.desktop?.sendAnnotations?.(state)};
  const offState=usePresentation.subscribe(state=>{const next=annotationTakeId(state);if(next!==takeId){takeId=next;publish(null)}});
  const offRemote=(window.desktop as any)?.remote?.onCommand((payload:any)=>{
   if(payload.action==='annotation-clear'){publish(null);return}
   if(payload.action!=='annotate'||!takeId||payload.takeId!==takeId||quick.current)return;
   const stroke=readAnnotationStroke(payload.stroke);if(!stroke)return;
   const current=useLiveAnnotations.getState().state,strokes=current?.takeId===takeId?current.strokes:[];
   if(strokes.length>=40||strokes.some(item=>item.id===stroke.id))return;
   publish({revision:++revision,takeId,strokes:[...strokes,stroke]});
  });
  publish(null);
  return()=>{offState();offRemote?.();publish(null)};
 },[]);return null;
}
export function LiveAnnotationOverlay({state}:{state:AnnotationState|null}){
 if(!state?.strokes.length)return null;
 return <svg className="live-annotation-overlay" viewBox="0 0 1920 1080" preserveAspectRatio="none" aria-label="Live-Markierungen" style={{position:'absolute',inset:0,width:'100%',height:'100%',zIndex:20,pointerEvents:'none'}}>
  {state.strokes.map(stroke=><polyline key={stroke.id} points={stroke.points.map(point=>`${point.x*1920},${point.y*1080}`).join(' ')} fill="none" stroke={stroke.color} strokeWidth={stroke.width*1920} strokeLinecap="round" strokeLinejoin="round"/>)}
 </svg>;
}
