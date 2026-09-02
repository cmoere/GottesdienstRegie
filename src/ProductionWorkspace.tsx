import { useMemo, useState } from 'react';
import { SlideRenderer } from './SlideRenderer';
import { formatDuration, itemDurationSeconds, usePresentation, type ServiceItem, type Slide } from './store';

const Icon=({name}:{name:string})=><span className="material-symbols-outlined" aria-hidden="true">{name}</span>;

function selected(state:ReturnType<typeof usePresentation.getState>){
  const item=state.items.find(entry=>entry.id===state.selectedItemId)??state.items[0];
  const slide=item?.slides.find(entry=>entry.id===state.selectedSlideId)??item?.slides[0];
  return {item,slide};
}

function slideLabel(slide:Slide,index:number){return slide.title?.trim()||`Folie ${index+1}`}

function SongEditor({item,canEdit}:{item:ServiceItem;canEdit:boolean}){
  const state=usePresentation();
  const arrangement=item.slides.map((slide,index)=>slideLabel(slide,index));
  const metadata=item.metadata;
  const changeMeta=(patch:Record<string,string|number|boolean>)=>state.updateItem(item.id,{metadata:{...metadata,...patch}});
  return <div className="song-context">
    <header><div><input aria-label="Songtitel" disabled={!canEdit} value={item.title} onChange={event=>state.updateItem(item.id,{title:event.target.value})}/><small>{String(metadata.originalTitle??'')}</small></div><label>Team<select disabled={!canEdit} value={String(metadata.team??'Lobpreis-Team')} onChange={event=>changeMeta({team:event.target.value})}><option>Lobpreis-Team</option><option>Technik-Team</option></select></label></header>
    <div className="arrangement-head"><button><Icon name="expand_more"/> Hauptarrangement</button><div className="arrangement-actions"><button title="Arrangement duplizieren"><Icon name="content_copy"/></button><button title="Abschnitt hinzufügen" onClick={()=>state.addSlide()} disabled={!canEdit}><Icon name="add"/></button></div><label>Tonart<select disabled={!canEdit} value={String(metadata.key??'–')} onChange={event=>changeMeta({key:event.target.value})}><option>–</option>{['C','D','E','F','G','A','B'].map(key=><option key={key}>{key}</option>)}</select></label></div>
    <div className="arrangement-sequence" aria-label="Arrangement">{arrangement.map((name,index)=><button key={`${name}-${index}`} className={item.slides[index].id===state.selectedSlideId?'active':''} onClick={()=>state.select(item.id,item.slides[index].id)}>{name}</button>)}</div>
    <div className="lyrics-editor">{item.slides.map((slide,index)=><section key={slide.id} className={slide.id===state.selectedSlideId?'active':''} onClick={()=>state.select(item.id,slide.id)}><input disabled={!canEdit} value={slide.title} aria-label={`Abschnitt ${index+1}`} onChange={event=>{state.select(item.id,slide.id);state.updateSlide({title:event.target.value})}}/><textarea disabled={!canEdit} value={slide.body} rows={Math.max(3,slide.body.split('\n').length+1)} onChange={event=>{state.select(item.id,slide.id);state.updateSlide({body:event.target.value})}}/><button disabled={!canEdit} onClick={()=>{state.select(item.id,slide.id);state.addSlide()}}><Icon name="horizontal_rule"/> FOLIENUMBRUCH</button></section>)}</div>
    <div className="song-meta"><label>Autoren<input disabled={!canEdit} value={String(metadata.author??'')} onChange={event=>changeMeta({author:event.target.value})}/></label><label>Publisher / Copyright<input disabled={!canEdit} value={String(metadata.copyright??'')} onChange={event=>changeMeta({copyright:event.target.value})}/></label><label>CCLI Song Number<input disabled={!canEdit} value={String(metadata.ccli??'')} onChange={event=>changeMeta({ccli:event.target.value})}/></label></div>
    <div className="song-options"><label><input type="checkbox" disabled={!canEdit} checked={metadata.ccliLicensed!==false} onChange={event=>changeMeta({ccliLicensed:event.target.checked})}/> Unter CCLI-Lizenz</label><label><input type="checkbox" disabled={!canEdit} checked={metadata.showTitle===true} onChange={event=>changeMeta({showTitle:event.target.checked})}/> Titel auf Titelfolie</label><label><input type="checkbox" disabled={!canEdit} checked={metadata.showCredits!==false} onChange={event=>changeMeta({showCredits:event.target.checked})}/> Credits auf Titelfolie</label><span>Übergang: Überblenden · 0,5 Sekunden</span></div>
  </div>
}

function ContentEditor({item,slide,canEdit}:{item:ServiceItem;slide:Slide;canEdit:boolean}){
  const state=usePresentation();
  return <div className="content-context"><header><b>{item.title}</b><span>{item.type.toUpperCase()}</span></header><div className="content-tools"><button disabled={!canEdit} onClick={()=>state.addSlide()}><Icon name="splitscreen"/> SLIDE BREAK</button><button disabled={!canEdit}><Icon name="animation"/> FADE IN TEXT</button><button><Icon name="info"/></button></div><textarea aria-label="Folieninhalt" disabled={!canEdit} value={slide.body} onChange={event=>state.updateSlide({body:event.target.value})}/><div className="item-playback"><label><input type="checkbox" disabled={!canEdit} checked={item.timing.autoAdvance} onChange={event=>state.updateItem(item.id,{autoAdvance:event.target.checked,timing:{...item.timing,autoAdvance:event.target.checked}})}/> Jede Folie für <button type="button">{item.timing.slideDurationSeconds} Sekunden</button> anzeigen</label><label><input type="checkbox" disabled={!canEdit} checked={item.timing.shuffle} onChange={event=>state.updateItem(item.id,{timing:{...item.timing,shuffle:event.target.checked}})}/> Zufällige Reihenfolge</label><label><input type="checkbox" disabled={!canEdit} checked={item.timing.repeat} onChange={event=>state.updateItem(item.id,{repeat:event.target.checked,timing:{...item.timing,repeat:event.target.checked}})}/> Wiederholen</label><span>Übergang: Kein Übergang</span></div></div>
}

function PreviewStack({item,slide}:{item:ServiceItem;slide:Slide}){
  const state=usePresentation(),index=item.slides.findIndex(entry=>entry.id===slide.id);
  const shown=item.slides.slice(Math.max(0,index-1),Math.min(item.slides.length,index+2));
  return <div className="production-preview-scroll">{shown.map(current=><button key={current.id} className={`production-slide ${current.id===slide.id?'active':''} ${current.id===state.liveSlideId?'live':''}`} onClick={()=>state.select(item.id,current.id)}><SlideRenderer slide={current} mode="preview"/><span>{current.title}</span>{current.id===state.liveSlideId&&<i/>}</button>)}</div>
}

function PreviewMode(){
  const state=usePresentation(),item=state.items.find(entry=>entry.id===state.previewItemId)??state.items[0],slide=item?.slides.find(entry=>entry.id===state.previewSlideId)??item?.slides[0];
  if(!item||!slide)return <div className="production-empty">Keine Folien vorhanden.</div>;
  if(state.previewLayout==='single')return <div className="production-single"><div><SlideRenderer slide={slide} mode="preview"/></div></div>;
  return <div className="production-grid">{state.sections.map(section=><section key={section.id}><h2>{section.title}</h2>{state.items.filter(entry=>entry.sectionId===section.id).map(entry=><div key={entry.id}><h3>{entry.title}</h3><div>{entry.slides.map((current,index)=><button key={current.id} className={`${current.id===state.previewSlideId?'active':''} ${current.id===state.liveSlideId?'live':''}`} onClick={()=>state.onAir?state.goLive(entry.id,current.id):state.selectPreview(entry.id,current.id)}><SlideRenderer slide={current} mode="thumbnail"/><span>{index+1}</span></button>)}</div></div>)}</section>)}</div>;
}

export function ProductionWorkspace({canEdit}:{canEdit:boolean}){
  const state=usePresentation(),{item,slide}=selected(state);
  if(state.mode==='preview')return <section className="production-workspace preview-mode"><div className="preview-mode-toolbar"><button className={state.previewLayout==='single'?'active':''} onClick={()=>state.setPreviewLayout('single')}>EINZELANSICHT</button><button className={state.previewLayout==='grid'?'active':''} onClick={()=>state.setPreviewLayout('grid')}>FOLIENÜBERSICHT</button><label>Thumbnailgröße<input type="range" min="120" max="320" value={state.gridSize} onChange={event=>state.setGridSize(Number(event.target.value))}/></label></div><PreviewMode/></section>;
  if(!item||!slide)return <section className="production-workspace production-empty">Wähle ein Element im Ablauf aus.</section>;
  return <section className="production-workspace"><div className="context-editor">{item.type==='song'?<SongEditor item={item} canEdit={canEdit}/>:<ContentEditor item={item} slide={slide} canEdit={canEdit}/>}</div><div className="large-output-preview"><PreviewStack item={item} slide={slide}/></div></section>;
}

export function FormatToolbar(){
  const state=usePresentation(),{slide}=selected(state),element=slide?.elements.find(entry=>entry.type==='text');
  const update=(patch:Record<string,string|number|boolean>)=>element&&state.updateElement(element.id,{properties:{...element.properties,...patch}});
  return <div className="format-toolbar"><select aria-label="Schriftart" value={String(element?.properties.fontFamily??'Inter')} onChange={event=>update({fontFamily:event.target.value})}><option>Inter</option><option>Arial</option><option>Georgia</option></select><select aria-label="Stil"><option>Normal</option><option>Titel</option><option>Untertitel</option></select><input aria-label="Textgröße" type="number" min="12" max="240" value={Number(element?.properties.fontSize??72)} onChange={event=>update({fontSize:Number(event.target.value)})}/><input aria-label="Zeilenhöhe" type="number" min="0.7" max="2" step="0.05" value={Number(element?.properties.lineHeight??1.15)} onChange={event=>update({lineHeight:Number(event.target.value)})}/><button title="Fett" onClick={()=>update({fontWeight:Number(element?.properties.fontWeight??600)>=700?500:700})}><b>B</b></button><button title="Kursiv"><i>I</i></button><button title="Ausrichtung"><Icon name="format_align_center"/></button><i/><button>Effekte <Icon name="arrow_drop_down"/></button><button>Styles <Icon name="arrow_drop_down"/></button><button>Guides <Icon name="arrow_drop_down"/></button><button>Arrange <Icon name="arrow_drop_down"/></button><button>Background <Icon name="arrow_drop_down"/></button></div>;
}

export function OutputTabs(){const state=usePresentation(),item=state.items.find(entry=>entry.id===state.selectedItemId);const [tab,setTab]=useState('main');return <div className="output-tabs">{[{id:'main',label:`MAIN (${item?.type==='song'?'Lyrics':'Inhalt'})`},{id:'livestream',label:'LIVESTREAM (Spiegel)'},{id:'stage',label:'STAGE (Bühne)'},{id:'notes',label:'NOTIZEN'},{id:'signals',label:'SIGNALE'}].map(entry=><button key={entry.id} className={tab===entry.id?'active':''} onClick={()=>setTab(entry.id)}>{entry.label}</button>)}<button title="Virtuelle Ausgabe hinzufügen"><Icon name="add"/></button></div>}

export function ProductionTimeline(){
  const state=usePresentation(),[expanded,setExpanded]=useState(()=>localStorage.getItem('gottesdienstregie.timeline.expanded')==='true'),[height,setHeight]=useState(()=>Number(localStorage.getItem('gottesdienstregie.timeline.height')||190));
  const blocks=useMemo(()=>{let cursor=0;return state.items.filter(item=>item.enabled&&!item.disabled).map(item=>{const duration=Math.max(7,itemDurationSeconds(item));const result={item,start:cursor,duration};cursor+=duration;return result})},[state.items]);
  const total=Math.max(1,blocks.reduce((sum,entry)=>sum+entry.duration,0));
  const toggle=()=>setExpanded(value=>{localStorage.setItem('gottesdienstregie.timeline.expanded',String(!value));return !value});
  return <div className={`production-timeline ${expanded?'expanded':''}`} style={expanded?{height}:undefined}><button className="timeline-toggle" onClick={toggle}><b>TIMELINE</b><span>{state.serviceTime&&`SERVICE ${formatServiceTime(state.serviceTime)}`}</span><Icon name={expanded?'expand_more':'expand_less'}/></button>{expanded&&<><input className="timeline-resize" aria-label="Timeline-Höhe" type="range" min="120" max="360" value={height} onChange={event=>{const next=Number(event.target.value);setHeight(next);localStorage.setItem('gottesdienstregie.timeline.height',String(next))}}/><div className="timeline-track">{blocks.map(({item,start,duration})=><button key={item.id} className={item.id===state.liveItemId?'live':''} style={{left:`${start/total*100}%`,width:`${Math.max(2,duration/total*100)}%`}} onClick={()=>state.select(item.id)}><b>{item.title}</b><small>{formatDuration(duration)}</small></button>)}{state.onAir&&<i className="timeline-live-marker"/>}</div></>}</div>
}

function formatServiceTime(value:string){const hour=Number(value.split(':')[0]);return `${value} (${hour<12?'VORM.':'NACHM.'})`}
