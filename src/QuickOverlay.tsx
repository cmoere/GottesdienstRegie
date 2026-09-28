import { useEffect, useState, type CSSProperties } from 'react';
import type { QuickScreenConfig } from './preferences';
import logoWhite from './assets/logo-white.png';
import { BibleQuickOverlay } from './BibleQuickOverlay';
import { usePreferences } from './preferences';

const Icon=({name}:{name:string})=><span className="material-symbols-outlined" aria-hidden="true">{name}</span>;

export function QuickOverlay({quick,staticPreview=false}:{quick:QuickScreenConfig|null;staticPreview?:boolean}){
  const reducedMotion=usePreferences(state=>state.reduceMotion);
  const [rendered,setRendered]=useState<QuickScreenConfig|null>(quick),[leaving,setLeaving]=useState(false);
  const [left,setLeft]=useState(quick?.duration??0);
  useEffect(()=>{if(quick){setRendered(quick);setLeaving(false);return}if(!rendered)return;if(reducedMotion){setRendered(null);setLeaving(false);return}setLeaving(true);const timer=setTimeout(()=>{setRendered(null);setLeaving(false)},460);return()=>clearTimeout(timer)},[quick,reducedMotion]);
  useEffect(()=>{setLeft(rendered?.duration??0);if(rendered?.type!=='countdown')return;const timer=setInterval(()=>setLeft(value=>Math.max(0,value-1)),1000);return()=>clearInterval(timer)},[rendered?.id,rendered?.duration,rendered?.type]);
  if(!rendered||rendered.type==='noText')return null;
  const minutes=Math.floor(left/60).toString().padStart(2,'0'),seconds=(left%60).toString().padStart(2,'0');
  return <div className={`quick-overlay ${rendered.type}${leaving?' leaving':''}`} style={{'--quick-bg':rendered.background??'#000'} as CSSProperties}>{rendered.type==='black'?null:rendered.type==='bible'?<BibleQuickOverlay quick={rendered} reducedMotion={reducedMotion} staticPreview={staticPreview}/>:rendered.type==='quizJoin'?<div className="quiz-join-output"><div><span>JETZT MITMACHEN</span><strong>{rendered.text??rendered.name}</strong><p>QR-Code scannen oder Adresse öffnen</p><b>{rendered.joinUrl?.replace(/^https?:\/\//,'').replace(/\?code=.*$/,'')}</b></div>{rendered.imageUrl&&<img src={rendered.imageUrl} alt="QR-Code zur Quizteilnahme"/>}<div className="quiz-join-code"><span>TEILNAHMECODE</span><strong>{rendered.joinCode}</strong></div></div>:rendered.type==='logo'?<div className="philippus-logo"><img src={rendered.imageUrl||logoWhite} alt="Philippus Gemeinde Bielefeld e. V."/><strong>{rendered.text||'Philippus Gemeinde Bielefeld e. V.'}</strong></div>:rendered.type==='countdown'?<div><strong>{minutes}:{seconds}</strong><small>{rendered.endText}</small></div>:rendered.type==='amen'?<div className="amen-burst"><i/><span>WIR SAGEN</span><strong>AMEN!</strong><em/></div>:rendered.type==='empty'?null:<strong>{rendered.text??rendered.name}</strong>}</div>;
}
