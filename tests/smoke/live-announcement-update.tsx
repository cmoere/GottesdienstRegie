import {createRoot} from 'react-dom/client';
import {SlideRenderer} from '../../src/SlideRenderer';
import {prepareAnnouncementPages} from '../../src/announcementDesign';
import {buildAnnouncementSlide} from '../../src/announcementLive';
import {AnnouncementBanner} from '../../src/AnnouncementBanner';
import {BANNER_SEPARATOR} from '../../src/announcementBannerSession';
import {AnnouncementBannerController,useAnnouncementBanner} from '../../src/AnnouncementBannerController';
import {createServiceItem,usePresentation} from '../../src/store';
import {useLiveOutputPreview} from '../../src/liveOutputPreview';
import {ServiceOnAirReminder} from '../../src/ServiceOnAirReminder';
import {usePreferences} from '../../src/preferences';
import '../../src/cera-pro.css';
import '../../src/styles.css';
import '../../src/version80-announcements.css';
import '../../src/outputComposition.css';
const root=createRoot(document.getElementById('root')!);
const body='<p><b>Wichtige Gemeindemeldung mit ÄÖÜ.</b></p><p>'+('Alle Informationen bleiben vollständig lesbar. '.repeat(90))+'</p><p><u>ENDE DER MELDUNG</u></p>';
const base={id:'notice',itemId:'notice',order:0,enabled:true,title:'',body:'',background:'#000',elements:[],transition:'none',transitionDuration:0,notes:''};
async function notice(design:string,phase:boolean|'return'|'top'=false){
 await Promise.all([document.fonts.load('400 44px "Cera Pro"'),document.fonts.load('600 56px "Cera Pro"'),document.fonts.load('700 44px "Cera Pro"')]);
 const page=prepareAnnouncementPages({title:'Aktuelles aus der Gemeinde',body,qrCode:true,qrSize:360,design})[0];
 const slide=buildAnnouncementSlide(base,{title:'Aktuelles aus der Gemeinde',text:body,durationMs:15000,qrReference:'https://example.org/meldung'},page,0,1);
 const plan=page.scrollPlan;
 const elapsed=phase==='return'?plan.startPauseMs+plan.travelMs+plan.endPauseMs+plan.travelMs/2:phase==='top'?plan.minDurationMs+plan.startPauseMs/2:phase?plan.startPauseMs+plan.travelMs+plan.endPauseMs/2:0;
 Object.assign(slide,{_countdownStartedAtMs:Date.now()-elapsed});
 root.render(<div style={{width:'100vw',height:'100vh'}}><SlideRenderer slide={slide} mode="mirror"/></div>);
 return {duration:slide.timing!.durationSeconds,distance:page.scrollPlan.distance,minimum:page.scrollPlan.minDurationMs};
}
async function banner(elapsed:number){
 await document.fonts.load('700 44px "Cera Pro"');
 const items=[{id:'a',text:'Konzertveranstaltung',priority:'normal' as const},{id:'b',text:'PGB: Gottesdienst',priority:'normal' as const}];
 const context=document.createElement('canvas').getContext('2d')!;
 context.font='700 44px "Cera Pro", system-ui';context.letterSpacing='-0.44px';
 const textWidth=items.reduce((width,item)=>width+context.measureText(item.text).width+context.measureText(BANNER_SEPARATOR).width,0);
 root.render(<div style={{width:'100vw',height:84,containerType:'inline-size'}}><AnnouncementBanner state={{revision:1,position:'top',items,cycleStartedAtMs:0,reserved:true,textWidth}} nowMs={elapsed} reducedMotion={false}/></div>);
}
function MeasuredBanner(){const state=useAnnouncementBanner(value=>value.banner);return <div style={{width:'100vw',height:84,containerType:'inline-size'}}>{state&&<AnnouncementBanner state={state} nowMs={state.cycleStartedAtMs} reducedMotion={false}/>}</div>}
async function longBanner(){
 await document.fonts.load('700 44px "Cera Pro"');
 const item=createServiceItem('content',{sectionId:'pre'});
 const start=new Date(Date.now()+19*60000),pad=(value:number)=>String(value).padStart(2,'0');
 const event={eventKey:'reminder-fixture',titel:'Gottesdienst',start_datum:`${start.getFullYear()}-${pad(start.getMonth()+1)}-${pad(start.getDate())}`,start_uhrzeit:`${pad(start.getHours())}:${pad(start.getMinutes())}`};
 window.desktop={community:{onEvents:(listener:any)=>{listener([event]);return()=>{}},onRooms:()=>()=>{},onConnection:()=>()=>{},onAnnouncements:(listener:any)=>{listener([{messageId:'long',status:'public',showMeldungBanner:true,textBanner:'Gemeindeinformationen '.repeat(350)}]);return()=>{}},start:async()=>{}}} as any;
 usePresentation.setState({onAir:true,items:[item]});useLiveOutputPreview.setState({slide:{...item.slides[0],bannerContext:{liveSection:'pre',countdownActive:false}}});
 root.render(<><AnnouncementBannerController quick={null}/><MeasuredBanner/></>);
}
function reminder(onAir=false){
 usePreferences.setState({language:'de',germanRegion:null});
 usePresentation.setState({onAir,eventLink:{eventKey:'reminder-fixture'}});
 root.render(<ServiceOnAirReminder/>);
}
Object.assign(window,{liveAnnouncementUpdate:{notice,banner,longBanner,reminder}});
