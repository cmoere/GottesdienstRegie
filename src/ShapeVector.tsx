import {useId,type CSSProperties} from 'react';
import type {ShapeDefinition} from './shapeCatalog';
import {alpha,readPaint,shadeColor} from './colorModel';
export function ShapePaths({shape,properties={},preview=false}:{shape:ShapeDefinition;properties?:Record<string,string|number|boolean>;preview?:boolean}){
 const id='object-paint-'+useId().replace(/[^a-zA-Z0-9_-]/g,''),paint=readPaint(properties),enabled=properties.fillEnabled!==false;
 const fill=preview?(shape.dimension==='3d'?'#608f9a':'currentColor'):!enabled?'none':paint.mode==='solid'?String(properties.fill??properties.color??'#fff'):`url(#${id})`;
 const angle=paint.angle*Math.PI/180,dx=Math.sin(angle)*.5,dy=-Math.cos(angle)*.5;
 const layers=shape.layers??(shape.parts??[shape.path]).map(path=>({path,shade:0}));
 return <>{!preview&&enabled&&paint.mode!=='solid'&&<defs>{paint.mode==='linear'?<linearGradient id={id} x1={.5-dx} y1={.5-dy} x2={.5+dx} y2={.5+dy}><stop offset="0" stopColor={paint.color}/><stop offset="1" stopColor={paint.end}/></linearGradient>:<radialGradient id={id}><stop offset="0" stopColor={paint.color}/><stop offset="1" stopColor={paint.end}/></radialGradient>}</defs>}{layers.map((layer,index)=><path key={index} d={layer.path} fill={enabled&&layer.shade?shadeColor(preview?'#608f9a':paint.color,layer.shade):fill} fillRule="evenodd" fillOpacity={preview?1:paint.opacity} stroke={preview?'none':String(properties.stroke??'none')} strokeOpacity={alpha(properties.strokeOpacity)} strokeWidth={preview?0:Math.max(0,Number(properties.strokeWidth??0))}/>)}</>;
}
export function ShapeVector({shape,properties,style,className}:{shape:ShapeDefinition;properties:Record<string,string|number|boolean>;style:CSSProperties;className:string}){return <svg className={className} style={{...style,overflow:'visible'}} viewBox={shape.viewBox} preserveAspectRatio={shape.dimension==='3d'?'xMidYMid meet':'none'} aria-hidden="true"><ShapePaths shape={shape} properties={properties}/></svg>}
