import {useI18n} from './i18n';
import {useEffect,useRef,useState,type ReactNode} from 'react';
const widthKey='gottesdienstregie.ui.serviceSidebarWidth';
export const sidebarWidth=(requested:number,viewport:number)=>Math.min(Math.floor(viewport*.15),Math.max(144,Number.isFinite(requested)?requested:258));
export function ResizableServiceSidebar({children}:{children:ReactNode}){
 const {tx}=useI18n();
 const root=useRef<HTMLDivElement>(null),pointer=useRef<number|null>(null);
 const [viewport,setViewport]=useState(window.innerWidth);
 const [requested,setRequested]=useState(()=>{try{return Number(localStorage.getItem(widthKey))||258}catch{return 258}});
 const width=sidebarWidth(requested,viewport),desktop=viewport>=1100;
 useEffect(()=>{const resize=()=>setViewport(window.innerWidth);window.addEventListener('resize',resize);resize();return()=>window.removeEventListener('resize',resize)},[]);
 useEffect(()=>{
  const app=root.current?.closest<HTMLElement>('.production-app');if(!app||!desktop)return;
  const previous=app.style.getPropertyValue('--service-sidebar-width');app.style.setProperty('--service-sidebar-width',`${width}px`);
  return()=>{if(previous)app.style.setProperty('--service-sidebar-width',previous);else app.style.removeProperty('--service-sidebar-width')};
 },[width,desktop]);
 const update=(next:number)=>{const value=sidebarWidth(next,window.innerWidth);setRequested(value);try{localStorage.setItem(widthKey,String(value))}catch{/* personal storage may be unavailable */}};
 return <div ref={root} className="service-sidebar-shell" style={desktop?{width}:undefined}>
  {children}
  {desktop&&<div className="service-sidebar-resize" role="separator" tabIndex={0} aria-label={tx("Ablaufbreite")} aria-orientation="vertical" aria-valuemin={Math.min(144,Math.floor(viewport*.15))} aria-valuemax={Math.floor(viewport*.15)} aria-valuenow={width}
   onPointerDown={event=>{if(event.button!==0)return;event.preventDefault();pointer.current=event.pointerId;event.currentTarget.setPointerCapture(event.pointerId)}}
   onPointerMove={event=>{if(pointer.current===event.pointerId&&root.current)update(event.clientX-root.current.getBoundingClientRect().left)}}
   onPointerUp={event=>{if(pointer.current!==event.pointerId)return;pointer.current=null;event.currentTarget.releasePointerCapture(event.pointerId)}}
   onPointerCancel={()=>{pointer.current=null}} onLostPointerCapture={()=>{pointer.current=null}}
   onKeyDown={event=>{if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight'&&event.key!=='Home'&&event.key!=='End')return;event.preventDefault();update(event.key==='Home'?144:event.key==='End'?viewport*.15:width+(event.key==='ArrowRight'?16:-16))}}/ >}
 </div>
}
