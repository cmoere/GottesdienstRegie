import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ExternalLoopView} from '../../src/externalLoop/View';
import {normalizeExternalSettings} from '../../src/externalLoop/model';
import {TestModeWatermark} from '../../src/TestModeWatermark';
import {ClockLoopView} from '../../src/clockLoop/ClockLoopView';
import {CLOCK_DESIGNS,normalizeClockSettings} from '../../src/clockLoop/model';
import {QuickOverlay} from '../../src/QuickOverlay';
import {AppClock} from '../../src/community/AppClock';
import {ExternalLoopController} from '../../src/externalLoop/controller';
import {createServiceItem,type Slide} from '../../src/store';
import {SlideRenderer} from '../../src/SlideRenderer';
import type {ExternalSnapshot} from '../../shared/externalLoop';
import '../../src/styles.css';
function BoundaryFixture(){
 const [slide,setSlide]=useState<Slide|null>(null);
 useEffect(()=>{
  let title='Erste Revision',revision=1,disposed=false;
  const item=createServiceItem('news',{id:'boundary',sectionId:'pre',metadata:{externalKind:'news',newsSources:'wdr-owl'}});
  item.slides[0].elements=[{id:'core',type:'loop',name:'News',x:0,y:0,width:1920,height:1080,rotation:0,opacity:1,locked:true,visible:true,zIndex:1,properties:{loopType:'news'}}];
  const controller=new ExternalLoopController(async()=>({status:'ready',snapshot:{version:1,key:'news:wdr-owl',revision:title,fetchedAt:1000,stale:false,payload:{kind:'news',entries:[{id:'one',title,source:'wdr-owl',publishedAt:null,url:'https://www1.wdr.de/a'}]}}}),()=>1000);
  const take=()=>{const output=controller.outputForTake(item,item.slides[0],revision,revision*1000);if(!disposed)setSlide(output)};
  void controller.prepare({kind:'news',sources:['wdr-owl']}).then(()=>{if(disposed)return;take();(window as any).externalBoundary={
   pending:async()=>{title='Nächste Revision';await controller.prepare({kind:'news',sources:['wdr-owl']});take()},
   take:()=>{revision++;take()},
   frame:()=>({revision:document.querySelector('[data-revision]')?.getAttribute('data-revision'),epoch:Number(document.querySelector('[data-frozen-epoch]')?.getAttribute('data-frozen-epoch')),title:document.querySelector('.event-title-text')?.textContent}),
  }});
  return()=>{disposed=true;controller.dispose();delete (window as any).externalBoundary};
 },[]);
 return slide?<div style={{width:'100%',height:'100%'}} data-frozen-epoch={slide.elements[0].properties.externalStartedAtMs}><SlideRenderer slide={slide} mode="live"/></div>:null;
}
function Fixture(){
 const [mode,setMode]=useState(location.hash==='#technical'?'technical':'news');
 if(mode==='technical')AppClock.now=()=>new Date(10000);
 useEffect(()=>{(window as any).externalFixture={mode:setMode}},[]);
 const snapshot:ExternalSnapshot={version:1,key:mode==='news'?'news:westfalen-blatt,wdr-owl':'football:bl1:'+mode,revision:'fixture',fetchedAt:Date.now(),stale:false,payload:mode==='news'?{kind:'news',entries:Array.from({length:10},(_,i)=>({id:String(i),title:i===0?'Eine sehr lange vollständige Nachricht aus Bielefeld über das Gemeindeleben und den nächsten Gottesdienst mit zahlreichen weiteren Informationen für alle Besucher':'Nachricht aus Bielefeld '+(i+1),source:i%2?'wdr-owl':'westfalen-blatt',publishedAt:'2026-10-23T12:00:00Z',url:'https://www1.wdr.de/a'}))}:{kind:'football',league:'bl1',season:2026,mode:mode as 'table'|'matchday'|'upcoming',teams:[],table:Array.from({length:24},(_,i)=>({rank:i+1,team:{id:i+1,name:'Verein '+(i+1)},played:8,goalsFor:12,goalsAgainst:10,goalDifference:2,points:15})),matches:Array.from({length:10},(_,i)=>({id:i,home:{id:i*2+1,name:'Heimverein '+(i+1)},away:{id:i*2+2,name:'Gastverein '+(i+1)},startsAt:'2026-10-23T12:00:00Z',status:i%2?'finished':'scheduled',score:i%2?{home:0,away:0}:null}))}};
 return <div className="output" style={{position:'relative',width:'100vw',height:'100vh',containerType:'inline-size'}}>{mode==='boundary'?<BoundaryFixture/>:mode==='technical'?<QuickOverlay quick={{id:'technical-issue',type:'custom',name:'Technische Störung',text:'Technische Störung\nWir bitten um etwas Geduld.',activatedAtMs:1000,background:'#000000',enabled:true,targets:['main'],order:0}}/>:CLOCK_DESIGNS.includes(mode as any)?<ClockLoopView settings={normalizeClockSettings({clockDesign:mode})} now={new Date(2026,9,23,10,30,15)}/>:<ExternalLoopView snapshot={snapshot} settings={normalizeExternalSettings({externalKind:mode==='news'?'news':'football',footballMode:mode,footballTeamId:mode==='table'?3:0})} startedAt={Date.now()}/>}<TestModeWatermark role="main" visible/></div>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
