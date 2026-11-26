import React from 'react';
import {createRoot} from 'react-dom/client';
import mainSource from '../../src/main.tsx?raw';
import '../../src/version41.css';
import '../../src/version42.css';
import {additionalShapes} from '../../src/additionalShapes';
import {shapeGeometry} from '../../src/shapeCatalog';
import {ShapeArtwork} from '../../src/ShapeArtwork';
import {ShapeGallery} from '../../src/ShapeGallery';
import {SlideRenderer} from '../../src/SlideRenderer';
import {createServiceItem} from '../../src/store';
import {usePreferences} from '../../src/preferences';

async function start(){
 await Promise.all([...mainSource.matchAll(/import '\.\/([^']+\.css)'/g)].map(match=>new Promise<void>((resolve,reject)=>{const link=document.createElement('link');link.rel='stylesheet';link.href='/src/'+match[1];link.onload=()=>resolve();link.onerror=reject;document.head.append(link)})));
 usePreferences.setState({language:'de',germanRegion:null});
 (window as any).shapeReview={path:(kind:string,width:number)=>shapeGeometry(kind,width).path};
 const style=document.createElement('style');style.textContent=`body{margin:0;padding:24px;background:var(--operator-bg,#18222c);color:var(--operator-text,#fff)}html[data-theme=light] body{background:#f4f6f7;color:#172b36}.shape-review-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-top:20px}.shape-review-card{padding:12px;border:1px solid #608f9a;border-radius:10px;min-width:0}.shape-review-card header{display:flex;gap:12px;align-items:center;min-height:40px;margin-bottom:8px}.shape-review-card header svg{width:30px;height:30px;fill:#699f3e}.shape-review-card .slide-renderer{width:100%;height:170px;aspect-ratio:16/9}.shape-gallery-popover{background:var(--operator-panel,#fff);color:var(--operator-text,#18222c)}@media(max-width:800px){.shape-review-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}`;document.head.append(style);
 createRoot(document.getElementById('root')!).render(<main><h1>Formen, Rahmen und Banner</h1><ShapeGallery onSelect={(kind)=>{document.body.dataset.selected=kind}}/><div className="shape-review-grid">{additionalShapes.map(shape=>{
  const slide=createServiceItem('content').slides[0];slide.background='#203342';
  slide.elements=[{id:shape.kind,name:shape.name,type:'shape',x:300,y:120,width:1320,height:840,rotation:0,opacity:1,visible:true,locked:false,zIndex:1,properties:{shapeKind:shape.kind,fill:'#699f3e',stroke:'#b6bec3',strokeWidth:1}}];
  return <article className="shape-review-card" data-kind={shape.kind} key={shape.kind}><header><ShapeArtwork kind={shape.kind}/><strong>{shape.name}</strong></header><SlideRenderer slide={slide} mode="thumbnail"/></article>;
 })}</div></main>);
}
start();
