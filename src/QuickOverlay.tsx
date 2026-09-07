import { useEffect, useState, type CSSProperties } from 'react';
import type { QuickScreenConfig } from './preferences';

const Icon=({name}:{name:string})=><span className="material-symbols-outlined" aria-hidden="true">{name}</span>;

export function QuickOverlay({quick}:{quick:QuickScreenConfig|null}){
  const [left,setLeft]=useState(quick?.duration??0);
  useEffect(()=>{setLeft(quick?.duration??0);if(quick?.type!=='countdown')return;const timer=setInterval(()=>setLeft(value=>Math.max(0,value-1)),1000);return()=>clearInterval(timer)},[quick?.id,quick?.duration,quick?.type]);
  if(!quick||quick.type==='noText')return null;
  const minutes=Math.floor(left/60).toString().padStart(2,'0'),seconds=(left%60).toString().padStart(2,'0');
  return <div className={`quick-overlay ${quick.type}`} style={{'--quick-bg':quick.background??'#000'} as CSSProperties}>{quick.type==='quizJoin'?<div className="quiz-join-output"><div><span>JETZT MITMACHEN</span><strong>{quick.text??quick.name}</strong><p>QR-Code scannen oder Adresse öffnen</p><b>{quick.joinUrl?.replace(/^https?:\/\//,'').replace(/\?code=.*$/,'')}</b></div>{quick.imageUrl&&<img src={quick.imageUrl} alt="QR-Code zur Quizteilnahme"/>}<div className="quiz-join-code"><span>TEILNAHMECODE</span><strong>{quick.joinCode}</strong></div></div>:quick.type==='logo'?<div><Icon name="church"/><strong>Philippusgemeinde</strong></div>:quick.type==='countdown'?<div><strong>{minutes}:{seconds}</strong><small>{quick.endText}</small></div>:quick.type==='amen'?<div className="amen-burst"><i/><span>WIR SAGEN</span><strong>AMEN!</strong><em/></div>:quick.type==='empty'?null:<strong>{quick.text??quick.name}</strong>}</div>;
}
