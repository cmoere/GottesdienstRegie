import {useEffect,useRef,useId} from 'react';
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
 const prefix=useId().replace(/:/g,'');
 if(!state?.strokes.length)return null;
 return <svg className="live-annotation-overlay" viewBox="0 0 1920 1080" preserveAspectRatio="none" aria-label="Live-Markierungen" style={{position:'absolute',inset:0,width:'100%',height:'100%',zIndex:20,pointerEvents:'none'}}>
  {state.strokes.map(stroke=>{const a=stroke.points[0],b=stroke.points.at(-1)!,x=a.x*1920,y=a.y*1080,x2=b.x*1920,y2=b.y*1080,width=stroke.width*1920,head=Math.max(14,width*3),id=prefix+'-arrow-'+stroke.id,props={fill:'none',stroke:stroke.color,strokeWidth:width,strokeLinecap:'round' as const,strokeLinejoin:'round' as const};
   if(stroke.tool==='rectangle')return <rect key={stroke.id} x={Math.min(x,x2)} y={Math.min(y,y2)} width={Math.abs(x2-x)} height={Math.abs(y2-y)} {...props}/>;
   if(stroke.tool==='ellipse')return <ellipse key={stroke.id} cx={(x+x2)/2} cy={(y+y2)/2} rx={Math.abs(x2-x)/2} ry={Math.abs(y2-y)/2} {...props}/>;
   if(stroke.tool==='line'||stroke.tool==='arrow')return <g key={stroke.id}>{stroke.tool==='arrow'&&<defs><marker id={id} markerUnits="userSpaceOnUse" markerWidth={head} markerHeight={head} viewBox="0 -12 24 24" refX="24" refY="0" orient="auto"><path d="M3.215 -12L24 0L3.215 12" fill="none" stroke={stroke.color} strokeWidth={width*24/head}/></marker></defs>}<line x1={x} y1={y} x2={x2} y2={y2} markerEnd={stroke.tool==='arrow'?'url(#'+id+')':undefined} {...props}/></g>;
   return <polyline key={stroke.id} points={stroke.points.map(point=>point.x*1920+','+point.y*1080).join(' ')} {...props}/>;
  })}
 </svg>;
}
