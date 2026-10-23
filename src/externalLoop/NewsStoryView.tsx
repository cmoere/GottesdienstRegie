import {useMemo,useState} from 'react';
import type {ExternalSnapshot,NewsEntry} from '../../shared/externalLoop';
import {EventScrollViewport} from '../EventScrollViewport';
import {newsFrameAt,prepareNewsPresentation} from './newsPresentation';
const sources={
 'wdr-owl':{name:'WDR.de',alt:'WDR',logo:'wdr.svg'},
 'westfalen-blatt':{name:'Westfalen-Blatt',alt:'Westfalen-Blatt',logo:'westfalen-blatt.svg'},
};
function Story({frame,reduced,fetchedAt,stale}:{frame:NonNullable<ReturnType<typeof newsFrameAt>>;reduced:boolean;fetchedAt:number;stale:boolean}){
 const [failed,setFailed]=useState(false),{entry,lines,pages,plan,elapsed,durationMs}=frame,source=sources[entry.source];
 const visibleLines=reduced?pages[Math.min(pages.length-1,Math.floor(elapsed/(durationMs/pages.length)))]??[]:lines;
 return <><header><h2>Nachrichten aus der Region</h2><div className="external-source-logos"><img alt={source.alt} src={import.meta.env.BASE_URL+'news-logos/'+source.logo}/></div></header>
  <div className="external-loop-body"><article className="news-story" aria-label={entry.title} data-has-image={!!entry.imageDataUrl&&!failed}>
   {entry.imageDataUrl&&!failed&&<figure><img alt="Nachrichtenbild" src={entry.imageDataUrl} onError={()=>setFailed(true)}/>{entry.imageCredit&&<figcaption>{entry.imageCredit}</figcaption>}</figure>}
   <div className="news-story-text"><EventScrollViewport plan={plan} elapsed={elapsed} reduced={reduced}>
    {visibleLines.map((line,index)=><div className={'news-story-'+line.kind} style={{height:line.height/19.2+'cqw'}} key={index}>{line.text||'\u00a0'}</div>)}
   </EventScrollViewport></div>
  </article></div>
  <footer>Quelle: {source.name}{entry.publishedAt?' · '+new Date(entry.publishedAt).toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'}):''} · Datenstand: {new Date(fetchedAt).toLocaleString('de-DE')}{stale?' · Letzter gültiger Stand':''}</footer></>;
}
// Pass the source timestamp explicitly; no wall-clock or network reads in a story.
export function NewsStoryView({snapshot,entries,durationSeconds,elapsed,reduced}:{snapshot:ExternalSnapshot;entries:NewsEntry[];durationSeconds:number;elapsed:number;reduced:boolean}){
 const plan=useMemo(()=>prepareNewsPresentation(entries,durationSeconds),[entries,durationSeconds]);
 const frame=newsFrameAt(plan,elapsed);if(!frame)return null;
 return <div className="external-loop-frame external-news" data-revision={snapshot.revision} data-reduced={reduced}><Story key={frame.entry.id} frame={frame} reduced={reduced} fetchedAt={snapshot.fetchedAt} stale={snapshot.stale}/></div>;
}
