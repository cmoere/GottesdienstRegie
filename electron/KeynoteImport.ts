import JSZip from 'jszip';
import type {Readable} from 'node:stream';
import fs from 'node:fs/promises';
import path from 'node:path';
import {gunzip} from 'node:zlib';
import {promisify} from 'node:util';
import {importKeynoteXml} from './KeynoteXmlImport';
import {KeynoteArchives,TSPArchiveMessages,uncompress} from 'keynote-archives';
import {setImmediate as yieldToMain} from 'node:timers/promises';
import type {DocumentImportResult,ImportedPage} from './DocumentImportService';
type RecordEntry={name:string;data:any};
const LIMIT=32*1024*1024;
function variable(bytes:Uint8Array,start:number):{value:number;next:number}{let value=0,multiple=1;for(let pos=start;pos<Math.min(bytes.length,start+5);pos++){const byte=bytes[pos];value+=(byte&127)*multiple;if(!(byte&128)){if(value>LIMIT)throw Error('Keynote-Datenblock ist zu groß.');return{value,next:pos+1}}multiple*=128}throw Error('Ungültige Keynote-Datenlänge.')}
async function entryBytes(entry:JSZip.JSZipObject,limit=LIMIT):Promise<Buffer>{
 return new Promise<Buffer>((resolve,reject)=>{const chunks:Buffer[]=[];let size=0,failed=false;const stream=entry.nodeStream('nodebuffer') as Readable;stream.on('data',chunk=>{if(failed)return;const bytes=Buffer.from(chunk);size+=bytes.length;if(size>limit){failed=true;stream.pause();stream.destroy?.();reject(Error('Keynote-Dateieintrag ist zu groß.'))}else chunks.push(bytes)});stream.on('error',reject);stream.on('end',()=>{if(!failed)resolve(Buffer.concat(chunks))})});
}
async function archiveEntries(bytes:Buffer){
 const zip=await JSZip.loadAsync(bytes),entries=Object.values(zip.files);if(entries.length>10000)throw Error('Zu viele Keynote-Dateieinträge.');let declared=0;
 for(const entry of entries){const name=(entry as any).unsafeOriginalName??entry.name;if(name.includes('\\')||name.startsWith('/')||name.includes(':')||name.split('/').includes('..'))throw Error('Ungültiger Keynote-Dateipfad.');const size=Number((entry as any)._data?.uncompressedSize??0);declared+=size;if(size>LIMIT||declared>256*1024*1024)throw Error('Entpackte Keynote-Datei ist zu groß.')}
 return zip;
}
export async function importKeynote(bytes:Buffer):Promise<DocumentImportResult>{
 if(bytes.length>128*1024*1024)throw Error('Die Keynote-Datei ist zu groß.');const zip=await archiveEntries(bytes);let index=zip;
 const legacy=zip.file('index.apxl')??zip.file('index.xml')??zip.file('index.apxl.gz');if(legacy){const raw=await entryBytes(legacy),xml=legacy.name.endsWith('.gz')?await promisify(gunzip)(raw,{maxOutputLength:LIMIT}):raw;return importKeynoteXml(xml.toString('utf8'))}
 if(zip.file('Index.zip'))index=await archiveEntries(await entryBytes(zip.file('Index.zip')!));
 const map=new Map<string,RecordEntry[]>(),warnings=new Set<string>(['Keynote-Inhalte werden lokal in der Folienreihenfolge übernommen. Komplexe Layouts, Schriftformatierung, Animationen und Übergänge können abweichen.']),dataFiles=new Map<string,string>();let objects=0,expanded=0;
 for(const entry of Object.values(index.files).filter(entry=>!entry.dir&&entry.name.endsWith('.iwa'))){
  const compressed=await entryBytes(entry),pieces:Buffer[]=[];
  for(let cursor=0;cursor<compressed.length;){if(cursor+4>compressed.length||compressed[cursor]!==0)throw Error('Ungültiger Keynote-Kompressionsblock.');const size=compressed.readUIntLE(cursor+1,3);cursor+=4;if(!size||cursor+size>compressed.length)throw Error('Unvollständige Keynote-Datei.');const block=compressed.subarray(cursor,cursor+size),expected=variable(block,0).value;expanded+=expected;if(expanded>256*1024*1024)throw Error('Keynote-Inhalt ist zu groß.');const raw=Buffer.from(await uncompress(block));if(raw.length!==expected)throw Error('Ungültige Keynote-Kompressionslänge.');pieces.push(raw);cursor+=size}
  const raw=Buffer.concat(pieces);let cursor=0;
  while(cursor<raw.length){
   const length=variable(raw,cursor);cursor=length.next;if(cursor+length.value>raw.length)throw Error('Unvollständiger Keynote-Index.');const info=TSPArchiveMessages.ArchiveInfo.fromBinary(raw.subarray(cursor,cursor+length.value));cursor+=length.value;
   const records:RecordEntry[]=[];for(const message of info.messageInfos){if(!Number.isSafeInteger(message.length)||message.length<0||cursor+message.length>raw.length)throw Error('Ungültige Keynote-Nachricht.');const body=raw.subarray(cursor,cursor+message.length);cursor+=message.length;const schema=(KeynoteArchives as unknown as Record<number,{typeName:string;fromBinary:(data:Uint8Array)=>unknown}>)[message.type];if(!schema){warnings.add('Ein nicht unterstützter Keynote-Objekttyp wurde ausgelassen.');continue}try{const data:any=schema.fromBinary(body);records.push({name:schema.typeName,data});for(const item of data.datas??[]){if(item.identifier!==undefined&&typeof(item.fileName??item.preferredFileName)==='string')dataFiles.set(String(item.identifier),item.fileName??item.preferredFileName)}}catch{warnings.add('Ein Keynote-Objekt konnte nicht vollständig gelesen werden.')}}
   if(info.identifier!==undefined){const key=String(info.identifier);map.set(key,info.shouldMerge?[...records,...(map.get(key)??[]).filter(previous=>!records.some(next=>next.name===previous.name))]:records);if(info.shouldMerge)warnings.add('Die Keynote-Datei enthält nachträgliche Objektänderungen. Den vollständigen Import vor ON AIR prüfen.')}if(++objects>100000)throw Error('Zu viele Keynote-Objekte.');if(objects%100===0)await yieldToMain();
  }
 }
 const all=[...map.values()].flat(),show=all.find(entry=>entry.name==='KN.ShowArchive')?.data;if(!show?.slideTree)throw Error('Die Keynote-Folienreihenfolge konnte nicht gelesen werden. Bitte die Datei als PPTX oder PDF exportieren.');
 const get=(reference:any,name?:string)=>reference?.identifier===undefined?undefined:map.get(String(reference.identifier))?.find(entry=>!name||entry.name===name)?.data;
 const ordered:any[]=[],seen=new Set<string>();
 const node=(reference:any,depth=0)=>{if(depth>64||ordered.length>1000)throw Error('Die Keynote-Präsentation ist zu groß.');const key=String(reference?.identifier);if(seen.has(key))return;seen.add(key);const value=get(reference,'KN.SlideNodeArchive');if(value){if(value.slide)ordered.push({node:value,slide:get(value.slide,'KN.SlideArchive')});for(const child of value.children??[])node(child,depth+1)}else{const slide=get(reference,'KN.SlideArchive');if(slide)ordered.push({slide})}};
 for(const reference of show.slideTree.slides??[])node(reference);if(!ordered.length&&show.slideTree.rootSlideNode)node(show.slideTree.rootSlideNode);
 if(!ordered.length)throw Error('Keine lesbaren Keynote-Folien gefunden.');
 const readImage=async(reference:any)=>{const name=dataFiles.get(String(reference?.identifier));if(!name)return;const entry=zip.file('Data/'+name)??zip.file(name);if(!entry)return;const extension=name.split('.').at(-1)?.toLowerCase(),mime=extension==='png'?'image/png':['jpg','jpeg'].includes(extension??'')?'image/jpeg':extension==='webp'?'image/webp':undefined;if(!mime)return;return`data:${mime};base64,${(await entryBytes(entry,8*1024*1024)).toString('base64')}`};
 const pages:ImportedPage[]=[];
 for(const [index,{slide,node:slideNode}]of ordered.entries()){
  if(!slide){warnings.add('Eine Folie konnte nicht vollständig gelesen werden.');continue}
  const text:string[]=[],images:Array<{src:string}>=[],visited=new Set<string>();
  const traverse=async(value:any,depth=0):Promise<void>=>{if(!value||depth>32)return;if(value.identifier!==undefined){const key=String(value.identifier);if(visited.has(key))return;visited.add(key);for(const entry of map.get(key)??[]){if(entry.name==='TSWP.StorageArchive'){text.push(...entry.data.text.filter((line:unknown)=>typeof line==='string'));continue}if(entry.name==='TSD.ImageArchive'){const src=await readImage(entry.data.data??entry.data.originalData);if(src)images.push({src});continue}await traverse(entry.data,depth+1)}return}if(Array.isArray(value)){for(const item of value)await traverse(item,depth+1);return}if(typeof value==='object')for(const key of ['super','ownedStorage','deprecatedStorage','storage','storages','textFlow','children'])await traverse(value[key],depth+1)};
  for(const drawable of slide.drawablesZOrder?.length?slide.drawablesZOrder:slide.ownedDrawables??[])await traverse(drawable);
  const body=text.join('\n').replace(/\u000b/g,'\n').trim();if(body.length>200000)throw Error('Keynote-Folientext ist zu lang.');let image:string|undefined;
  const thumbs=slideNode?.thumbnails??[],sizes=slideNode?.thumbnailSizes??[];for(let i=thumbs.length-1;i>=0;i--)if((sizes[i]?.width??0)>=960){image=await readImage(thumbs[i]);if(image)break}
  if(!body&&!images.length&&!image)warnings.add(`Folie ${index+1} enthält keine unterstützten Text- oder Bildobjekte.`);
  pages.push({hidden:slideNode?.isHidden===true,title:body.split('\n').find(line=>line.trim())??`Folie ${index+1}`,body,images,...(image?{image}:{})});
 }
 if(!pages.length)throw Error('Keine lesbaren Keynote-Folien gefunden.');return{version:1,pages,warnings:[...warnings]};
}
export async function importKeynotePath(sourcePath:string):Promise<DocumentImportResult>{
 const stat=await fs.stat(sourcePath);if(stat.isFile()){if(stat.size>128*1024*1024)throw Error('Die Keynote-Datei ist zu groß.');return importKeynote(await fs.readFile(sourcePath))}if(!stat.isDirectory())throw Error('Ungültige Keynote-Datei.');
 const root=path.resolve(sourcePath),zip=new JSZip();let count=0,total=0;
 const walk=async(folder:string,depth=0):Promise<void>=>{if(depth>32)throw Error('Keynote-Paket ist zu tief verschachtelt.');for(const entry of await fs.readdir(folder,{withFileTypes:true})){if(++count>10000)throw Error('Zu viele Keynote-Paketdateien.');const absolute=path.join(folder,entry.name),relative=path.relative(root,absolute);if(relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative)||entry.isSymbolicLink())throw Error('Ungültiger Keynote-Paketpfad.');if(entry.isDirectory())await walk(absolute,depth+1);else if(entry.isFile()){const info=await fs.stat(absolute);total+=info.size;if(info.size>LIMIT||total>128*1024*1024)throw Error('Keynote-Paket ist zu groß.');zip.file(relative.split(path.sep).join('/'),await fs.readFile(absolute))}}};await walk(root);return importKeynote(await zip.generateAsync({type:'nodebuffer',compression:'STORE'}));
}
