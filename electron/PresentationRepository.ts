import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import JSZip from 'jszip';
import {sanitizeRecoveryDocument} from '../src/presentationRecovery';
import {atomicRename} from './atomicRename';
import {DocumentImportService,type ImportedPage} from './DocumentImportService';
import {importKeynotePath} from './KeynoteImport';

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
type ImportedTransition={type:'cut'|'fade'|'crossfade'|'dissolve'|'slide'|'wipe';durationMs:number;direction:'left'|'right'|'up'|'down';easing:'standard';reverseOnPrevious:boolean};
function importedPresentation(title:string,pages:Array<ImportedPage&{transition?:ImportedTransition}>,sourceFormat:string){
  const stamp=now(),itemId=randomUUID(),textElement=(text:string)=>({id:randomUUID(),type:'text',name:'Text',x:180,y:220,width:1560,height:640,rotation:0,opacity:1,locked:false,visible:true,zIndex:1,properties:{text,fontFamily:'Cera Pro',fontSize:58,fontWeight:600,color:'#ffffff',align:'center',verticalAlign:'center',lineHeight:1.18,padding:24}}),imageElement=(src:string)=>({id:randomUUID(),type:'image',name:'Importierte Vorschau',x:0,y:0,width:1920,height:1080,rotation:0,opacity:1,locked:false,visible:true,zIndex:1,properties:{src,fit:'contain'}});
  const slides=(pages.length?pages:[{title:'Importierte Präsentation',body:'Keine lesbaren Folieninhalte gefunden.'}]).map((page,index)=>{const id=randomUUID(),body=page.body?.trim()||page.title?.trim()||`Folie ${index+1}`;return{id,itemId,order:index,enabled:page.hidden!==true,title:page.title?.trim()||`Folie ${index+1}`,body,background:'#263640',elements:page.image?[imageElement(page.image)]:[textElement(body)],transition:'fade',transitionDuration:350,transitionOverride:page.transition??null,notes:'',timing:{}}});
  return{title,date:stamp.slice(0,10),serviceTime:'10:30',sections:[{id:'pre',title:'VORPROGRAMM',order:0},{id:'warmup',title:'WARM-UP',order:1},{id:'service',title:'GOTTESDIENST',order:2},{id:'post',title:'NACHPROGRAMM',order:3}],items:[{id:itemId,type:'content',title,section:'GOTTESDIENST',sectionId:'service',order:0,enabled:true,plannedDuration:0,metadata:{importSource:sourceFormat},slides,autoAdvance:false,repeat:false,timing:{mode:'manual',slideDurationSeconds:7,autoAdvance:false,repeat:false,shuffle:false,mediaDurationSeconds:0,totalDurationSeconds:0},notes:'',stageDirection:'',createdAt:stamp,updatedAt:stamp}]};
}
async function officePages(sourcePath:string,extension:string){
  const archive=await JSZip.loadAsync(await fs.readFile(sourcePath));
  if(extension==='.pptx'){
    const names=Object.keys(archive.files).filter(name=>/^ppt\/slides\/slide\d+\.xml$/i.test(name)).sort((a,b)=>Number(a.match(/slide(\d+)/i)?.[1])-Number(b.match(/slide(\d+)/i)?.[1]));
    return Promise.all(names.map(async(name,index)=>{const xml=await archive.file(name)!.async('string'),texts=[...xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi)].map(match=>plainXml(match[1])).filter(Boolean),transitionBlock=xml.match(/<p:transition\b[\s\S]*?<\/p:transition>|<p:transition\b[^>]*\/>/i)?.[0]??'',duration=/spd="slow"/i.test(transitionBlock)?1000:/spd="fast"/i.test(transitionBlock)?300:500,direction=(/dir="r"|from="r"/i.test(transitionBlock)?'right':/dir="u"|from="t"/i.test(transitionBlock)?'up':/dir="d"|from="b"/i.test(transitionBlock)?'down':'left') as ImportedTransition['direction'],type:ImportedTransition['type']=/<p:(?:push|pull)/i.test(transitionBlock)?'slide':/<p:(?:wipe|strips|cover|uncover)/i.test(transitionBlock)?'wipe':/<p:dissolve/i.test(transitionBlock)?'dissolve':/<p:cut/i.test(transitionBlock)?'cut':'fade',transition=transitionBlock?{type,durationMs:duration,direction,easing:'standard' as const,reverseOnPrevious:true}:undefined;return{title:texts[0]||`Folie ${index+1}`,body:texts.join('\n'),transition}}));
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
  private recoveryWrites:Promise<unknown>=Promise.resolve();
  private stateWrites:Promise<unknown>=Promise.resolve();
  private sessionStart?:Promise<{summary:PresentationSummary;document:Record<string,any>}|null>;
  constructor(private readonly root:string,private readonly documentImporter?:DocumentImportService){
    this.presentations=path.join(root,'presentations');
    this.backups=path.join(root,'backups');
    this.recovery=path.join(root,'recovery');
    this.stateFile=path.join(root,'presentation-state.json');
  }
  async initialize(){await Promise.all([fs.mkdir(this.presentations,{recursive:true}),fs.mkdir(this.backups,{recursive:true}),fs.mkdir(this.recovery,{recursive:true})])}
  private file(id:string){const clean=safeName(id);if(!clean)throw new Error('PRESENTATION_ID_INVALID');return path.join(this.presentations,`${clean}.json`)}
  private async atomicWrite(target:string,value:unknown){const temporary=`${target}.${randomUUID()}.tmp`;try{await fs.writeFile(temporary,JSON.stringify(value,null,2),'utf8');await atomicRename(temporary,target)}finally{await fs.rm(temporary,{force:true}).catch(()=>{})}}
  async list(includeArchived=false,includeTrashed=false):Promise<PresentationSummary[]>{
    await this.initialize();const names=await fs.readdir(this.presentations);const result:PresentationSummary[]=[];
    for(const name of names.filter(value=>value.endsWith('.json'))){try{const doc=JSON.parse(await fs.readFile(path.join(this.presentations,name),'utf8'));const archived=doc.archived===true,trashed=doc.trashed===true;if((archived&&!includeArchived)||(trashed&&!includeTrashed))continue;result.push(this.summary(doc))}catch{}}
    return result.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  }
  summary(doc:any):PresentationSummary{return{id:String(doc.presentationId),title:String(doc.title||'Unbenannte Präsentation'),date:String(doc.date||''),createdAt:String(doc.createdAt||now()),updatedAt:String(doc.updatedAt||now()),archived:doc.archived===true,trashed:doc.trashed===true,itemCount:Array.isArray(doc.items)?doc.items.length:0,slideCount:Array.isArray(doc.items)?doc.items.reduce((sum:number,item:any)=>sum+(Array.isArray(item.slides)?item.slides.length:0),0):0}}
  async read(id:string){try{return JSON.parse(await fs.readFile(this.file(id),'utf8'))}catch(error:any){if(error?.code==='ENOENT')return null;throw error}}
  save(document:any){
    if(!document?.presentationId)return Promise.reject(new Error('PRESENTATION_ID_REQUIRED'));
    const snapshot=JSON.parse(JSON.stringify(document));
    // Saved documents and checkpoints share invocation order. A completed save
    // invalidates only the older checkpoint for this presentation; an edit
    // checkpoint queued after it remains recoverable, even within the same ms.
    const write=this.recoveryWrites.then(async()=>{
      await this.initialize();
      const existing=await this.read(String(snapshot.presentationId));
      const value={...snapshot,title:String(snapshot.title||'Unbenannte Präsentation').slice(0,500),createdAt:existing?.createdAt??snapshot.createdAt??now(),updatedAt:now(),archived:snapshot.archived===true,trashed:snapshot.trashed===true};
      await this.atomicWrite(this.file(value.presentationId),value);
      // Both generations belong to the baseline that this successful save
      // supersedes. Keeping either would let a later corrupt checkpoint fall
      // back behind the saved document. No newer checkpoint can run mid-save.
      const recoveryRoot=path.resolve(this.recovery);
      for(const suffix of ['.json','.previous.json']){
        const target=path.resolve(recoveryRoot,`${safeName(value.presentationId)}${suffix}`);
        if(path.dirname(target)!==recoveryRoot)throw new Error('RECOVERY_PATH_INVALID');
        await fs.rm(target,{force:true});
      }
      const state=await this.getState(),recoveryId=state.recoveryPresentationId??state.lastPresentationId;
      await this.setState({lastPresentationId:value.presentationId,...(recoveryId===value.presentationId?{recoveryPresentationId:''}:{})});
      return this.summary(value);
    });
    this.recoveryWrites=write.catch(()=>{});
    return write;
  }
  async create(input:{title?:string;date?:string;template?:any}){const stamp=now(),id=randomUUID(),template=input.template??{};const document={...template,presentationId:id,title:String(input.title||'Neue Präsentation').slice(0,500),date:String(input.date||stamp.slice(0,10)),createdAt:stamp,updatedAt:stamp,archived:false,trashed:false};await this.save(document);return document}
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
  async rename(id:string,title:string){const doc=await this.read(id);if(!doc)throw new Error('PRESENTATION_NOT_FOUND');doc.title=String(title).trim().slice(0,500)||doc.title;await this.save(doc);return this.summary(doc)}
  async setFlag(id:string,flag:'archived'|'trashed',value:boolean){const doc=await this.read(id);if(!doc)throw new Error('PRESENTATION_NOT_FOUND');doc[flag]=value;await this.save(doc);return this.summary(doc)}
  async importDocument(sourcePath:string){const extension=path.extname(sourcePath).toLowerCase(),title=path.basename(sourcePath,extension);if(extension==='.key'){
 const result=await importKeynotePath(sourcePath),pages:ImportedPage[]=[];
 for(const page of result.pages){if(page.image){pages.push(page);continue}pages.push({title:page.title,body:page.body,hidden:page.hidden});for(const image of page.images??[])pages.push({title:page.title,body:image.alt??'',image:image.src,hidden:page.hidden})}
 const warnings=[...result.warnings,...(pages.length>result.pages.length?['Eingebettete Bilder wurden als zusätzliche Bildfolien übernommen.']:[])];
 return this.create({title,template:{...importedPresentation(title,pages,'key'),importReport:{sourceFormat:'key',sourcePages:result.pages.length,generatedSlides:pages.length,warnings}}});
 }if(['.one','.onepkg'].includes(extension)){
 if(!this.documentImporter)throw Error('Der lokale OneNote-Importer ist nicht verfügbar.');
 const result=await this.documentImporter.importOneNote(sourcePath),pages:ImportedPage[]=[];
 for(const original of result.pages){
  const paragraphs=(original.body??'').split(/\r?\n/),chunks:string[]=[];let chunk='';
  for(const paragraph of paragraphs){for(const word of paragraph.split(/\s+/)){if(chunk.length+word.length>950&&chunk){chunks.push(chunk);chunk=''}chunk+=(chunk?' ':'')+word}chunk+='\n'}if(chunk.trim())chunks.push(chunk.trim());
  chunks.forEach((body,index)=>pages.push({title:(original.title??'Notizseite')+(index?' · Fortsetzung '+(index+1):''),body}));
  for(const image of original.images??[])pages.push({title:original.title??'Notizbild',body:image.alt??'',image:image.src});
  if(!chunks.length&&!original.images?.length)pages.push({title:original.title,body:original.title});
 }
 const template=importedPresentation(title,pages,extension.slice(1));
 for(const slide of template.items[0].slides)for(const element of slide.elements)if(element.type==='text')Object.assign(element,{x:120,y:110,width:1680,height:860,properties:{...element.properties,fontSize:42,fontWeight:400,align:'left',verticalAlign:'top',lineHeight:1.2}});
 return this.create({title,template:{...template,importReport:{sourceFormat:extension.slice(1),sourcePages:result.pages.length,generatedSlides:pages.length,warnings:result.warnings}}});
 }if(['.pptx','.odp','.key'].includes(extension)){const pages=await officePages(sourcePath,extension);if(!pages.length)throw new Error(extension==='.key'?'KEYNOTE_PREVIEW_NOT_FOUND':'PRESENTATION_CONTENT_NOT_FOUND');return this.create({title,template:importedPresentation(title,pages,extension.slice(1))})}if(extension==='.txt'||extension==='.md'){const text=await fs.readFile(sourcePath,'utf8'),pages=text.split(/\r?\n\s*\r?\n+/).map((body,index)=>({title:body.split(/\r?\n/)[0]?.replace(/^#+\s*/,'')||`Folie ${index+1}`,body:body.replace(/^#+\s*/,'').trim()})).filter(page=>page.body);return this.create({title,template:importedPresentation(title,pages,extension.slice(1))})}const parsed=JSON.parse(await fs.readFile(sourcePath,'utf8'));const id=randomUUID();return this.create({title:parsed.title||title,date:parsed.date,template:{...parsed,presentationId:id,createdAt:undefined,updatedAt:undefined}})}
  async exportDocument(id:string,targetPath:string){const doc=await this.read(id);if(!doc)throw new Error('PRESENTATION_NOT_FOUND');await this.atomicWrite(targetPath,doc);return targetPath}
  async backup(id:string){const doc=await this.read(id);if(!doc)throw new Error('PRESENTATION_NOT_FOUND');const stamp=now().replace(/[:.]/g,'-'),target=path.join(this.backups,`${safeName(doc.title).slice(0,40)||'presentation'}-${stamp}.grbackup`);await this.atomicWrite(target,doc);return target}
  private async readRecovery(file:string,id:string){try{const document=sanitizeRecoveryDocument(JSON.parse(await fs.readFile(file,'utf8')));return document&&document.presentationId===id?document:null}catch{return null}}
  async recoveryInfo(){
    const state=await this.getState(),id=state.recoveryPresentationId??state.lastPresentationId;
    if(state.cleanShutdown!==false||!id)return null;
    for(const suffix of ['.json','.previous.json']){
      const document=await this.readRecovery(path.join(this.recovery,`${safeName(id)}${suffix}`),id);
      if(document)return{summary:this.summary(document),document};
    }
    return null;
  }
  beginSession(){
    return this.sessionStart??=(async()=>{
      await this.initialize();
      const recovery=await this.recoveryInfo();
      await this.setState({cleanShutdown:false,...(recovery?{}:{recoveryPresentationId:''})});
      return recovery;
    })();
  }
  saveRecovery(input:unknown){
    const document=sanitizeRecoveryDocument(input);
    if(!document)return Promise.reject(new Error('RECOVERY_DOCUMENT_INVALID'));
    // Capture at the IPC boundary, before a queued write can observe later edits.
    const snapshot=JSON.parse(JSON.stringify(document));
    const write=this.recoveryWrites.then(async()=>{
      await this.initialize();
      const id=snapshot.presentationId,target=path.join(this.recovery,`${safeName(id)}.json`);
      const previous=await this.readRecovery(target,id);
      if(previous)await this.atomicWrite(path.join(this.recovery,`${safeName(id)}.previous.json`),previous);
      await this.atomicWrite(target,snapshot);
      await this.setState({recoveryPresentationId:id,cleanShutdown:false});
      return true;
    });
    this.recoveryWrites=write.catch(()=>{});
    return write;
  }
  markClean(){const clean=this.recoveryWrites.then(()=>this.setState({cleanShutdown:true}));this.recoveryWrites=clean.catch(()=>{});return clean}
  async getState(){try{return JSON.parse(await fs.readFile(this.stateFile,'utf8'))}catch{return{cleanShutdown:true,lastPresentationId:''}}}
  setState(patch:Record<string,unknown>){const write=this.stateWrites.then(async()=>{await this.initialize();const current=await this.getState();await this.atomicWrite(this.stateFile,{...current,...patch});return true});this.stateWrites=write.catch(()=>{});return write}
}
