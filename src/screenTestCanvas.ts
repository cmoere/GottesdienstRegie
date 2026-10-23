import type {ScreenTestPatternId,ScreenTestReceipt} from './screenTest';
const colors:Record<string,string[]>={bars:['#ffffff','#ffff00','#00ffff','#00ff00','#ff00ff','#ff0000','#0000ff','#000000'],grayscale:['#000000','#242424','#494949','#6d6d6d','#929292','#b6b6b6','#dbdbdb','#ffffff'],white:['#ffffff'],black:['#000000'],red:['#ff0000'],green:['#00ff00'],blue:['#0000ff']};
export type PatternRect={x:number;y:number;width:number;height:number;color:string};
export function screenTestRects(pattern:ScreenTestPatternId):PatternRect[]{
 if(pattern==='grid')return [{x:0,y:0,width:1920,height:1080,color:'#000000'},...[0,160,320,480,640,800,960,1120,1280,1440,1600,1760,1916].map(x=>({x,y:0,width:4,height:1080,color:'#ffffff'})),...[0,90,180,270,360,450,540,630,720,810,900,990,1076].map(y=>({x:0,y,width:1920,height:4,color:'#ffffff'}))];
 const palette=colors[pattern];return palette.map((color,i)=>({x:i*1920/palette.length,y:0,width:1920/palette.length,height:1080,color}));
}
function verify(context:CanvasRenderingContext2D,pattern:ScreenTestPatternId){
 const samples=pattern==='grid'?[{x:10,y:10,color:'#000000'},{x:0,y:0,color:'#ffffff'},{x:960,y:540,color:'#ffffff'}]:colors[pattern].map((color,i,a)=>({x:Math.floor((i+.5)*1920/a.length),y:540,color}));
 return samples.every(({x,y,color})=>{const actual=context.getImageData(x,y,1,1).data,expected=[parseInt(color.slice(1,3),16),parseInt(color.slice(3,5),16),parseInt(color.slice(5,7),16),255];return expected.every((v,i)=>Math.abs(actual[i]-v)<=2)});
}
// This verifies the MAIN canvas backing pixels and stable renderer geometry,
// NOT physical scanout, cable quality, projector focus or perceived colors.
export function observeScreenTestPattern(canvas:HTMLCanvasElement,test:{runId:string;pattern:ScreenTestPatternId},report:(receipt:ScreenTestReceipt)=>void){
 let stopped=false,frame=0,frames=0,start=performance.now(),lastSize='',stableSince=start;
 const finish=(ok:boolean,width:number,height:number,reason?:ScreenTestReceipt['reason'])=>{if(stopped)return;stopped=true;report({...test,ok,width,height,frames,elapsedMs:performance.now()-start,...(reason?{reason}:{})})};
 try{
  canvas.width=1920;canvas.height=1080;
  const context=canvas.getContext('2d',{willReadFrequently:true});
  if(!context){finish(false,0,0,'canvas-unavailable');return()=>{stopped=true}}
  for(const rect of screenTestRects(test.pattern)){context.fillStyle=rect.color;context.fillRect(rect.x,rect.y,rect.width,rect.height)}
  const sample=()=>{
   if(stopped)return;
   const bounds=canvas.getBoundingClientRect(),width=Math.round(bounds.width),height=Math.round(bounds.height),now=performance.now(),size=`${width}x${height}`;
   if(size!==lastSize){lastSize=size;stableSince=now;frames=0}
   frames++;
   if(width>0&&height>0&&frames>=12&&now-stableSince>=1000){
    try{const ok=verify(context,test.pattern);finish(ok,width,height,ok?undefined:'pattern-mismatch')}catch{finish(false,width,height,'canvas-unavailable')}
   }else frame=requestAnimationFrame(sample);
  };
  frame=requestAnimationFrame(sample);
 }catch{finish(false,0,0,'canvas-unavailable')}
 return()=>{stopped=true;cancelAnimationFrame(frame)};
}
