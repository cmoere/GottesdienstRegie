import {expect,it} from 'vitest';
import {createRequire} from 'node:module';
import JSZip from 'jszip';
import {KeynoteArchives,TSPArchiveMessages} from 'keynote-archives';
import {importKeynote} from './KeynoteImport';
const nodeRequire=createRequire(process.cwd()+'/package.json'),{compress}=nodeRequire('snappyjs');
const variable=(value:number)=>{const bytes=[];do{let next=value&127;value>>>=7;if(value)next|=128;bytes.push(next)}while(value);return Buffer.from(bytes)};
function record(id:number,name:string,data:any,merge=false){const entry=Object.entries(KeynoteArchives).find(([,schema])=>schema.typeName===name)!;const type=entry[0],schema:any=entry[1];const bytes=schema.toBinary(schema.create(data)),info=TSPArchiveMessages.ArchiveInfo.toBinary(TSPArchiveMessages.ArchiveInfo.create({identifier:BigInt(id),shouldMerge:merge,messageInfos:[{type:Number(type),length:bytes.length}]}));return Buffer.concat([variable(info.length),Buffer.from(info),Buffer.from(bytes)])}
it('imports all slides in their declared order rather than using the single document cover',async()=>{
 const ref=(id:number)=>({identifier:BigInt(id)}),blocks=[record(2,'KN.ShowArchive',{slideTree:{slides:[ref(11),ref(10)]}})];
 for(let i=0;i<2;i++){blocks.push(record(10+i,'KN.SlideNodeArchive',{slide:ref(20+i)}),record(20+i,'KN.SlideArchive',{ownedDrawables:[ref(30+i)]}),record(30+i,'TSWP.ShapeInfoArchive',{ownedStorage:ref(40+i)}),record(40+i,'TSWP.StorageArchive',{text:['Titel '+i,'Text mit ÄÖÜ']}))}
 blocks.push(record(40,'TSWP.StorageArchive',{text:['Aktualisierter Titel']},true));
 const compressed=Buffer.from(compress(Buffer.concat(blocks))),header=Buffer.alloc(4);header.writeUIntLE(compressed.length,1,3);const zip=new JSZip();zip.file('Index/Document.iwa',Buffer.concat([header,compressed]));zip.file('preview.jpg',Buffer.from('not a full deck'));
 const result=await importKeynote(await zip.generateAsync({type:'nodebuffer'}));expect(result.pages).toHaveLength(2);expect(result.pages.map(page=>page.title)).toEqual(['Titel 1','Aktualisierter Titel']);expect(result.pages[0].body).toContain('ÄÖÜ');expect(result.warnings.join(' ')).toContain('Animationen');
});
it('rejects archive traversal and incomplete compressed content',async()=>{
 const zip=new JSZip();zip.file('../Index/Document.iwa','bad');await expect(importKeynote(await zip.generateAsync({type:'nodebuffer'}))).rejects.toThrow('Dateipfad');
 const incomplete=new JSZip();incomplete.file('Index/Document.iwa',Buffer.from([0,5,0,0,1]));await expect(importKeynote(await incomplete.generateAsync({type:'nodebuffer'}))).rejects.toThrow();
});
