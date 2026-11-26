import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import mainSource from '../../src/main.tsx?raw';
import '../../src/version41.css';import '../../src/version42.css';
import {ShapeGallery} from '../../src/ShapeGallery';
import {ColorSelection} from '../../src/ColorSelection';
import {SlideRenderer} from '../../src/SlideRenderer';
import {shapeCatalog,shapeGeometry} from '../../src/shapeCatalog';
import {createServiceItem} from '../../src/store';
import {usePreferences} from '../../src/preferences';
import type {ColorValue} from '../../src/colorModel';
function Demo(){
 const [kind,setKind]=useState('solid-prism-4'),[paint,setPaint]=useState<ColorValue>({color:'#699f3e',opacity:1,mode:'solid',end:'#608f9a',angle:90});
 const slide=createServiceItem('content').slides[0];slide.background='#203342';slide.elements=[{id:'object-demo',name:kind,type:'shape',x:300,y:80,width:1320,height:920,rotation:0,opacity:1,visible:true,locked:false,zIndex:1,properties:{shapeKind:kind,fill:paint.color,fillMode:paint.mode,fillOpacity:paint.opacity,fillGradientEnd:paint.end,fillGradientAngle:paint.angle,stroke:'#b6bec3',strokeWidth:1}}];
 return <main><h1>Objekte und Farben</h1><div className="demo-controls"><ShapeGallery onSelect={setKind}/><ColorSelection label="Füllung" value={paint.color} opacity={paint.opacity} mode={paint.mode} end={paint.end} angle={paint.angle} onChange={setPaint} allowGradient/></div><div className="demo-output"><SlideRenderer slide={slide} mode="thumbnail"/></div><p>{kind}</p></main>;
}
async function start(){
 await Promise.all([...mainSource.matchAll(/import '\.\/([^']+\.css)'/g)].map(match=>new Promise<void>((resolve,reject)=>{const link=document.createElement('link');link.rel='stylesheet';link.href='/src/'+match[1];link.onload=()=>resolve();link.onerror=reject;document.head.append(link)})));
 usePreferences.setState({language:'de',germanRegion:null});document.documentElement.dataset.theme='dark';
 const style=document.createElement('style');style.textContent='body{margin:0;padding:24px;background:#17212a;color:#eef3f5}html[data-theme=light] body{background:#f4f6f7;color:#172b36}.demo-controls{display:flex;gap:20px;margin:20px 0}.demo-output{width:min(900px,100%);height:450px}';document.head.append(style);
 (window as any).objectLibraryProbe={catalog:shapeCatalog,geometry:shapeGeometry};createRoot(document.getElementById('root')!).render(<Demo/>);
}start();
