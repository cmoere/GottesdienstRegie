import {useLayoutEffect,useRef,useState} from 'react';
import {SlideRenderer,elementStyle} from './SlideRenderer';
import type {LyricScrollPacket} from './lyricScrolling';
import {usePreferences} from './preferences';
import {TransitionStage,resolveTransition} from './transitions';
import './lyric-scrolling.css';

/** Rendering only: the live controller supplies currentId; there is no navigation queue. */
export function LyricScrollRenderer({packet,live=false}:{packet:LyricScrollPacket;live?:boolean}) {
  const index=packet.slides.findIndex(slide=>slide.id===packet.currentId),slide=packet.slides[index];
  const text=slide?.elements.find(element=>element.type==='text'&&element.visible);
  const container=useRef<HTMLDivElement>(null),stream=useRef<HTMLDivElement>(null);
  const [layout,setLayout]=useState({offset:0,height:0,ready:false});
  const reduce=usePreferences(state=>state.reduceMotion);
  const previous=useRef<{itemId:string;index:number}|undefined>(undefined);
  const [animate,setAnimate]=useState(false);
  const signature=JSON.stringify(packet.slides.map(page=>[page.id,page.body]));
  useLayoutEffect(()=>{
    const old=previous.current;
    setAnimate(!!old&&old.itemId===packet.itemId&&Math.abs(old.index-index)===1&&!reduce&&!matchMedia('(prefers-reduced-motion: reduce)').matches);
    previous.current={itemId:packet.itemId,index};
  },[packet.itemId,index,reduce]);
  useLayoutEffect(()=>{
    const host=container.current,list=stream.current;
    if(!host||!list)return;
    const measure=()=>{
      const block=list.children[index] as HTMLElement|undefined;
      if(!block)return;
      const line=parseFloat(getComputedStyle(block).lineHeight)||1;
      // Clip the viewport on a complete baseline; upcoming text never overlaps current text.
      const free=Math.max(0,host.clientHeight-(block.scrollHeight-line));
      const anchor=text?.properties.verticalAlign==='bottom'?free:text?.properties.verticalAlign==='center'?free/2:0;
      setLayout(previous=>{const next={offset:block.offsetTop-anchor,height:Math.floor(host.clientHeight/line)*line,ready:true};return JSON.stringify(previous)===JSON.stringify(next)?previous:next});
    };
    measure();const observer=new ResizeObserver(measure);observer.observe(host);observer.observe(list);
    let alive=true;void document.fonts.ready.then(()=>{if(alive)measure()});
    return()=>{alive=false;observer.disconnect()};
  },[signature,index,text?.width,text?.height,JSON.stringify(text?.properties)]);
  if(!slide)return null;
  if(!text)return <SlideRenderer slide={slide} mode={live?'live':'preview'}/>;
  const style=elementStyle(text),duration=animate?packet.settings.durationMs:0;
  const background={...slide,elements:slide.elements.map(element=>element.id===text.id?{...element,id:'lyrics-placeholder',properties:{...element.properties,text:''}}:element)};
  background.id=`${packet.itemId}:background:${JSON.stringify([slide.background,slide.backgroundImage,slide.backgroundFit,slide.backgroundPositionX,slide.backgroundPositionY,slide.backgroundBlur,slide.backgroundRotation,background.elements])}`;
  return <div className="lyric-scroll-output">
    <TransitionStage slide={background} transition={resolveTransition(slide)} role={live?'main':'operator'}/>
    <div ref={container} className="lyric-scroll-viewport" style={{...style,position:'absolute',overflow:'hidden',display:'block',boxSizing:'border-box'}}>
      <div style={{height:layout.height||'100%',overflow:'hidden'}}>
        <div ref={stream} style={{transform:`translate3d(0,${-layout.offset}px,0)`,transition:`transform ${duration}ms ease-in-out`,visibility:layout.ready?'visible':'hidden',willChange:'transform'}}>
          {packet.slides.map((page,position)=><div key={page.id} style={{whiteSpace:'pre-wrap',overflowWrap:'break-word',paddingBottom:page.body.trim()?`${Number(text.properties.lineHeight??1.15)}em`:0,opacity:position===index?1:position>index&&position<=index+packet.settings.upcomingBlocks?packet.settings.upcomingOpacity:0,transition:`opacity ${duration}ms ease-in-out`}}>{page.body}</div>)}
        </div>
      </div>
    </div>
  </div>;
}
