import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Slide, SlideElement } from './store';

export type SlideRendererMode='editor'|'preview'|'thumbnail'|'live';

function elementStyle(element:SlideElement):CSSProperties{
  const value=element.properties;
  return {
    left:`${element.x/19.2}%`,top:`${element.y/10.8}%`,width:`${element.width/19.2}%`,height:`${element.height/10.8}%`,
    opacity:element.opacity,transform:`rotate(${element.rotation}deg)`,zIndex:element.zIndex,
    color:String(value.color??'#fff'),fontFamily:String(value.fontFamily??'Inter'),fontWeight:Number(value.fontWeight??400),
    fontSize:`${Number(value.fontSize??48)/19.2}cqw`,lineHeight:Number(value.lineHeight??1.15),letterSpacing:`${Number(value.letterSpacing??0)/19.2}cqw`,
    textAlign:(value.align??'center') as CSSProperties['textAlign'],padding:`${Number(value.padding??0)/19.2}cqw`,
    alignItems:value.verticalAlign==='top'?'flex-start':value.verticalAlign==='bottom'?'flex-end':'center'
  };
}

function LiveVideoInput({element,mode,style}:{element:SlideElement;mode:SlideRendererMode;style:CSSProperties}){const ref=useRef<HTMLVideoElement>(null),[error,setError]=useState(false),properties=element.properties;useEffect(()=>{if(mode==='thumbnail'||!properties.deviceId)return;let active=true,stream:MediaStream|undefined;void navigator.mediaDevices.getUserMedia({video:{deviceId:{exact:String(properties.deviceId)},width:{ideal:Number(properties.width??1920)},height:{ideal:Number(properties.height??1080)},frameRate:{ideal:Number(properties.frameRate??30)}},audio:properties.audioEnabled===true}).then(value=>{if(!active){value.getTracks().forEach(track=>track.stop());return}stream=value;if(ref.current){ref.current.srcObject=value;ref.current.volume=Number(properties.volume??100)/100;void ref.current.play()}setError(false)}).catch(()=>setError(true));return()=>{active=false;stream?.getTracks().forEach(track=>track.stop())}},[mode,properties.deviceId,properties.width,properties.height,properties.frameRate,properties.audioEnabled,properties.volume]);if(mode==='thumbnail')return <div className="slide-renderer-element web-placeholder" style={style}>LIVE</div>;return <div className="slide-renderer-element video-input-frame" style={{...style,overflow:'hidden',display:'grid',placeItems:'center',background:'#000'}}>{error?<strong>KEIN SIGNAL</strong>:<video ref={ref} autoPlay playsInline muted={mode!=='live'||properties.audioEnabled!==true} style={{width:'100%',height:'100%',objectFit:String(properties.fit??'contain') as CSSProperties['objectFit'],clipPath:`inset(${Number(properties.cropTop??0)}% ${Number(properties.cropRight??0)}% ${Number(properties.cropBottom??0)}% ${Number(properties.cropLeft??0)}%)`,filter:`brightness(${Number(properties.brightness??100)}%) contrast(${Number(properties.contrast??100)}%) saturate(${Number(properties.saturation??100)}%) hue-rotate(${Number(properties.hue??0)}deg)`}}/>}</div>}

function TimedText({element,mode,style}:{element:SlideElement;mode:SlideRendererMode;style:CSSProperties}){const duration=Math.max(0,Number(element.properties.timerDurationSeconds??0)),[left,setLeft]=useState(duration);useEffect(()=>{setLeft(duration);if(mode!=='live'||duration<=0)return;const started=Date.now(),timer=setInterval(()=>setLeft(Math.max(0,duration-Math.floor((Date.now()-started)/1000))),250);return()=>clearInterval(timer)},[duration,mode,element.id]);const value=left===0&&element.properties.timerEndText?String(element.properties.timerEndText):`${Math.floor(left/60).toString().padStart(2,'0')}:${(left%60).toString().padStart(2,'0')}`;return <div className="slide-renderer-element text timer-text" style={style}>{value}</div>}

function RenderElement({element,mode}:{element:SlideElement;mode:SlideRendererMode}){
  if(!element.visible)return null;
  const style=elementStyle(element),properties=element.properties,src=String(properties.src??properties.url??'');
  if(element.type==='image'&&src)return <img className="slide-renderer-element media" style={style} src={src} alt="" loading={mode==='thumbnail'?'lazy':'eager'}/>;
  if(element.type==='video'&&src)return <video className="slide-renderer-element media" style={style} src={src} autoPlay={mode==='live'&&properties.autoplay!==false} loop={properties.loop===true} muted={properties.muted===true||mode==='thumbnail'} controls={mode==='editor'||mode==='preview'} playsInline preload={mode==='thumbnail'?'none':'metadata'} onEnded={()=>{if(mode==='live')(window.desktop as any)?.notifyMediaEnded(String(properties.endBehavior??'nextSlide'))}}/>;
  if(element.type==='audio'&&src)return mode==='thumbnail'?<div className="slide-renderer-element web-placeholder" style={style}>AUDIO</div>:<audio className="slide-renderer-element audio-player" style={style} src={src} autoPlay={mode==='live'&&properties.autoplay!==false} loop={properties.loop===true} controls={mode==='editor'||mode==='preview'} preload="metadata" onEnded={()=>{if(mode==='live')(window.desktop as any)?.notifyMediaEnded(String(properties.endBehavior??'nextSlide'))}}/>;
  if(element.type==='videoInput')return <LiveVideoInput element={element} mode={mode} style={style}/>;
  if(element.type==='web'&&src)return mode==='thumbnail'?<div className="slide-renderer-element web-placeholder" style={style}>WEB</div>:<iframe className="slide-renderer-element web" style={{...style,zoom:`${Number(properties.zoom??100)}%`}} src={src} title="Web content" allow="autoplay; fullscreen; picture-in-picture" sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-popups"/>;
  if(element.type==='shape')return <div className="slide-renderer-element shape" style={{...style,background:String(properties.fill??properties.color??'#fff')}}/>;
  if(element.type==='line')return <div className="slide-renderer-element line" style={{...style,background:String(properties.color??'#fff'),height:`${Math.max(1,Number(properties.strokeWidth??4))/19.2}cqw`}}/>;
  if(element.type==='qr')return <div className="slide-renderer-element qr" style={style}>{String(properties.text??properties.value??'QR')}</div>;
  if(element.type==='text'&&Number(properties.timerDurationSeconds??0)>0)return <TimedText element={element} mode={mode} style={style}/>;
  return <div className="slide-renderer-element text" style={style}>{String(properties.text??'')}</div>;
}

export function SlideRenderer({slide,mode='preview'}:{slide:Slide;mode?:SlideRendererMode}){
  const hasVisibleElements=slide.elements?.some(element=>element.visible);
  return <div className={`slide-renderer ${mode}`} style={{background:slide.background}} data-slide-id={slide.id}>
    {hasVisibleElements
      ?slide.elements.slice().sort((a,b)=>a.zIndex-b.zIndex).map(element=><RenderElement key={element.id} element={element} mode={mode}/>)
      :<div className="slide-renderer-fallback"><strong>{slide.title}</strong><p>{slide.body}</p></div>}
  </div>;
}
