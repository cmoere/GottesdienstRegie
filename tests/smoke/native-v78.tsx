import React from 'react';
import {createRoot} from 'react-dom/client';
import {SlideRenderer} from '../../src/SlideRenderer';
import {PostProgramRoomNoticeView} from '../../src/PostProgramRoomNotice';
import {preparePostEventPresentation} from '../../src/community/PostProgramRoomNoticeService';
import {prepareAnnouncementPages} from '../../src/announcementDesign';
import {buildAnnouncementSlide} from '../../src/announcementLive';
import {prepareEventOverview} from '../../src/eventOverviewPresentation';
import '@fontsource/inter/400.css';import '@fontsource/inter/600.css';import '../../src/cera-pro.css';
import '../../src/styles.css';import '../../src/version71.css';import '../../src/version75.css';import '../../src/version78-events.css';
const root=createRoot(document.getElementById('root')!);
const body='Derzeit werden in der Veranstaltungsauskunft teilweise fehlerhafte Abendmahlstermine angezeigt. Bitte beachte die aktuellen Aushänge sowie den Monatsplan. Diese enthalten die gültigen Termine.\n\nWir arbeiten bereits mit Hochdruck an der Behebung des technischen Fehlers.\n\n'+('Weitere Informationen werden rechtzeitig bekannt gegeben. '.repeat(40));
const base={id:'v78',itemId:'v78',order:0,enabled:true,title:'',body:'',background:'#18232f',transition:'none' as const,transitionDuration:0,notes:'',elements:[]};
async function notice(design:string,pageIndex=0){
 await document.fonts.ready;
 const pages=prepareAnnouncementPages({title:'Fehlerhafte Abendmahlstermine in der Veranstaltungsauskunft',body,qrCode:true,design});
 const slide=buildAnnouncementSlide(base,{title:'Fehlerhafte Abendmahlstermine in der Veranstaltungsauskunft',text:body,qrCode:true,qrReference:'https://example.org/meldung',durationMs:15000},pages[pageIndex],pageIndex,pages.length);
 root.render(<div style={{width:'100vw',height:'100vh'}}><SlideRenderer slide={slide} mode="live"/></div>);
 return {count:pages.length,body:pages.map(page=>page.bodyText).join(''),expected:body,duration:slide.timing?.durationSeconds};
}
function events(atEnd=false){
 const rows=Array.from({length:18},(_,i)=>({id:String(i),title:`Gemeindeveranstaltung ${i+1}`,start:'2026-10-13T12:00:00Z',end:'2026-10-13T13:00:00Z',room:'Gemeindesaal'}));
 const prepared=preparePostEventPresentation(rows);
 root.render(<div style={{width:'100vw',height:'100vh',position:'relative',containerType:'inline-size'}}><PostProgramRoomNoticeView snapshot={{sessionId:1,headerColor:'#608F9A',notice:{type:'next-events',events:rows},page:0,pageCount:1,pages:[rows.map(row=>({...row,lines:2}))],...prepared,startedAtMs:Date.now()-(atEnd?prepared.minDurationMs:0)}}/></div>);
 return prepared;
}
function overview(atEnd=false,long=false){
 const properties={loopType:'nextEvents',eventDesign:'timeline',eventLimit:8,eventItemsJson:JSON.stringify(Array.from({length:8},(_,i)=>({title:long?'Überlange Gemeindeveranstaltung mit vollständigem Titel '.repeat(12):`Veranstaltung ${i+1}`,effectiveStart:'2026-10-13T12:00:00Z'}))),eventStartedAtMs:Date.now()};
 const prepared=prepareEventOverview(properties);if(atEnd)properties.eventStartedAtMs-=prepared.minDurationMs;
 root.render(<div style={{width:'100vw',height:'100vh'}}><SlideRenderer slide={{...base,elements:[{id:'events',type:'loop',name:'Termine',x:0,y:0,width:1920,height:1080,rotation:0,opacity:1,locked:true,visible:true,zIndex:1,properties}]}} mode="live"/></div>);
 return prepared;
}
(window as any).v78={notice,events,overview};
await notice('classic');
