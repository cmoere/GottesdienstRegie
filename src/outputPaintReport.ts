import {useLayoutEffect} from 'react';
import type {OutputDelivery,OutputPaintReceipt} from '../shared/outputTiming';
export type PendingOutputPaint={slide:unknown;delivery:OutputDelivery;receivedAtMs:number};
export function useOutputPaintReport(shown:unknown,pending:PendingOutputPaint|null,report:(receipt:OutputPaintReceipt)=>void){
 useLayoutEffect(()=>{
  if(!pending||shown!==pending.slide)return;
  let frame=0,disposed=false;
  frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(()=>{if(!disposed)report({revision:pending.delivery.revision,receivedAtMs:pending.receivedAtMs,paintedAtMs:Date.now()})})});
  return()=>{disposed=true;cancelAnimationFrame(frame)};
 },[shown,pending,report]);
}
