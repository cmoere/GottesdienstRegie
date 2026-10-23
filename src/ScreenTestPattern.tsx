import {useEffect,useRef} from 'react';
import type {ScreenTestPatternId,ScreenTestReceipt} from './screenTest';
import {screenTestPatterns} from './screenTest';
import {observeScreenTestPattern,screenTestRects} from './screenTestCanvas';
export function ScreenTestPattern({pattern:requested='bars',runId,onResult}:{pattern?:ScreenTestPatternId;runId?:string;onResult?:(result:ScreenTestReceipt)=>void}){
 const pattern=screenTestPatterns.some(p=>p.id===requested)?requested:'bars';
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{if(canvas.current&&runId&&onResult)return observeScreenTestPattern(canvas.current,{runId,pattern},onResult)},[pattern,runId,onResult]);
 const label=screenTestPatterns.find(p=>p.id===pattern)?.label??'Farbbalken';
 return runId&&onResult?<canvas ref={canvas} className="screen-test-pattern" aria-label={`Bildschirmtest: ${label}`}/>:<svg className="screen-test-pattern" viewBox="0 0 1920 1080" preserveAspectRatio="none" role="img" aria-label={`Bildschirmtest: ${label}`}>{screenTestRects(pattern).map((r,i)=><rect key={i} x={r.x} y={r.y} width={r.width} height={r.height} fill={r.color}/>)}</svg>;
}
