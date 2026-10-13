import type {ServiceItem,Slide} from './store';
import {AnnouncementService,type RawAnnouncement} from './community/AnnouncementService';
import type {AnnouncementPlacement} from './loopData';
import QRCode from 'qrcode';

function plainText(value:string):string{
  const doc=new DOMParser().parseFromString(value.replace(/<br\s*\/?\s*>|<\/(?:p|div|li|h[1-6])>/gi,'\n'),'text/html');
  doc.querySelectorAll('script,style,iframe,object,embed').forEach(node=>node.remove());
  return (doc.body.textContent??'').trim();
}
function qrImage(reference:string):string{
  const {modules}=QRCode.create(reference),size=modules.size;
  const cells:string[]=[];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(modules.get(y,x))cells.push(`M${x+4},${y+4}h1v1h-1z`);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size+8} ${size+8}"><path fill="white" d="M0 0h${size+8}v${size+8}H0z"/><path fill="black" d="${cells.join('')}"/></svg>`)}`;
}

export function announcementPlacement(sectionId:string):AnnouncementPlacement{return sectionId==='post'||sectionId==='postLoop'?'postLoop':'preLoop'}
export function isAnnouncementLoop(item:ServiceItem|undefined):item is ServiceItem{return item?.type==='announcement'&&item.itemCategory==='loop'}
export class AnnouncementLiveController {
  private records:RawAnnouncement[]=[];
  private readonly service=new AnnouncementService();
  private readonly nextIndex=new Map<string,number>();
  private takeKey='';
  private output:Slide|null=null;
  setRecords(records:RawAnnouncement[]){this.records=structuredClone(records)}
  hasEligible(item:ServiceItem,now=new Date()){return this.service.getForPlacement(this.records,now,announcementPlacement(item.sectionId)).length>0}
  outputForTake(item:ServiceItem,slide:Slide,revision:number,now=new Date()):Slide|null{
    const key=`${item.id}:${slide.id}:${revision}`;
    if(key===this.takeKey)return this.output;
    this.takeKey=key;
    const rows=this.service.getForPlacement(this.records,now,announcementPlacement(item.sectionId));
    if(!rows.length){this.output=null;return null}
    const index=(this.nextIndex.get(item.id)??0)%rows.length,message=rows[index];
    this.nextIndex.set(item.id,index+1);
    const title=plainText(message.title),body=plainText(message.text),text=[title,body].filter(Boolean).join('\n\n');
    this.output={...structuredClone(slide),title,body,background:'#18232f',backgroundImage:undefined,notes:'',timing:{...slide.timing,durationSeconds:message.durationMs/1000},elements:[{
      id:`${slide.id}-public-announcement`,type:'text',name:'Öffentliche Meldung',x:150,y:140,width:message.qrCode?1250:1620,height:800,rotation:0,opacity:1,locked:true,visible:true,zIndex:1,
      properties:{text,fontFamily:'Inter',fontSize:56,fontWeight:600,color:'#ffffff',align:'center',verticalAlign:'center',lineHeight:1.2,padding:32},
    }]};
    if(message.qrCode&&message.qrReference)this.output.elements.push({id:`${slide.id}-public-announcement-qr`,type:'qr',name:'Meldungs-QR-Code',x:1500,y:400,width:280,height:280,rotation:0,opacity:1,locked:true,visible:true,zIndex:2,properties:{src:qrImage(message.qrReference),text:message.qrReference}});
    return this.output;
  }
}
