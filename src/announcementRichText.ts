export type AnnouncementRun={text:string;bold?:boolean;italic?:boolean;underline?:boolean};
export type AnnouncementRichLines=AnnouncementRun[][];

// Parse to data, never to executable markup. Only these three inline styles survive.
export function announcementRuns(value:string):AnnouncementRun[]{
 if(!/<[a-z!/]|&(?:#\d+|#x[\da-f]+|[a-z]+);/i.test(value))return [{text:value}];
 const doc=new DOMParser().parseFromString(value,'text/html');
 doc.querySelectorAll('script,style,iframe,object,embed,svg,math,template').forEach(node=>node.remove());
 const runs:AnnouncementRun[]=[];
 const append=(text:string,style:Omit<AnnouncementRun,'text'>={})=>{
  if(!text)return;
  const last=runs.at(-1);
  if(last&&last.bold===style.bold&&last.italic===style.italic&&last.underline===style.underline)last.text+=text;
  else runs.push({text,...style});
 };
 const newline=()=>{if(runs.length&&!runs.at(-1)!.text.endsWith('\n'))append('\n')};
 function visit(node:Node,style:Omit<AnnouncementRun,'text'>={}){
  if(node.nodeType===3){append(node.textContent??'',style);return}
  if(node.nodeType!==1)return;
  const element=node as HTMLElement,tag=element.tagName.toLowerCase();
  if(tag==='br'){append('\n');return}
  const block=['p','div','li','ul','ol','h1','h2','h3','h4','h5','h6','blockquote'].includes(tag);
  if(block)newline();
  if(tag==='li'){
   const parent=element.parentElement;
   const siblings=parent?Array.from(parent.children).filter(child=>child.tagName==='LI'):[];
   const start=Number(parent?.getAttribute('start'))||1;
   append(parent?.tagName==='OL'?`${start+siblings.indexOf(element)}. `:'• ');
  }
  const next={...style,...(['strong','b'].includes(tag)?{bold:true}:{}),...(['em','i'].includes(tag)?{italic:true}:{}),...(tag==='u'?{underline:true}:{})};
  if(tag==='p'&&!element.textContent&&element.children.length===0)append('\n');
  element.childNodes.forEach(child=>visit(child,next));
  if(block)newline();
 }
 doc.body.childNodes.forEach(node=>visit(node));
 while(runs.length){const last=runs.at(-1)!;last.text=last.text.replace(/\n+$/,'');if(last.text)break;runs.pop()}
 return runs.length?runs:[{text:''}];
}
export function announcementRunsText(runs:AnnouncementRun[]){return runs.map(run=>run.text).join('')}

// Validate persisted/IPC data as well as parsing author input. React renders only text.
export function readAnnouncementRichLines(value:unknown):AnnouncementRichLines|null{
 if(typeof value!=='string')return null;
 try{
  const lines:unknown=JSON.parse(value);
  if(!Array.isArray(lines)||!lines.every(line=>Array.isArray(line)&&line.every(run=>run&&typeof run==='object'&&typeof run.text==='string')))return null;
  return lines.map(line=>line.map((run:AnnouncementRun)=>({text:run.text,...(run.bold===true?{bold:true}:{}),...(run.italic===true?{italic:true}:{}),...(run.underline===true?{underline:true}:{})})));
 }catch{return null}
}
