import React from 'react';
import {createRoot} from 'react-dom/client';
import mainSource from '../../src/main.tsx?raw';
import {usePreviewOptions} from '../../src/PreviewOverviewControls';
import {ProductionWorkspace} from '../../src/ProductionWorkspace';
import {AnnouncementLiveController} from '../../src/announcementLive';
import {EditorModeControl} from '../../src/EditorModeControl';
import {createServiceItem,usePresentation} from '../../src/store';
import {usePreferences} from '../../src/preferences';
import {ExternalLoopContext} from '../../src/externalLoop/context';
import {ExternalLoopController} from '../../src/externalLoop/controller';
import {externalRequestKey} from '../../shared/externalLoopRequest';
import {hydrateExternalLoopData,externalSettingsForItem,requestForExternalItem} from '../../src/externalLoop/model';

async function start(){
 await Promise.all([...mainSource.matchAll(/import '\.\/([^']+\.css)'/g)].map(match=>new Promise<void>((resolve,reject)=>{const link=document.createElement('link');link.rel='stylesheet';link.href='/src/'+match[1];link.onload=()=>resolve();link.onerror=reject;document.head.append(link)})));
 localStorage.setItem('gottesdienstregie.preview.rightCollapsed','true');
 usePreferences.setState({language:'de',germanRegion:null,reduceMotion:true});
 const items=['nowPlaying','announcement','weather','news','football','clock'].map((type,index)=>{const item=createServiceItem(type as any,{sectionId:'pre',title:['Läuft gerade','Meldungen','Wetter','Nachrichten','Fußball','Uhrzeit'][index]});item.order=index;item.slides[0].elements=[{id:'loop-'+index,type:'loop',name:item.title,x:0,y:0,width:1920,height:1080,rotation:0,opacity:1,locked:true,visible:true,zIndex:1,properties:{...item.metadata,loopType:type,title:item.title,background:'#ffffff',color:'#000000'}}];return item});
 const announcements=new AnnouncementLiveController();announcements.setRecords([{messageId:'fixture-info',titel:'Beispielmeldung',beschreibung:'Aktuelle Informationen für unsere Gemeinde. Herzlich willkommen!',status:'öffentlich',messageScreen:true,qrCode:true}]);items[1].slides[0]=announcements.outputForTake(items[1],items[1].slides[0],1,new Date())!;
 const weather=items[2],observedAt='2026-11-26T08:00:00.000Z';
 const snapshot:any={version:1,key:'weather:fixture',revision:'fixture',fetchedAt:Date.now(),stale:false,payload:{kind:'weather',location:{name:'Bielefeld · Nordrhein-Westfalen · Deutschland',latitude:52.03,longitude:8.53},observedAt,temperature:-1,wind:14,code:3,isDay:true,hourly:Array.from({length:12},(_,index)=>index+1).map((offset,index)=>({time:new Date(Date.parse(observedAt)+offset*3600000).toISOString(),temperature:index,code:3,rainProbability:0,isDay:true})),days:[26,27,28].map(day=>({date:'2026-11-'+day+'T12:00:00.000Z',minimum:-3,maximum:4,code:3,rainProbability:10}))}};
 const request=requestForExternalItem(weather)!;if(request.kind!=='weather')throw Error('Expected weather fixture');snapshot.payload.location={name:request.name,latitude:request.latitude,longitude:request.longitude};snapshot.key=externalRequestKey(request);const controller=new ExternalLoopController(async()=>({status:'ready',snapshot}),()=>Date.now());await controller.prepare(request);
 weather.slides[0]=hydrateExternalLoopData(weather.slides[0],snapshot,Date.now(),externalSettingsForItem(weather));
 const song=createServiceItem('content',{sectionId:'service',title:'Lied mit drei Strophen'});song.slides=Array.from({length:3},(_,index)=>({...song.slides[0],id:'verse-'+index,order:index,title:'Strophe '+(index+1)}));
 usePresentation.setState({items:[...items,song],mode:'preview',previewLayout:'grid',gridSize:280,onAir:false,previewItemId:items[0].id,previewSlideId:items[0].slides[0].id});
 document.documentElement.dataset.theme='light';document.documentElement.dataset.reduceMotion='true';
 createRoot(document.getElementById('root')!).render(<div className="app production-app mode-preview"><div className="menubar"><span>GottesdienstRegie</span></div><div className="toolbar"><b>Sonntagsgottesdienst</b><div className="live-session-controls"><EditorModeControl/><button>Testbetrieb starten</button><button className="onair">ON AIR</button></div></div><main className="main"><aside className="service-order"><header>Ablauf</header></aside><div className="workspace-quick-host"><ExternalLoopContext.Provider value={controller}><ProductionWorkspace canEdit/></ExternalLoopContext.Provider></div></main><div className="production-timeline"><button className="timeline-toggle">Timeline</button></div><footer className="status">Bereit</footer></div>);
 (window as any).overviewFixture={showTitles:(showTitles:boolean)=>usePreviewOptions.setState({showTitles}),setWeatherNight:async()=>{snapshot.payload.isDay=false;snapshot.revision='night';await controller.prepare(request)},setGridSize:(size:number)=>usePresentation.getState().setGridSize(size)};
}
void start();
