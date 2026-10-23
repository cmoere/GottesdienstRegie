import type {ExternalSettings,ExternalSnapshot} from '../../shared/externalLoop';
import {EventTitle} from '../EventTitle';
import {EventScrollViewport,useEventPresentationClock} from '../EventScrollViewport';
import {prepareExternalPresentation,externalReducedPages} from './model';
import './styles.css';

const sourceInfo={
 'wdr-owl':{name:'WDR.de',alt:'WDR',logo:'wdr.svg'},
 'westfalen-blatt':{name:'Westfalen-Blatt',alt:'Westfalen-Blatt',logo:'westfalen-blatt.svg'},
};
function date(value:string|null){if(!value)return '';const parsed=new Date(value);return Number.isFinite(parsed.getTime())?parsed.toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'}):''}
function time(value:string){return new Date(value).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}
type Props={snapshot:ExternalSnapshot;startedAt:number;settings:ExternalSettings;staticPreview?:boolean};
function Frame({snapshot,settings,elapsed,reduced}:{snapshot:ExternalSnapshot;settings:ExternalSettings;elapsed:number;reduced:boolean}){
 const prepared=prepareExternalPresentation(snapshot,settings),payload=prepared.payload;
 const pages=reduced?externalReducedPages(snapshot,settings):[],page=pages[Math.floor(elapsed/10000)%Math.max(1,pages.length)];
 const visible=(index:number)=>!page||page.some(row=>row.index===index);
 const title=(text:string,index:number)=>page?<div className="external-reduced-title">{page.filter(row=>row.index===index).map(row=>row.title).join('\n')}</div>:<EventTitle title={text} elapsed={elapsed} startsAfterMs={prepared.titleStartsAfterMs[index]} designWidth={prepared.titleWidth}/>;
 return <div className={'external-loop-frame '+(payload.kind==='news'?'external-news':'external-football')} data-revision={snapshot.revision} data-reduced={reduced}>
  <header><h2>{payload.kind==='news'?'Nachrichten aus der Region':payload.mode==='table'?'Fußball · Tabelle':payload.mode==='upcoming'?'Fußball · Kommende Spiele':'Fußball · Spieltag / Ergebnisse'}</h2>
   {payload.kind==='news'?<div className="external-source-logos">{[...new Set(payload.entries.map(entry=>entry.source))].map(source=><img key={source} alt={sourceInfo[source].alt} src={import.meta.env.BASE_URL+'news-logos/'+sourceInfo[source].logo}/>)}</div>:<span>{payload.league==='bl1'?'1. Bundesliga':payload.league==='bl2'?'2. Bundesliga':'3. Liga'} · {payload.season}/{payload.season+1}</span>}
  </header>
  <div className="external-loop-body" role={payload.kind==='football'&&payload.mode==='table'?'table':undefined}>
   {payload.kind==='football'&&payload.mode==='table'&&<div className="external-table-row external-table-heading" role="row">{['Platz','Verein','Sp.','Tore','Diff.','Punkte'].map(label=><span role="columnheader" key={label}>{label}</span>)}</div>}
   <EventScrollViewport plan={prepared.plan} elapsed={elapsed} reduced={reduced}>
    {payload.kind==='news'?payload.entries.map((entry,index)=>visible(index)&&<article className="external-news-row" key={entry.id}>{title(entry.title,index)}<p>Quelle: {sourceInfo[entry.source].name}{entry.publishedAt?' · '+date(entry.publishedAt):''}</p></article>):payload.mode==='table'?payload.table.map((row,index)=>visible(index)&&<div className="external-table-row" role="row" data-selected-club={settings.kind==='football'&&settings.teamId===row.team.id} key={row.team.id}>
     <span role="cell">{row.rank}</span><div role="cell">{title(row.team.name,index)}</div><span role="cell">{row.played}</span><span role="cell">{row.goalsFor}:{row.goalsAgainst}</span><span role="cell">{row.goalDifference}</span><span role="cell">{row.points}</span>
    </div>):payload.matches.map((match,index)=>visible(index)&&<article className="external-match-row" key={match.id}><div>{title(match.home.name+' – '+match.away.name,index)}<p>{date(match.startsAt)} · {time(match.startsAt)} · {match.status==='finished'?'Endstand':match.status==='in-progress'?'Zwischenstand':'Anstoß'}</p></div><strong>{match.score?match.score.home+':'+match.score.away:'–'}</strong></article>)}
   </EventScrollViewport>
  </div>
  <footer>{payload.kind==='football'?'Quelle: OpenLigaDB · ':''}Datenstand: {new Date(snapshot.fetchedAt).toLocaleString('de-DE')}{snapshot.stale?' · Letzter gültiger Stand':''}</footer>
 </div>;
}
function AnimatedView(props:Props){const clock=useEventPresentationClock(props.startedAt);return <Frame {...props} {...clock}/>}
export function ExternalLoopView(props:Props){return props.staticPreview?<Frame {...props} elapsed={0} reduced/>:<AnimatedView {...props}/>}
