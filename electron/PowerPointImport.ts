import path from 'node:path';
import type {Readable} from 'node:stream';
import JSZip from 'jszip';
import {SaxesParser} from 'saxes';

const P='http://schemas.openxmlformats.org/presentationml/2006/main';
const A='http://schemas.openxmlformats.org/drawingml/2006/main';
const R='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const PACKAGE_R='http://schemas.openxmlformats.org/package/2006/relationships';
const LIMIT=32*1024*1024,TOTAL=256*1024*1024;
type Xml={name:string;uri:string;attrs:Record<string,string>;namespaces:Record<string,string>;children:Xml[];text:string};
const MC='http://schemas.openxmlformats.org/markup-compatibility/2006';
const supportedNamespaces=new Set([P,A,R,'http://schemas.microsoft.com/office/powerpoint/2010/main']);
function children(node:Xml):Xml[]{
 if(node.uri!==MC||node.name!=='AlternateContent')return node.children;
 const choice=node.children.find(n=>n.uri===MC&&n.name==='Choice'&&n.attrs.Requires?.trim().split(/\s+/).every(prefix=>supportedNamespaces.has(n.namespaces[prefix])));
 return (choice??node.children.find(n=>n.uri===MC&&n.name==='Fallback'))?.children??[];
}
export interface PowerPointSlide {
 sourceId:string;part:string;title:string;body:string;notes:string;hidden:boolean;
 advanceOnClick:boolean;advanceAfterSeconds?:number;
 transition?:{kind:string;durationMs:number;direction?:'left'|'right'|'up'|'down'};
}
export interface PowerPointInspection {
 slides:PowerPointSlide[];size:{width:number;height:number};originalBlockers:string[];warnings:string[];
}
function xmlTree(xml:string):Xml {
 if(/<!\s*(?:DOCTYPE|ENTITY)/i.test(xml))throw Error('Ungültige PowerPoint-XML-Datei.');
 const parser=new SaxesParser({xmlns:true}),stack:Xml[]=[];let root:Xml|undefined,count=0;
 parser.on('doctype',()=>{throw Error('Ungültige PowerPoint-XML-Datei.')});
 parser.on('opentag',tag=>{
  if(stack.length>=128||++count>200000)throw Error('PowerPoint-XML ist zu umfangreich.');
  const attrs:Record<string,string>={};for(const attr of Object.values(tag.attributes))attrs[attr.uri?`{${attr.uri}}${attr.local}`:attr.local]=attr.value;
  const node:Xml={name:tag.local,uri:tag.uri,attrs,namespaces:{...stack.at(-1)?.namespaces,...tag.ns},children:[],text:''};if(stack.length)stack.at(-1)!.children.push(node);else root=node;stack.push(node);
 });
 const text=(value:string)=>{if(stack.length){const node=stack.at(-1)!;node.text+=value;if(node.text.length>200000)throw Error('PowerPoint-Text ist zu lang.')}};
 parser.on('text',text);parser.on('cdata',text);parser.on('closetag',()=>{stack.pop()});parser.write(xml).close();
 if(!root)throw Error('Leere PowerPoint-XML-Datei.');return root;
}
function descendants(node:Xml,name:string,uri:string):Xml[]{const result:Xml[]=[];const visit=(value:Xml)=>{if(value.name===name&&value.uri===uri)result.push(value);for(const child of children(value))visit(child)};visit(node);return result}
function paragraphs(root:Xml,notes=false):string[]{
 const result:string[]=[];
 const visit=(node:Xml)=>{
  if(notes&&node.uri===P&&node.name==='sp'){
   const kind=descendants(node,'ph',P)[0]?.attrs.type;if(kind&&kind!=='body')return;
  }
  if(node.uri===A&&node.name==='p'){
   let line='';const runs=(n:Xml)=>{if(n.uri===A&&n.name==='t')line+=n.text;else if(n.uri===A&&n.name==='br')line+='\n';else for(const c of children(n))runs(c)};runs(node);if(line.trim())result.push(line.trim());return;
  }
  for(const child of children(node))visit(child);
 };visit(root);if(result.join('\n').length>200000)throw Error('PowerPoint-Folientext ist zu lang.');return result;
}
type Relation={id:string;type:string;target:string;external:boolean};
function resolvePart(part:string,target:string):string {
 if(!target||target.includes('\\')||target.includes(':')||/[?#%\u0000-\u001f]/.test(target))throw Error('Ungültige PowerPoint-Verknüpfung.');
 const value=path.posix.normalize(target.startsWith('/')?target.slice(1):path.posix.join(path.posix.dirname(part),target));
 if(value==='..'||value.startsWith('../')||value.startsWith('/'))throw Error('Ungültige PowerPoint-Verknüpfung.');return value;
}
function relations(tree:Xml):Relation[]{
 if(tree.uri!==PACKAGE_R||tree.name!=='Relationships')throw Error('Ungültige PowerPoint-Verknüpfungen.');const ids=new Set<string>();
 return tree.children.filter(n=>n.uri===PACKAGE_R&&n.name==='Relationship').map(n=>{const {Id:id,Type:type,Target:target,TargetMode}=n.attrs;if(!id||!type||!target||ids.has(id))throw Error('Ungültige PowerPoint-Verknüpfung.');ids.add(id);return{id,type,target,external:TargetMode==='External'}});
}
export async function inspectPowerPoint(bytes:Buffer):Promise<PowerPointInspection>{
 if(bytes.length>128*1024*1024)throw Error('Die PowerPoint-Datei ist zu groß.');
 const zip=await JSZip.loadAsync(bytes),entries=Object.values(zip.files);if(entries.length>10000)throw Error('Zu viele PowerPoint-Dateieinträge.');let declared=0,expanded=0;
 for(const entry of entries){const name=(entry as JSZip.JSZipObject&{unsafeOriginalName?:string}).unsafeOriginalName??entry.name;
  if(name.includes('\\')||name.startsWith('/')||name.includes(':')||name.split('/').includes('..'))throw Error('Ungültiger PowerPoint-Dateipfad.');
  const size=Number((entry as any)._data?.uncompressedSize??0);declared+=size;if(!Number.isSafeInteger(size)||size<0||size>LIMIT||declared>TOTAL)throw Error('Entpackte PowerPoint-Datei ist zu groß.');
 }
 const cache=new Map<string,Xml>();
 const read=async(name:string):Promise<Xml>=>{
  const cached=cache.get(name);if(cached)return cached;const entry=zip.file(name);if(!entry)throw Error('Ein benötigter PowerPoint-Dateiteil fehlt.');
  const content=await new Promise<Buffer>((resolve,reject)=>{const chunks:Buffer[]=[];let size=0,failed=false;const stream=entry.nodeStream('nodebuffer') as Readable;
   stream.on('data',chunk=>{if(failed)return;const b=Buffer.from(chunk);size+=b.length;expanded+=b.length;if(size>LIMIT||expanded>TOTAL){failed=true;stream.pause();stream.destroy?.();reject(Error('Entpackte PowerPoint-Datei ist zu groß.'))}else chunks.push(b)});stream.on('error',reject);stream.on('end',()=>{if(!failed)resolve(Buffer.concat(chunks))});
  });const tree=xmlTree(content.toString('utf8'));cache.set(name,tree);return tree;
 };
 const blockers=new Set<string>(),warnings=new Set<string>();
 for(const entry of entries){if(entry.dir)continue;const name=entry.name.toLowerCase();
  if(/(^|\/)(?:vbaproject\.bin|activex|embeddings)(?:\/|$)/.test(name))blockers.add('active-content');
  if(/^ppt\/media\/.+\.(?:wav|mp3|m4a|aac|wma|ogg|flac)$/.test(name))blockers.add('embedded-audio');
  if(/^ppt\/media\/.+\.(?:mp4|mov|avi|wmv|m4v|webm|mpeg|mpg)$/.test(name))blockers.add('embedded-video');
  if(name.endsWith('.rels')){const rels=relations(await read(entry.name));if(rels.some(r=>r.external))blockers.add('external-relationships');if(rels.some(r=>r.type===R+'/audio'))blockers.add('embedded-audio');if(rels.some(r=>r.type===R+'/video'))blockers.add('embedded-video');if(rels.some(r=>[R+'/oleObject',R+'/control'].includes(r.type)))blockers.add('active-content')}
 }
 const presentation=await read('ppt/presentation.xml');if(presentation.uri!==P||presentation.name!=='presentation')throw Error('Ungültige PowerPoint-Präsentation.');
 const rels=relations(await read('ppt/_rels/presentation.xml.rels')),size=descendants(presentation,'sldSz',P)[0],cx=Number(size?.attrs.cx),cy=Number(size?.attrs.cy);
 if(!Number.isSafeInteger(cx)||!Number.isSafeInteger(cy)||cx<=0||cy<=0||cx>91440000||cy>91440000)throw Error('Ungültige PowerPoint-Foliengröße.');
 const order=descendants(presentation,'sldId',P);if(!order.length||order.length>1000)throw Error('Ungültige PowerPoint-Folienanzahl.');
 const slides:PowerPointSlide[]=[],ids=new Set<string>();
 for(const item of order){
  const sourceId=item.attrs.id,ref=item.attrs[`{${R}}id`],rel=rels.find(r=>r.id===ref&&r.type===R+'/slide'&&!r.external);
  if(!sourceId||!/^\d+$/.test(sourceId)||ids.has(sourceId)||!rel)throw Error('Ungültige PowerPoint-Folienreihenfolge.');ids.add(sourceId);
  const part=resolvePart('ppt/presentation.xml',rel.target),tree=await read(part);if(tree.uri!==P||tree.name!=='sld')throw Error('Ungültige PowerPoint-Folie.');
  const lines=paragraphs(tree),transition=descendants(tree,'transition',P)[0];let notes='';
  const relPart=path.posix.join(path.posix.dirname(part),'_rels',path.posix.basename(part)+'.rels');
  if(zip.file(relPart)){const noteRef=relations(await read(relPart)).find(r=>r.type===R+'/notesSlide'&&!r.external);if(noteRef)notes=paragraphs(await read(resolvePart(part,noteRef.target)),true).join('\n')}
  const titleShape=descendants(tree,'sp',P).find(n=>descendants(n,'ph',P).some(ph=>['title','ctrTitle'].includes(ph.attrs.type)));
  const title=titleShape?paragraphs(titleShape).join('\n'):lines[0];
  const slide:PowerPointSlide={sourceId,part,title:title||`Folie ${slides.length+1}`,body:lines.join('\n'),notes,hidden:['0','false'].includes(tree.attrs.show),advanceOnClick:!transition||!['0','false'].includes(transition.attrs.advClick)};
  if(transition){
   if(transition.attrs.advTm!==undefined){const milliseconds=Number(transition.attrs.advTm);if(!Number.isSafeInteger(milliseconds)||milliseconds<0||milliseconds>86400000)throw Error('Ungültige PowerPoint-Folienzeit.');slide.advanceAfterSeconds=milliseconds/1000}
   const effect=transition.children.find(n=>n.uri===P);let durationMs=transition.attrs.spd==='slow'?1000:transition.attrs.spd==='fast'?300:500;
   const precise=transition.attrs['{http://schemas.microsoft.com/office/powerpoint/2010/main}dur'];if(precise!==undefined){durationMs=Number(precise);if(!Number.isSafeInteger(durationMs)||durationMs<0||durationMs>60000)throw Error('Ungültige PowerPoint-Übergangszeit.')}
   if(effect){const direction=({l:'left',r:'right',u:'up',d:'down'} as const)[effect.attrs.dir as 'l'|'r'|'u'|'d'];slide.transition={kind:effect.name,durationMs,...(direction?{direction}:{})};if(!['fade','cut','push','pull','wipe','dissolve'].includes(effect.name))warnings.add('Ein Originalübergang kann in der bearbeitbaren Kopie abweichen.')}
  }
  if(descendants(tree,'timing',P).length)warnings.add('Originalanimationen bleiben PowerPoint vorbehalten und werden in der bearbeitbaren Kopie nicht nachgebildet.');slides.push(slide);
 }
 return{slides,size:{width:cx/12700,height:cy/12700},originalBlockers:[...blockers],warnings:[...warnings]};
}
