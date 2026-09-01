import type { CSSProperties } from 'react';
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

function RenderElement({element,mode}:{element:SlideElement;mode:SlideRendererMode}){
  if(!element.visible)return null;
  const style=elementStyle(element),properties=element.properties,src=String(properties.src??properties.url??'');
  if(element.type==='image'&&src)return <img className="slide-renderer-element media" style={style} src={src} alt="" loading={mode==='thumbnail'?'lazy':'eager'}/>;
  if(element.type==='video'&&src)return <video className="slide-renderer-element media" style={style} src={src} autoPlay={mode==='live'&&properties.autoplay!==false} loop={properties.loop===true} muted={properties.muted===true||mode==='thumbnail'} controls={mode==='editor'||mode==='preview'} playsInline preload={mode==='thumbnail'?'none':'metadata'}/>;
  if(element.type==='web'&&src)return mode==='thumbnail'?<div className="slide-renderer-element web-placeholder" style={style}>WEB</div>:<iframe className="slide-renderer-element web" style={{...style,zoom:`${Number(properties.zoom??100)}%`}} src={src} title="Web content" allow="autoplay; fullscreen; picture-in-picture" sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-popups"/>;
  if(element.type==='shape')return <div className="slide-renderer-element shape" style={{...style,background:String(properties.fill??properties.color??'#fff')}}/>;
  if(element.type==='line')return <div className="slide-renderer-element line" style={{...style,background:String(properties.color??'#fff'),height:`${Math.max(1,Number(properties.strokeWidth??4))/19.2}cqw`}}/>;
  if(element.type==='qr')return <div className="slide-renderer-element qr" style={style}>{String(properties.text??properties.value??'QR')}</div>;
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
