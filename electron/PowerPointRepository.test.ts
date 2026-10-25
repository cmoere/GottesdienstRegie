import {afterEach,expect,it} from 'vitest';
import JSZip from 'jszip';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {PresentationRepository} from './PresentationRepository';

const dirs:string[]=[];
afterEach(async()=>{for(const dir of dirs.splice(0)){expect(path.dirname(dir)).toBe(os.tmpdir());await fs.rm(dir,{recursive:true,force:true})}});
it('imports an honest editable copy in original order with notes and exact source timing, leaving the source unchanged',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'regie-pptx-import-'));dirs.push(root);
 const r='http://schemas.openxmlformats.org/officeDocument/2006/relationships',p='http://schemas.openxmlformats.org/presentationml/2006/main',a='http://schemas.openxmlformats.org/drawingml/2006/main';
 const z=new JSZip();z.file('ppt/presentation.xml',`<p:presentation xmlns:p="${p}" xmlns:r="${r}"><p:sldIdLst><p:sldId id="900" r:id="b"/><p:sldId id="300" r:id="a"/></p:sldIdLst><p:sldSz cx="12192000" cy="6858000"/></p:presentation>`);
 z.file('ppt/_rels/presentation.xml.rels',`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="a" Type="${r}/slide" Target="slides/slide1.xml"/><Relationship Id="b" Type="${r}/slide" Target="slides/slide2.xml"/></Relationships>`);
 const slide=(text:string,attributes='',extra='')=>`<p:sld xmlns:p="${p}" xmlns:a="${a}" ${attributes}><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>${text}</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld>${extra}</p:sld>`;
 z.file('ppt/slides/slide1.xml',slide('Danach'));z.file('ppt/slides/slide2.xml',slide('Erste Folie','show="0"','<p:transition advClick="0" advTm="12500"><p:fade/></p:transition>'));
 z.file('ppt/slides/_rels/slide2.xml.rels',`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="n" Type="${r}/notesSlide" Target="../notesSlides/n.xml"/></Relationships>`);
 z.file('ppt/notesSlides/n.xml',`<p:notes xmlns:p="${p}" xmlns:a="${a}"><a:p><a:r><a:t>Regiehinweis</a:t></a:r></a:p></p:notes>`);
 const sourcePath=path.join(root,'Original.pptx'),bytes=await z.generateAsync({type:'nodebuffer'});await fs.writeFile(sourcePath,bytes);const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
 const repo=new PresentationRepository(path.join(root,'data')),doc=await repo.importDocument(sourcePath),item=doc.items[0];
 expect(item.slides.map((s:any)=>s.title)).toEqual(['Erste Folie','Danach']);expect(item.slides[0]).toMatchObject({sourceSlideId:'900',enabled:false,notes:'Regiehinweis',timing:{durationSeconds:12.5}});
 expect(item.slides[1].timing.durationSeconds).toBeUndefined();expect(item.autoAdvance).toBe(false);expect(item.timing.slideDurationSeconds).toBe(0);
 expect(item.metadata.importMode).toBe('editable-copy');expect(doc.importReport.warnings.join(' ')).toMatch(/Layout/);expect(doc.importReport.sourcePages).toBe(2);
 expect(hash(await fs.readFile(sourcePath))).toBe(hash(bytes));expect((await repo.read(doc.presentationId)).items[0].slides[0].sourceSlideId).toBe('900');
});
