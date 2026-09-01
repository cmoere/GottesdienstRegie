import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

export interface MediaAsset{id:string;name:string;fileName:string;url:string;kind:'image'|'video'|'audio'|'pdf';extension:string;size:number;checksum:string;createdAt:string;updatedAt:string;favorite:boolean;tags:string[];syncState:'local-only'|'uploading'|'synced'|'error';github?:{repository:string;path:string;sha:string;downloadUrl:string}}
const kindFor=(extension:string):MediaAsset['kind']=>['.mp4','.mov','.webm','.m4v'].includes(extension)?'video':['.mp3','.wav','.m4a','.ogg','.flac'].includes(extension)?'audio':extension==='.pdf'?'pdf':'image';
export class MediaRepository{
  readonly directory:string;private readonly indexFile:string;
  constructor(root:string){this.directory=path.join(root,'files');this.indexFile=path.join(root,'index.json')}
  async initialize(){await fs.mkdir(this.directory,{recursive:true})}
  async list():Promise<MediaAsset[]>{await this.initialize();try{return(JSON.parse(await fs.readFile(this.indexFile,'utf8')) as MediaAsset[]).map(item=>({...item,updatedAt:item.updatedAt??item.createdAt,syncState:item.syncState??'local-only'}))}catch{return[]}}
  private async save(items:MediaAsset[]){const temporary=`${this.indexFile}.${process.pid}.tmp`;await fs.writeFile(temporary,JSON.stringify(items,null,2),'utf8');await fs.rename(temporary,this.indexFile)}
  async import(paths:string[]){await this.initialize();const items=await this.list(),added:MediaAsset[]=[];for(const source of paths){const data=await fs.readFile(source),checksum=createHash('sha256').update(data).digest('hex'),extension=path.extname(source).toLowerCase(),existing=items.find(item=>item.checksum===checksum);if(existing){added.push(existing);continue}const fileName=`${checksum}${extension}`,target=path.join(this.directory,fileName);await fs.writeFile(target,data);const stat=await fs.stat(target),stamp=new Date().toISOString(),asset:MediaAsset={id:randomUUID(),name:path.basename(source,extension),fileName,url:`gottesdienst-media://media/${fileName}`,kind:kindFor(extension),extension:extension.slice(1).toUpperCase(),size:stat.size,checksum,createdAt:stamp,updatedAt:stamp,favorite:false,tags:[],syncState:'local-only'};items.push(asset);added.push(asset)}await this.save(items);return added}
  async update(id:string,patch:Partial<Pick<MediaAsset,'name'|'favorite'|'tags'|'syncState'|'github'>>){const items=await this.list(),index=items.findIndex(item=>item.id===id);if(index<0)throw new Error('MEDIA_NOT_FOUND');items[index]={...items[index],...patch,updatedAt:new Date().toISOString()};await this.save(items);return items[index]}
  async data(id:string){const asset=(await this.list()).find(item=>item.id===id);if(!asset)throw new Error('MEDIA_NOT_FOUND');return{asset,data:await fs.readFile(path.join(this.directory,asset.fileName))}}
  async remove(id:string){const items=await this.list(),asset=items.find(item=>item.id===id);if(!asset)return false;await fs.unlink(path.join(this.directory,asset.fileName)).catch(()=>{});await this.save(items.filter(item=>item.id!==id));return true}
}
