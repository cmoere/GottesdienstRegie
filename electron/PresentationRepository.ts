import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import JSZip from 'jszip';

export interface PresentationSummary {
  id:string; title:string; date:string; createdAt:string; updatedAt:string;
  archived:boolean; trashed:boolean; itemCount:number; slideCount:number;
}

export interface DuplicatePresentationOptions {
  title?:string;
  date?:string;
  keepServiceTime?:boolean;
  keepMediaReferences?:boolean;
  keepTargetStartTimes?:boolean;
}

const safeName=(value:string)=>value.replace(/[^a-zA-Z0-9_-]/g,'');
const now=()=>new Date().toISOString();
const decodeXml=(value:string)=>value.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
const plainXml=(value:string)=>decodeXml(value.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());
function importedPresentation(title:string,pages:Array<{title?:string;body?:string;image?:string}>,sourceFormat:string){
  const stamp=now(),itemId=randomUUID(),textElement=(text:string)=>({id:randomUUID(),type:'text',name:'Text',x:180,y:220,width:1560,height:640,rotation:0,opacity:1,locked:false,visible:true,zIndex:1,properties:{text,fontFamily:'Inter',fontSize:58,fontWeight:600,color:'#ffffff',align:'center',verticalAlign:'center',lineHeight:1.18,padding:24}}),imageElement=(src:string)=>({id:randomUUID(),type:'image',name:'Importierte Vorschau',x:0,y:0,width:1920,height:1080,rotation:0,opacity:1,locked:false,visible:true,zIndex:1,properties:{src,fit:'contain'}});
  const slides=(pages.length?pages:[{title:'Importierte Präsentation',body:'Keine lesbaren Folieninhalte gefunden.'}]).map((page,index)=>{const id=randomUUID(),body=page.body?.trim()||page.title?.trim()||`Folie ${index+1}`;return{id,itemId,order:index,enabled:true,title:page.title?.trim()||`Folie ${index+1}`,body,background:'#263640',elements:page.image?[imageElement(page.image)]:[textElement(body)],transition:'fade',transitionDuration:350,notes:'',timing:{}}});
  return{title,date:stamp.slice(0,10),serviceTime:'10:30',sections:[{id:'pre',title:'VORPROGRAMM',order:0},{id:'warmup',title:'WARM-UP',order:1},{id:'service',title:'GOTTESDIENST',order:2},{id:'post',title:'NACHPROGRAMM',order:3}],items:[{id:itemId,type:'content',title,section:'GOTTESDIENST',sectionId:'service',order:0,enabled:true,plannedDuration:0,metadata:{importSource:sourceFormat},slides,autoAdvance:false,repeat:false,timing:{mode:'manual',slideDurationSeconds:7,autoAdvance:false,repeat:false,shuffle:false,mediaDurationSeconds:0,totalDurationSeconds:0},notes:'',stageDirection:'',createdAt:stamp,updatedAt:stamp}]};
}
async function officePages(sourcePath:string,extension:string){
  const archive=await JSZip.loadAsync(await fs.readFile(sourcePath));
  if(extension==='.pptx'){
    const names=Object.keys(archive.files).filter(name=>/^ppt\/slides\/slide\d+\.xml$/i.test(name)).sort((a,b)=>Number(a.match(/slide(\d+)/i)?.[1])-Number(b.match(/slide(\d+)/i)?.[1]));
    return Promise.all(names.map(async(name,index)=>{const xml=await archive.file(name)!.async('string'),texts=[...xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi)].map(match=>plainXml(match[1])).filter(Boolean);return{title:texts[0]||`Folie ${index+1}`,body:texts.join('\n')}}));
  }
  if(extension==='.odp'){
    const xml=await archive.file('content.xml')?.async('string');if(!xml)return[];
    return [...xml.matchAll(/<draw:page\b[\s\S]*?<\/draw:page>/gi)].map((match,index)=>{const paragraphs=[...match[0].matchAll(/<text:p\b[^>]*>([\s\S]*?)<\/text:p>/gi)].map(value=>plainXml(value[1])).filter(Boolean);return{title:paragraphs[0]||`Folie ${index+1}`,body:paragraphs.join('\n')}});
  }
  const previews=Object.keys(archive.files).filter(name=>/(^|\/)(preview|quicklook)[^/]*\.(png|jpe?g)$/i.test(name)).sort((a,b)=>b.localeCompare(a));
  const preview=previews[0];if(!preview)return[];const extensionName=path.extname(preview).toLowerCase(),mime=extensionName==='.png'?'image/png':'image/jpeg',base64=await archive.file(preview)!.async('base64');return[{title:'Keynote-Vorschau',body:'',image:`data:${mime};base64,${base64}`}];
}

export class PresentationRepository {
  private readonly presentations:string;
  private readonly backups:string;
  private readonly recovery:string;
  private readonly stateFile:string;
  constructor(private readonly root:string){
    this.presentations=path.join(root,'presentations');
    this.backups=path.join(root,'backups');
    this.recovery=path.join(root,'recovery');
    this.stateFile=path.join(root,'presentation-state.json');
  }
  async initialize(){await Promise.all([fs.mkdir(this.presentations,{recursive:true}),fs.mkdir(this.backups,{recursive:true}),fs.mkdir(this.recovery,{recursive:true})])}
  private file(id:string){const clean=safeName(id);if(!clean)throw new Error('PRESENTATION_ID_INVALID');return path.join(this.presentations,`${clean}.json`)}
  private async atomicWrite(target:string,value:unknown){const temporary=`${target}.${process.pid}.tmp`;await fs.writeFile(temporary,JSON.stringify(value,null,2),'utf8');await fs.rename(temporary,target)}
  async list(includeArchived=false,includeTrashed=false):Promise<PresentationSummary[]>{
    await this.initialize();const names=await fs.readdir(this.presentations);const result:PresentationSummary[]=[];
    for(const name of names.filter(value=>value.endsWith('.json'))){try{const doc=JSON.parse(await fs.readFile(path.join(this.presentations,name),'utf8'));const archived=doc.archived===true,trashed=doc.trashed===true;if((archived&&!includeArchived)||(trashed&&!includeTrashed))continue;result.push(this.summary(doc))}catch{}}
    return result.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  }
  summary(doc:any):PresentationSummary{return{id:String(doc.presentationId),title:String(doc.title||'Unbenannte Präsentation'),date:String(doc.date||''),createdAt:String(doc.createdAt||now()),updatedAt:String(doc.updatedAt||now()),archived:doc.archived===true,trashed:doc.trashed===true,itemCount:Array.isArray(doc.items)?doc.items.length:0,slideCount:Array.isArray(doc.items)?doc.items.reduce((sum:number,item:any)=>sum+(Array.isArray(item.slides)?item.slides.length:0),0):0}}
  async read(id:string){try{return JSON.parse(await fs.readFile(this.file(id),'utf8'))}catch(error:any){if(error?.code==='ENOENT')return null;throw error}}
  async save(document:any){await this.initialize();if(!document?.presentationId)throw new Error('PRESENTATION_ID_REQUIRED');const existing=await this.read(String(document.presentationId));const value={...document,createdAt:existing?.createdAt??document.createdAt??now(),updatedAt:now(),archived:document.archived===true,trashed:document.trashed===true};await this.atomicWrite(this.file(value.presentationId),value);await this.atomicWrite(path.join(this.recovery,`${safeName(value.presentationId)}.json`),value);await this.setState({lastPresentationId:value.presentationId,cleanShutdown:false});return this.summary(value)}
  async create(input:{title?:string;date?:string;template?:any}){const stamp=now(),id=randomUUID(),template=input.template??{};const document={...template,presentationId:id,title:String(input.title||'Neue Präsentation'),date:String(input.date||stamp.slice(0,10)),createdAt:stamp,updatedAt:stamp,archived:false,trashed:false};await this.save(document);return document}
  async duplicate(id:string,options:DuplicatePresentationOptions={}){
    const source=await this.read(id);if(!source)throw new Error('PRESENTATION_NOT_FOUND');
    const sectionIds=new Map<string,string>();
    const sections=(Array.isArray(source.sections)?source.sections:[]).map((section:any)=>{const nextId=randomUUID();sectionIds.set(String(section.id),nextId);return{...section,id:nextId}});
    const items=(Array.isArray(source.items)?source.items:[]).map((item:any)=>{const nextId=randomUUID();return{...item,id:nextId,sectionId:sectionIds.get(String(item.sectionId))??item.sectionId,metadata:options.keepMediaReferences===false?{...item.metadata,assetId:undefined,url:undefined}:item.metadata,slides:(Array.isArray(item.slides)?item.slides:[]).map((slide:any)=>({...slide,id:randomUUID(),itemId:nextId,elements:(Array.isArray(slide.elements)?slide.elements:[]).map((element:any)=>({...element,id:randomUUID()}))}))}});
    const template={...source,sections,items,presentationId:undefined,createdAt:undefined,updatedAt:undefined,selectedItemId:undefined,selectedSlideId:undefined,previewItemId:undefined,previewSlideId:undefined};
    if(options.keepServiceTime===false)template.serviceTime='10:30';
    if(options.keepTargetStartTimes===false)template.targetStartTimes=undefined;
    return this.create({title:options.title||`${source.title} – Kopie`,date:options.date||source.date,template});
  }
  async rename(id:string,title:string){const doc=await this.read(id);if(!doc)throw new Error('PRESENTATION_NOT_FOUND');doc.title=String(title).trim()||doc.title;await this.save(doc);return this.summary(doc)}
  async setFlag(id:string,flag:'archived'|'trashed',value:boolean){const doc=await this.read(id);if(!doc)throw new Error('PRESENTATION_NOT_FOUND');doc[flag]=value;await this.save(doc);return this.summary(doc)}
  async importDocument(sourcePath:string){const extension=path.extname(sourcePath).toLowerCase(),title=path.basename(sourcePath,extension);if(['.pptx','.odp','.key'].includes(extension)){const pages=await officePages(sourcePath,extension);if(!pages.length)throw new Error(extension==='.key'?'KEYNOTE_PREVIEW_NOT_FOUND':'PRESENTATION_CONTENT_NOT_FOUND');return this.create({title,template:importedPresentation(title,pages,extension.slice(1))})}if(extension==='.txt'||extension==='.md'){const text=await fs.readFile(sourcePath,'utf8'),pages=text.split(/\r?\n\s*\r?\n+/).map((body,index)=>({title:body.split(/\r?\n/)[0]?.replace(/^#+\s*/,'')||`Folie ${index+1}`,body:body.replace(/^#+\s*/,'').trim()})).filter(page=>page.body);return this.create({title,template:importedPresentation(title,pages,extension.slice(1))})}const parsed=JSON.parse(await fs.readFile(sourcePath,'utf8'));const id=randomUUID();return this.create({title:parsed.title||title,date:parsed.date,template:{...parsed,presentationId:id,createdAt:undefined,updatedAt:undefined}})}
  async exportDocument(id:string,targetPath:string){const doc=await this.read(id);if(!doc)throw new Error('PRESENTATION_NOT_FOUND');await this.atomicWrite(targetPath,doc);return targetPath}
  async backup(id:string){const doc=await this.read(id);if(!doc)throw new Error('PRESENTATION_NOT_FOUND');const stamp=now().replace(/[:.]/g,'-'),target=path.join(this.backups,`${safeName(doc.title).slice(0,40)||'presentation'}-${stamp}.grbackup`);await this.atomicWrite(target,doc);return target}
  async recoveryInfo(){const state=await this.getState();if(state.cleanShutdown!==false||!state.lastPresentationId)return null;const file=path.join(this.recovery,`${safeName(state.lastPresentationId)}.json`);try{const document=JSON.parse(await fs.readFile(file,'utf8'));return{summary:this.summary(document),document}}catch{return null}}
  async getState(){try{return JSON.parse(await fs.readFile(this.stateFile,'utf8'))}catch{return{cleanShutdown:true,lastPresentationId:''}}}
  async setState(patch:Record<string,unknown>){const current=await this.getState();await this.atomicWrite(this.stateFile,{...current,...patch});return true}
}
