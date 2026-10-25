import path from 'node:path';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
export type ImportedPage={title?:string;body?:string;image?:string;hidden?:boolean;images?:Array<{src:string;alt?:string}>};
export type DocumentImportResult={version:1;pages:ImportedPage[];warnings:string[]};
export function readDocumentImportResult(value:unknown):DocumentImportResult{
 if(!value||typeof value!=='object')throw Error('Ungültiger Importbericht.');const raw=value as DocumentImportResult;
 if(raw.version!==1||!Array.isArray(raw.pages)||!raw.pages.length||raw.pages.length>1000||!Array.isArray(raw.warnings)||raw.warnings.some(text=>typeof text!=='string'||text.length>10000))throw Error('Ungültiger Importbericht.');
 for(const page of raw.pages){if(!page||typeof page.title!=='string'||page.title.length>10000||typeof page.body!=='string'||page.body.length>200000||!Array.isArray(page.images)||page.images.length>1000)throw Error('Ungültige importierte Seite.');for(const image of page.images)if(!image||typeof image.src!=='string'||!/^data:image\/(png|jpeg|webp|gif);base64,[a-zA-Z0-9+/=]+$/.test(image.src)||image.src.length>12*1024*1024)throw Error('Ungültiges importiertes Bild.')}
 return structuredClone(raw);
}
export class DocumentImportService{
 constructor(private root:string,private platform=process.platform){}
 async importOneNote(sourcePath:string):Promise<DocumentImportResult>{
  const info=await fs.stat(sourcePath);if(!info.isFile()||info.size>128*1024*1024||!['.one','.onepkg'].includes(path.extname(sourcePath).toLowerCase()))throw Error('Die OneNote-Datei ist nicht unterstützt oder zu groß.');
  const executable=path.join(this.root,this.platform==='win32'?'regie-document-import.exe':'regie-document-import');
  const bytes=await new Promise<Buffer>((resolve,reject)=>{const child=spawn(executable,[sourcePath],{shell:false,windowsHide:true,stdio:['ignore','pipe','pipe']});const chunks:Buffer[]=[];let size=0,errors='',failed=false;const timer=setTimeout(()=>{failed=true;child.kill();reject(Error('Der OneNote-Import hat zu lange gedauert.'))},90000);
   child.stdout.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>32*1024*1024){failed=true;child.kill()}else chunks.push(chunk)});child.stderr.on('data',(chunk:Buffer)=>{errors=(errors+chunk).slice(-2000)});child.on('error',()=>{clearTimeout(timer);reject(Error('Der lokale OneNote-Importer ist nicht verfügbar. Bitte das vollständige Update installieren.'))});child.on('close',code=>{clearTimeout(timer);code===0&&!failed?resolve(Buffer.concat(chunks)):reject(Error(errors.trim()||'Die OneNote-Datei konnte nicht importiert werden.'))});
  });
  return readDocumentImportResult(JSON.parse(bytes.toString('utf8')));
 }
}
