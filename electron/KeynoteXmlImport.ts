import {SaxesParser} from 'saxes';
import type {DocumentImportResult} from './DocumentImportService';
export function importKeynoteXml(xml:string):DocumentImportResult{
 if(Buffer.byteLength(xml)>32*1024*1024||/<!\s*(DOCTYPE|ENTITY)/i.test(xml))throw Error('Ungültige Keynote-XML-Datei.');
 const parser=new SaxesParser({xmlns:true}),pages:DocumentImportResult['pages']=[];let depth=0,pageDepth=0,paragraphDepth=0,paragraph='',lines:string[]=[],hidden=false;
 parser.on('doctype',()=>{throw Error('Ungültige Keynote-XML-Datei.')});
 parser.on('opentag',tag=>{if(++depth>128)throw Error('Keynote-XML ist zu tief verschachtelt.');if(tag.local==='slide'&&!pageDepth){pageDepth=depth;lines=[];hidden=Object.values(tag.attributes).some(attr=>['hidden','skipped','is-skipped'].includes(attr.local)&&['true','1','YES'].includes(attr.value))}if(pageDepth&&tag.local==='p'&&!paragraphDepth){paragraphDepth=depth;paragraph=''}if(paragraphDepth&&tag.local==='br')paragraph+='\n'});
 const text=(value:string)=>{if(paragraphDepth){paragraph+=value;if(paragraph.length>200000)throw Error('Keynote-Absatz ist zu lang.')}};parser.on('text',text);parser.on('cdata',text);
 parser.on('closetag',tag=>{if(paragraphDepth===depth){if(paragraph.trim())lines.push(paragraph.trim());paragraphDepth=0;paragraph=''}if(pageDepth===depth&&tag.local==='slide'){if(pages.length>=1000)throw Error('Zu viele Keynote-Folien.');const body=lines.join('\n');if(body.length>200000)throw Error('Keynote-Folientext ist zu lang.');pages.push({title:lines[0]??`Folie ${pages.length+1}`,body,hidden,images:[]});pageDepth=0}depth--});parser.write(xml).close();
 if(!pages.length)throw Error('Keine Keynote-Folien im XML-Dokument gefunden.');return{version:1,pages,warnings:['Ältere Keynote-XML-Datei als geordnete Textfolien importiert. Layouts, Bilder, Animationen und Übergänge können fehlen; den Import vor ON AIR prüfen.']};
}
