import type {ServiceItem,Slide} from './store';
import {AnnouncementService,type RawAnnouncement} from './community/AnnouncementService';
import type {AnnouncementPlacement} from './loopData';
import QRCode from 'qrcode';
import {prepareAnnouncementPages,announcementTextElement,type PreparedAnnouncementPage} from './announcementDesign';
import {announcementRuns,announcementRunsText} from './announcementRichText';
import {announcementSettings,configuredAnnouncements} from './announcementSettings';

export function announcementPlainText(value:string):string{
  return announcementRunsText(announcementRuns(value)).trim();
}
function qrImage(reference:string):string{
  const {modules}=QRCode.create(reference),size=modules.size;
  const cells:string[]=[];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(modules.get(y,x))cells.push(`M${x+4},${y+4}h1v1h-1z`);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size+8} ${size+8}"><path fill="white" d="M0 0h${size+8}v${size+8}H0z"/><path fill="black" d="${cells.join('')}"/></svg>`)}`;
}

export function announcementPlacement(sectionId:string):AnnouncementPlacement{return sectionId==='post'||sectionId==='postLoop'?'postLoop':'preLoop'}
export function isAnnouncementLoop(item:ServiceItem|undefined):item is ServiceItem{return item?.type==='announcement'&&item.itemCategory==='loop'}
export function buildAnnouncementSlide(slide:Slide,message:{title:string;text:string;durationMs:number;qrCode?:boolean;qrReference?:string},page:PreparedAnnouncementPage,index:number,count:number,readingSeconds=0):Slide{
 const title=announcementPlainText(message.title),elements=page.decorations.map((decoration,n)=>({id:`${slide.id}-announcement-decoration-${n}`,type:'shape' as const,name:'Meldungsdesign',...decoration,rotation:0,opacity:1,locked:true,visible:true,zIndex:1,properties:{fill:decoration.fill,shapeKind:'rectangle'}}));
 const textElements=[
  announcementTextElement(`${slide.id}-announcement-title`,'Meldungstitel',page.titleElement,page.titleText,page.titleFontSize,page.color,600,page.titleRichLines),
  announcementTextElement(`${slide.id}-announcement-body`,'Meldungstext',page.bodyElement,page.bodyLines.join('\n'),page.bodyFontSize,page.color,400,page.bodyRichLines),
 ];
 const readingMs=Math.max(12000,page.bodyText.length*80+4000);
 const durationMs=readingSeconds>0?Math.max(readingSeconds*1000,count>1?readingMs:0):count>1?Math.max(message.durationMs/count,readingMs):message.durationMs;
 const scrollMinimum=page.scrollPlan.distance>0?page.scrollPlan.minDurationMs:0;
 if(scrollMinimum>0)Object.assign(textElements[1].properties,{announcementScrollHeight:page.bodyHeight,announcementViewportHeight:page.bodyElement.height});
 const output:Slide={...structuredClone(slide),title,body:page.bodyText,background:page.background,backgroundImage:undefined,notes:'',timing:{...slide.timing,durationSeconds:Math.ceil(Math.max(durationMs,scrollMinimum)/1000)},elements:[...elements,...textElements]};
 if(count>1)output.elements.push(announcementTextElement(`${slide.id}-announcement-page`,'Meldungsseite',{x:130,y:990,width:1250,height:45},`${index+1} / ${count}`,24,page.color,400));
 if(page.qrElement&&message.qrReference)output.elements.push({id:`${slide.id}-public-announcement-qr`,type:'qr',name:'Meldungs-QR-Code',...page.qrElement,rotation:0,opacity:1,locked:true,visible:true,zIndex:2,properties:{src:qrImage(message.qrReference),text:message.qrReference}});
 return output;
}
export class AnnouncementLiveController {
  private records:RawAnnouncement[]=[];
  private readonly service=new AnnouncementService();
  private readonly nextIndex=new Map<string,number>();
  private readonly continuation=new Map<string,{messageId:string;signature:string;page:number}>();
  private takeKey='';
  private output:Slide|null=null;
  setRecords(records:RawAnnouncement[]){this.records=structuredClone(records)}
  hasEligible(item:ServiceItem,now=new Date()){return configuredAnnouncements(this.service.getForPlacement(this.records,now,announcementPlacement(item.sectionId)),item.metadata).length>0}
  hasContinuation(itemId:string){return this.continuation.has(itemId)}
  outputForTake(item:ServiceItem,slide:Slide,revision:number,now=new Date()):Slide|null{
    const key=`${item.id}:${slide.id}:${revision}`;
    if(key===this.takeKey)return this.output;
    this.takeKey=key;
    const settings=announcementSettings(item.metadata),rows=configuredAnnouncements(this.service.getForPlacement(this.records,now,announcementPlacement(item.sectionId)),item.metadata);
    if(!rows.length){this.output=null;this.continuation.delete(item.id);return null}
    const pending=this.continuation.get(item.id),continuedIndex=pending?rows.findIndex(row=>row.id===pending.messageId):-1;
    const index=continuedIndex>=0?continuedIndex:(this.nextIndex.get(item.id)??0)%rows.length,message=rows[index];
    const title=message.title.trim(),body=message.text.trim(),qrCode=message.qrCode&&settings.qrEnabled,signature=JSON.stringify([title,body,qrCode,item.metadata.announcementDesign]);
    const pages=prepareAnnouncementPages({title,body,qrCode,qrSize:settings.qrSize,design:item.metadata.announcementDesign});
    const page=pending?.signature===signature?Math.min(pending.page,pages.length-1):0;
    if(page+1<pages.length)this.continuation.set(item.id,{messageId:message.id,signature,page:page+1});
    else{this.continuation.delete(item.id);this.nextIndex.set(item.id,index+1)}
    this.output=buildAnnouncementSlide(slide,message,pages[page],page,pages.length,settings.readingSeconds);
    return this.output;
  }
}
