import React,{useEffect,useState,useMemo} from 'react';
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
import {prepareNewsPresentation} from '../../src/externalLoop/newsPresentation';
import {prepareAnnouncementPages} from '../../src/announcementDesign';
import {buildAnnouncementSlide} from '../../src/announcementLive';
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
   frame:()=>({revision:document.querySelector('[data-revision]')?.getAttribute('data-revision'),epoch:Number(document.querySelector('[data-frozen-epoch]')?.getAttribute('data-frozen-epoch')),title:document.querySelector('.news-story')?.getAttribute('aria-label')}),
  }});
  return()=>{disposed=true;controller.dispose();delete (window as any).externalBoundary};
 },[]);
 return slide?<div style={{width:'100%',height:'100%'}} data-frozen-epoch={slide.elements[0].properties.externalStartedAtMs}><SlideRenderer slide={slide} mode="live"/></div>:null;
}
function Fixture(){
 const [mode,setMode]=useState(location.hash==='#technical'?'technical':'news');
 const startedAt=useMemo(()=>Date.now(),[mode]);
 if(mode==='technical')AppClock.now=()=>new Date(10000);
 useEffect(()=>{(window as any).externalFixture={mode:setMode}},[]);
 const image='data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAwAEADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAL/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAQF/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AsBexAAAAAAAAAAAAAAAAAAAAAAH/2Q==';
 const news=mode.startsWith('news'),weather=mode==='weather';
 const snapshot:ExternalSnapshot={version:1,key:weather?'weather:52.0302,8.5325:Bielefeld':news?'news:westfalen-blatt,wdr-owl':'football:bl1:'+mode,revision:'fixture',fetchedAt:Date.now(),stale:false,payload:weather?{kind:'weather',location:{name:'Bielefeld',latitude:52.0302,longitude:8.5325},observedAt:'2026-10-23T12:00:00Z',temperature:12,wind:8,code:2,days:[0,1,2].map((index)=>({date:`2026-10-${23+index}T00:00:00Z`,minimum:5+index,maximum:13+index,code:[3,61,0][index],rainProbability:[10,70,0][index]}))}:news?{kind:'news',entries:[{id:'first',title:'Gemeindeleben in Bielefeld',description:mode==='news-long'?'Eine ausführliche Nachricht mit allen wichtigen Informationen für unsere Gemeinde. '.repeat(30):'Menschen begegnen sich, teilen ihren Glauben und gestalten gemeinsam das Leben in unserer Stadt.\nNeue Angebote laden zum Mitmachen ein.',source:'westfalen-blatt',publishedAt:'2026-10-23T12:00:00Z',url:'https://www.westfalen-blatt.de/a',imageDataUrl:image,imageCredit:'Testbild · lokale Prüfdaten'},{id:'second',title:'Weitere Nachrichten aus OWL',description:'Diese Nachricht hat kein Feed-Bild. Der Text nutzt deshalb die gesamte verfügbare Breite.',source:'wdr-owl',publishedAt:'2026-10-23T12:00:00Z',url:'https://www1.wdr.de/b'}]}:{kind:'football',league:'bl1',season:2026,mode:mode as 'table'|'matchday'|'upcoming',teams:Array.from({length:24},(_,i)=>({id:i+1,name:'Verein '+(i+1),logoDataUrl:image})),table:Array.from({length:24},(_,i)=>({rank:i+1,team:{id:i+1,name:'Verein '+(i+1)},played:8,goalsFor:12,goalsAgainst:10,goalDifference:2,points:15})),matches:Array.from({length:10},(_,i)=>({id:i,home:{id:i*2+1,name:'Heimverein '+(i+1)},away:{id:i*2+2,name:'Gastverein '+(i+1)},startsAt:'2026-10-23T12:00:00Z',status:i%2?'finished':'scheduled',score:i%2?{home:0,away:0}:null}))}};
 const newsOffset=news&&mode==='news-second'&&snapshot.payload.kind==='news'?prepareNewsPresentation(snapshot.payload.entries,20).stories[0].durationMs:0;
 const announcement=mode.startsWith('announcement');
 const page=announcement?prepareAnnouncementPages({title:'Wichtige Information für unsere Gemeinde',body:'<p>Herzlich willkommen zum Gottesdienst.</p><p><strong>Bitte beachten:</strong> Am Sonntag findet unser gemeinsames Mittagessen im Gemeindesaal statt.</p>',qrCode:true,design:mode.replace('announcement-','')})[0]:null;
 const slide=page?buildAnnouncementSlide(createServiceItem('announcement').slides[0],{title:'Information',text:page.bodyText,durationMs:20000,qrReference:'https://pgbielefeld.neocities.org/meldungen#test'},page,0,1):null;
 return <div className="output" style={{position:'relative',width:'100vw',height:'100vh',containerType:'inline-size'}}>{mode==='boundary'?<BoundaryFixture/>:announcement&&slide?<SlideRenderer slide={slide} mode="preview"/>:mode==='technical'?<QuickOverlay quick={{id:'technical-issue',type:'custom',name:'Technische Störung',text:'Technische Störung\nWir bitten um etwas Geduld.',activatedAtMs:1000,background:'#000000',enabled:true,targets:['main'],order:0}}/>:CLOCK_DESIGNS.includes(mode as any)?<ClockLoopView settings={normalizeClockSettings({clockDesign:mode})} now={new Date(2026,9,23,10,30,15)}/>:<ExternalLoopView snapshot={snapshot} settings={normalizeExternalSettings({externalKind:weather?'weather':news?'news':'football',durationSeconds:20,footballMode:mode,footballTeamId:mode==='table'?3:0})} startedAt={startedAt-newsOffset} staticPreview={mode==='news-reduced'}/>}<TestModeWatermark role="main" visible/></div>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
