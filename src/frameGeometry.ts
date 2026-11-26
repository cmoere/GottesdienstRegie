import {extendedFramePath} from './objectGeometry';
/** Width is expressed in the shape's 100-unit coordinate system. */
export function frameThickness(kind:string,value?:unknown):number{
 const fallback=kind==='frame-double'?15:kind==='frame-corners'?6:8;
 return typeof value==='number'&&Number.isFinite(value)?Math.min(24,Math.max(1,value)):fallback;
}
const rect=(inset:number)=>`M${inset} ${inset}H${100-inset}V${100-inset}H${inset}Z`;
const circle=(radius:number)=>`M50 ${50-radius}a${radius} ${radius} 0 1 0 0 ${2*radius} ${radius} ${radius} 0 1 0 0 ${-2*radius}Z`;
function rounded(inset:number,radius:number){
 const a=inset,b=100-inset,r=radius;
 return `M${a+r} ${a}H${b-r}Q${b} ${a} ${b} ${a+r}V${b-r}Q${b} ${b} ${b-r} ${b}H${a+r}Q${a} ${b} ${a} ${b-r}V${a+r}Q${a} ${a} ${a+r} ${a}Z`;
}
function polygon(points:number[][],inset=0){
 const scale=(44-inset)/44;
 return points.map(([x,y],i)=>`${i?'L':'M'}${50+(x-50)*scale} ${50+(y-50)*scale}`).join(' ')+'Z';
}
export function framePath(kind:string,value?:unknown):string|undefined{
 const t=frameThickness(kind,value),inner=6+t;
 if(kind==='frame-rectangle')return rect(6)+' '+rect(inner);
 if(kind==='frame-rounded')return rounded(6,16)+' '+rounded(inner,Math.max(0,16-t));
 if(kind==='frame-oval')return circle(44)+' '+circle(44-t);
 if(kind==='frame-double')return rect(6)+' '+rect(6+t*4/15)+' '+rect(6+t*11/15)+' '+rect(6+t);
 if(kind==='frame-corners')return `M6 32V6h26v${t}H${6+t}V32Z M68 6h26v26h${-t}V${6+t}H68Z M94 68v26H68v${-t}h${26-t}V68Z M32 94H6V68h${t}v${26-t}h${26-t}Z`;
 if(kind==='frame-brackets')return `M30 6H6v88h24v${-t}H${6+t}V${6+t}H30Z M70 6h24v88H70v${-t}h${24-t}V${6+t}H70Z`;
 const points:Record<string,number[][]>={
  'frame-hexagon':[[28,6],[72,6],[94,50],[72,94],[28,94],[6,50]],
  'frame-diamond':[[50,6],[94,50],[50,94],[6,50]],
  'frame-triangle':[[50,6],[94,94],[6,94]],
  'frame-octagon':[[32,6],[68,6],[94,32],[94,68],[68,94],[32,94],[6,68],[6,32]],
 };
 return Object.hasOwn(points,kind)?polygon(points[kind])+' '+polygon(points[kind],t):extendedFramePath(kind,t);
}
