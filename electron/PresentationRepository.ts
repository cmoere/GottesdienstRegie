import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export interface PresentationSummary {
  id:string; title:string; date:string; createdAt:string; updatedAt:string;
  archived:boolean; trashed:boolean; itemCount:number; slideCount:number;
}

const safeName=(value:string)=>value.replace(/[^a-zA-Z0-9_-]/g,'');
const now=()=>new Date().toISOString();

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
  async duplicate(id:string){const source=await this.read(id);if(!source)throw new Error('PRESENTATION_NOT_FOUND');return this.create({title:`${source.title} – Kopie`,date:source.date,template:{...source,presentationId:undefined,createdAt:undefined,updatedAt:undefined}})}
  async rename(id:string,title:string){const doc=await this.read(id);if(!doc)throw new Error('PRESENTATION_NOT_FOUND');doc.title=String(title).trim()||doc.title;await this.save(doc);return this.summary(doc)}
  async setFlag(id:string,flag:'archived'|'trashed',value:boolean){const doc=await this.read(id);if(!doc)throw new Error('PRESENTATION_NOT_FOUND');doc[flag]=value;await this.save(doc);return this.summary(doc)}
  async importDocument(sourcePath:string){const parsed=JSON.parse(await fs.readFile(sourcePath,'utf8'));const id=randomUUID();return this.create({title:parsed.title||path.basename(sourcePath,path.extname(sourcePath)),date:parsed.date,template:{...parsed,presentationId:id,createdAt:undefined,updatedAt:undefined}})}
  async exportDocument(id:string,targetPath:string){const doc=await this.read(id);if(!doc)throw new Error('PRESENTATION_NOT_FOUND');await this.atomicWrite(targetPath,doc);return targetPath}
  async backup(id:string){const doc=await this.read(id);if(!doc)throw new Error('PRESENTATION_NOT_FOUND');const stamp=now().replace(/[:.]/g,'-'),target=path.join(this.backups,`${safeName(doc.title).slice(0,40)||'presentation'}-${stamp}.grbackup`);await this.atomicWrite(target,doc);return target}
  async recoveryInfo(){const state=await this.getState();if(state.cleanShutdown!==false||!state.lastPresentationId)return null;const file=path.join(this.recovery,`${safeName(state.lastPresentationId)}.json`);try{const document=JSON.parse(await fs.readFile(file,'utf8'));return{summary:this.summary(document),document}}catch{return null}}
  async getState(){try{return JSON.parse(await fs.readFile(this.stateFile,'utf8'))}catch{return{cleanShutdown:true,lastPresentationId:''}}}
  async setState(patch:Record<string,unknown>){const current=await this.getState();await this.atomicWrite(this.stateFile,{...current,...patch});return true}
}
