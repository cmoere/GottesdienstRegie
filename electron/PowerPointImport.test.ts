import {expect,it,vi} from 'vitest';import JSZip from 'jszip';
import {inspectPowerPoint} from './PowerPointImport';
const p='http://schemas.openxmlformats.org/presentationml/2006/main',a='http://schemas.openxmlformats.org/drawingml/2006/main',r='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
function relationships(body:string){return`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${body}</Relationships>`}
function slide(text:string,extra='',hidden=false){return`<p:sld xmlns:p="${p}" xmlns:a="${a}" xmlns:r="${r}" xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main"${hidden?' show="0"':''}><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>${text}</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld>${extra}</p:sld>`}
function fixture(){const z=new JSZip();z.file('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/></Types>');z.file('ppt/presentation.xml',`<p:presentation xmlns:p="${p}" xmlns:r="${r}"><p:sldIdLst><p:sldId id="400" r:id="second"/><p:sldId id="300" r:id="first"/></p:sldIdLst><p:sldSz cx="12192000" cy="6858000"/></p:presentation>`);z.file('ppt/_rels/presentation.xml.rels',relationships(`<Relationship Id="first" Type="${r}/slide" Target="slides/slide1.xml"/><Relationship Id="second" Type="${r}/slide" Target="slides/slide2.xml"/>`));z.file('ppt/slides/slide1.xml',slide('ÖÄÜ &amp; Musik'));z.file('ppt/slides/slide2.xml',slide('Zuerst im Ablauf','<p:transition advClick="0" advTm="12000" p14:dur="750"><p:fade/></p:transition>',true));z.file('ppt/slides/_rels/slide2.xml.rels',relationships(`<Relationship Id="notes" Type="${r}/notesSlide" Target="../notesSlides/notesSlide2.xml"/>`));z.file('ppt/notesSlides/notesSlide2.xml',`<p:notes xmlns:p="${p}" xmlns:a="${a}"><p:cSld><p:spTree><p:sp><p:nvSpPr><p:nvPr><p:ph type="body"/></p:nvPr></p:nvSpPr><p:txBody><a:p><a:r><a:t>Nur für die Regie</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:notes>`);return z}
it('uses relationship order, stable source slide IDs and actual hidden/timing/notes data',async()=>{
 const doc=await inspectPowerPoint(await fixture().generateAsync({type:'nodebuffer'}));
 expect(doc.slides.map(s=>s.sourceId)).toEqual(['400','300']);expect(doc.slides.map(s=>s.title)).toEqual(['Zuerst im Ablauf','ÖÄÜ & Musik']);
 expect(doc.size).toEqual({width:960,height:540});expect(doc.slides[0]).toMatchObject({hidden:true,notes:'Nur für die Regie',advanceOnClick:false,advanceAfterSeconds:12,transition:{kind:'fade',durationMs:750}});
 expect(doc.slides[1].advanceAfterSeconds).toBeUndefined();expect(doc.originalBlockers).toEqual([]);
});
it('reports embedded audio, active content and external relationships without executing or fetching them',async()=>{
 const z=fixture();z.file('ppt/media/sound.wav','RIFF');z.file('ppt/embeddings/oleObject1.bin','not executable');z.file('ppt/slides/_rels/slide1.xml.rels',relationships(`<Relationship Id="web" Type="${r}/hyperlink" Target="https://example.invalid/private" TargetMode="External"/>`));
 const fetch=vi.spyOn(globalThis,'fetch').mockRejectedValue(Error('must not fetch'));try{const doc=await inspectPowerPoint(await z.generateAsync({type:'nodebuffer'}));expect(doc.originalBlockers).toEqual(expect.arrayContaining(['embedded-audio','active-content','external-relationships']));expect(fetch).not.toHaveBeenCalled()}finally{fetch.mockRestore()}
});
it('rejects a missing ordered slide rather than silently sorting unrelated slide filenames',async()=>{
 const z=fixture();z.remove('ppt/slides/slide2.xml');await expect(inspectPowerPoint(await z.generateAsync({type:'nodebuffer'}))).rejects.toThrow();
});
it('rejects unsafe archives and XML declarations that can expand entities',async()=>{
 const z=fixture();z.file('../outside.xml','bad');await expect(inspectPowerPoint(await z.generateAsync({type:'nodebuffer'}))).rejects.toThrow();
 const x=fixture();x.file('ppt/presentation.xml','<!DOCTYPE p [<!ENTITY x "bad">]><p/>');await expect(inspectPowerPoint(await x.generateAsync({type:'nodebuffer'}))).rejects.toThrow();
});
it('selects one supported alternate representation and uses the actual title placeholder',async()=>{
 const z=fixture();z.file('ppt/slides/slide2.xml',`<p:sld xmlns:p="${p}" xmlns:a="${a}" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main"><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>Dekoration</a:t></a:r></a:p></p:txBody></p:sp><p:sp><p:nvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:txBody><mc:AlternateContent><mc:Choice Requires="p14"><a:p><a:r><a:t>Eigentlicher Titel</a:t></a:r></a:p></mc:Choice><mc:Fallback><a:p><a:r><a:t>Doppelter Fallback</a:t></a:r></a:p></mc:Fallback></mc:AlternateContent></p:txBody></p:sp></p:spTree></p:cSld></p:sld>`);
 const doc=await inspectPowerPoint(await z.generateAsync({type:'nodebuffer'}));expect(doc.slides[0].title).toBe('Eigentlicher Titel');expect(doc.slides[0].body).toBe('Dekoration\nEigentlicher Titel');
});
it('retains supported transition direction and flags unrecognized media by relationship, not just filename',async()=>{
 const z=fixture();z.file('ppt/slides/slide2.xml',slide('Richtung','<p:transition><p:push dir="r"/></p:transition>'));
 z.file('ppt/media/track.dat','media');z.file('ppt/slides/_rels/slide1.xml.rels',relationships(`<Relationship Id="audio" Type="${r}/audio" Target="../media/track.dat"/>`));
 const doc=await inspectPowerPoint(await z.generateAsync({type:'nodebuffer'}));expect(doc.slides[0].transition).toMatchObject({kind:'push',direction:'right'});expect(doc.originalBlockers).toContain('embedded-audio');
});
