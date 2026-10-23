import React,{useState} from 'react';import{createRoot}from'react-dom/client';
import{TransitionStage}from'../../src/transitions';import{createServiceItem,type Slide}from'../../src/store';
import'../../src/styles.css';import'../../src/preview-workspace.css';
const make=(id:string,background:string,presentAtMs?:number)=>({...createServiceItem('content').slides[0],id,background,elements:[],_presentAtMs:presentAtMs}) as Slide;
function Probe(){const[slide,setSlide]=useState(make('old','#ff0000'));(window as any).transitionProbe={take:(at:number)=>setSlide(make('new','#0000ff',at))};return <TransitionStage slide={slide} transition={{type:'crossfade',durationMs:2000,direction:'left',easing:'linear',reverseOnPrevious:true}}/>}
createRoot(document.getElementById('root')!).render(<Probe/>);
