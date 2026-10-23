import type {ExternalSettings,ExternalSnapshot} from '../../shared/externalLoop';
import {useMemo,useState} from 'react';
import {EventTitle} from '../EventTitle';
import {EventScrollViewport,useEventPresentationClock} from '../EventScrollViewport';
import {prepareExternalPresentation,externalReducedPages} from './model';
import './styles.css';
import {NewsStoryView} from './NewsStoryView';
import {WeatherView} from './WeatherView';

function ClubLogo({src,name}:{src?:string;name:string}){const [failed,setFailed]=useState(false);return src&&!failed?<img className="football-club-logo" src={src} alt={'Logo '+name} onError={()=>setFailed(true)}/>:null}
function date(value:string|null){if(!value)return '';const parsed=new Date(value);return Number.isFinite(parsed.getTime())?parsed.toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'}):''}
function time(value:string){return new Date(value).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}
type Props={snapshot:ExternalSnapshot;startedAt:number;settings:ExternalSettings;staticPreview?:boolean};
function Frame({snapshot,settings,elapsed,reduced}:{snapshot:ExternalSnapshot;settings:ExternalSettings;elapsed:number;reduced:boolean}){
 const prepared=useMemo(()=>prepareExternalPresentation(snapshot,settings),[snapshot,settings]),payload=prepared.payload;
 if(payload.kind==='weather')return <WeatherView snapshot={snapshot} payload={payload}/>;
 if(payload.kind==='news')return <NewsStoryView snapshot={snapshot} entries={payload.entries} durationSeconds={settings.durationSeconds} elapsed={elapsed} reduced={reduced}/>;
 const pages=reduced?externalReducedPages(snapshot,settings):[],page=pages[Math.floor(elapsed/10000)%Math.max(1,pages.length)];
 const visible=(index:number)=>!page||page.some(row=>row.index===index);
 const title=(text:string,index:number)=>page?<div className="external-reduced-title">{page.filter(row=>row.index===index).map(row=>row.title).join('\n')}</div>:<EventTitle title={text} elapsed={elapsed} startsAfterMs={prepared.titleStartsAfterMs[index]} designWidth={prepared.titleWidth}/>;
 const logo=(team:{id:number;name:string;logoDataUrl?:string})=><ClubLogo key={team.id} name={team.name} src={payload.teams.find(entry=>entry.id===team.id)?.logoDataUrl??team.logoDataUrl}/>;
 return <div className="external-loop-frame external-football" data-revision={snapshot.revision} data-reduced={reduced}>
  <header><h2>{payload.mode==='table'?'Fußball · Tabelle':payload.mode==='upcoming'?'Fußball · Kommende Spiele':'Fußball · Spieltag / Ergebnisse'}</h2>
   <span>{payload.league==='bl1'?'1. Bundesliga':payload.league==='bl2'?'2. Bundesliga':'3. Liga'} · {payload.season}/{payload.season+1}</span>
  </header>
  <div className="external-loop-body" role={payload.mode==='table'?'table':undefined}>
   {payload.kind==='football'&&payload.mode==='table'&&<div className="external-table-row external-table-heading" role="row">{['Platz','Verein','Sp.','Tore','Diff.','Punkte'].map(label=><span role="columnheader" key={label}>{label}</span>)}</div>}
   <EventScrollViewport plan={prepared.plan} elapsed={elapsed} reduced={reduced}>
    {payload.mode==='table'?payload.table.map((row,index)=>visible(index)&&<div className="external-table-row" role="row" data-selected-club={settings.kind==='football'&&settings.teamId===row.team.id} key={row.team.id}>
     <span role="cell">{row.rank}</span><div role="cell" className="football-club-cell">{logo(row.team)}{title(row.team.name,index)}</div><span role="cell">{row.played}</span><span role="cell">{row.goalsFor}:{row.goalsAgainst}</span><span role="cell">{row.goalDifference}</span><span role="cell">{row.points}</span>
    </div>):payload.matches.map((match,index)=>visible(index)&&<article className="external-match-row" key={match.id}><div><div className="football-club-cell"><span className="football-logo-pair">{logo(match.home)}{logo(match.away)}</span>{title(match.home.name+' – '+match.away.name,index)}</div><p>{date(match.startsAt)} · {time(match.startsAt)} · {match.status==='finished'?'Endstand':match.status==='in-progress'?'Zwischenstand':'Anstoß'}</p></div><strong>{match.score?match.score.home+':'+match.score.away:'–'}</strong></article>)}
   </EventScrollViewport>
  </div>
  <footer>{payload.kind==='football'?'Quelle: OpenLigaDB · ':''}Datenstand: {new Date(snapshot.fetchedAt).toLocaleString('de-DE')}{snapshot.stale?' · Letzter gültiger Stand':''}</footer>
 </div>;
}
function AnimatedView(props:Props){const clock=useEventPresentationClock(props.startedAt,false,props.snapshot.payload.kind==='news');return <Frame {...props} {...clock}/>}
export function ExternalLoopView(props:Props){return props.staticPreview?<Frame {...props} elapsed={0} reduced/>:<AnimatedView {...props}/>}
