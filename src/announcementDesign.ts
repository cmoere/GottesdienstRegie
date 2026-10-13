import type {SlideElement} from './store';
import {announcementRuns,announcementRunsText,type AnnouncementRun,type AnnouncementRichLines} from './announcementRichText';
export const ANNOUNCEMENT_DESIGNS=['classic','light','accent','split','green','silver','frame','footer'] as const;
export type AnnouncementDesign=(typeof ANNOUNCEMENT_DESIGNS)[number];
export const ANNOUNCEMENT_DESIGN_LABELS:Record<AnnouncementDesign,string>={classic:'Klar',light:'Hell',accent:'Akzent',split:'Seitenspalte',green:'Grün',silver:'Silber',frame:'Rahmen',footer:'Fußband'};
export function announcementDesign(value:unknown):AnnouncementDesign{return ANNOUNCEMENT_DESIGNS.includes(value as AnnouncementDesign)?value as AnnouncementDesign:'classic'}
type Box={x:number;y:number;width:number;height:number};
export type PreparedAnnouncementPage={background:string;color:string;titleElement:Box;bodyElement:Box;qrElement?:Box;titleFontSize:number;bodyFontSize:number;titleHeight:number;bodyHeight:number;titleText:string;bodyText:string;bodyLines:string[];titleRichLines:AnnouncementRichLines;bodyRichLines:AnnouncementRichLines;decorations:Array<Box&{fill:string}>};
let context:CanvasRenderingContext2D|null|undefined;
function width(text:string,size:number,weight:number,italic=false){
 if(typeof document!=='undefined'&&!navigator.userAgent.includes('jsdom')){
  context??=document.createElement('canvas').getContext('2d');
  if(context){context.font=`${italic?'italic ':''}${weight} ${size}px "Cera Pro", sans-serif`;return context.measureText(text).width}
 }
 return Array.from(text).length*size*.68;
}
function lines(runs:AnnouncementRun[],maxWidth:number,size:number,weight:number){
 const result:Array<{text:string;source:string;runs:AnnouncementRun[]}>=[];let line:AnnouncementRun[]=[];
 const compact=(characters:AnnouncementRun[])=>{const output:AnnouncementRun[]=[];for(const run of characters){const previous=output.at(-1);if(previous&&previous.bold===run.bold&&previous.italic===run.italic&&previous.underline===run.underline)previous.text+=run.text;else output.push({...run})}return output};
 const measure=(characters:AnnouncementRun[])=>compact(characters).reduce((total,run)=>total+width(run.text,size,run.bold?700:weight,run.italic),0);
 const push=(characters:AnnouncementRun[])=>{const source=announcementRunsText(characters),text=source.replace(/\n$/,'').trimEnd();let remaining=text.length;const visible=characters.flatMap(run=>{if(!remaining)return [];remaining-=run.text.length;return [run]});result.push({text,source,runs:compact(visible)})};
 for(const run of runs)for(const character of Array.from(run.text)){
  const next={...run,text:character};
  if(character==='\n'){push([...line,next]);line=[];continue}
  if(line.length&&measure([...line,next])>maxWidth){
   const boundary=line.map(run=>run.text).lastIndexOf(' ');
   if(boundary>0){push(line.slice(0,boundary+1));line=line.slice(boundary+1)}
   else{push(line);line=[]}
   if(line.length&&measure([...line,next])>maxWidth){push(line);line=[]}
  }
  line.push(next);
 }
 if(line.length||!result.length)push(line);
 return result;
}

// Layout is prepared in the operator at 1920×1080 and shared with every output.
// Source segments retain all characters; added visual line breaks never remove text.
export function prepareAnnouncementPages(input:{title:string;body:string;qrCode:boolean;design:unknown}):PreparedAnnouncementPage[]{
 const design=announcementDesign(input.design),split=design==='split',light=design==='light'||design==='silver';
 const background=design==='green'?'#699f3e':design==='silver'?'#b6bec3':light?'#f4f7f8':'#18232f',color=light?'#18232f':'#ffffff';
 const x=split?610:130,bodyWidth=(input.qrCode?1410:1790)-x;
 const titleWidth=split?490:1660;
 const titleRuns=announcementRuns(input.title),bodyRuns=announcementRuns(input.body);
 let titleFontSize=56,titleLines=lines(titleRuns,titleWidth-24,titleFontSize,600);
 while(titleLines.length>3&&titleFontSize>44){titleFontSize-=4;titleLines=lines(titleRuns,titleWidth-24,titleFontSize,600)}
 const oversizedTitle=titleLines.length>4;
 if(oversizedTitle)titleLines=lines([{text:'Information'}],titleWidth-24,titleFontSize,600);
 const titleHeight=Math.max(titleFontSize*1.25,titleLines.length*titleFontSize*1.25);
 const titleElement={x:split?90:130,y:110,width:titleWidth,height:Math.ceil(titleHeight+16)};
 const bodyY=split?110:titleElement.y+titleElement.height+44;
 const bodyElement={x,y:bodyY,width:bodyWidth,height:970-bodyY};
 const bodyFontSize=44,lineHeight=bodyFontSize*1.3,maxLines=Math.max(1,Math.floor(bodyElement.height/lineHeight)-1);
 const fullBody=oversizedTitle?[...titleRuns,{text:'\n\n'},...bodyRuns]:bodyRuns;
 const bodyLines=lines(fullBody,bodyWidth-24,bodyFontSize,400);
 const decorations:Array<Box&{fill:string}>=[];
 if(design==='accent')decorations.push({x:0,y:0,width:1920,height:26,fill:'#608f9a'});
 if(design==='green')decorations.push({x:0,y:0,width:26,height:1080,fill:'#b6bec3'});
 if(design==='silver')decorations.push({x:0,y:0,width:1920,height:26,fill:'#699f3e'});
 if(design==='frame')decorations.push({x:45,y:45,width:1830,height:8,fill:'#b6bec3'},{x:45,y:1027,width:1830,height:8,fill:'#b6bec3'},{x:45,y:45,width:8,height:990,fill:'#699f3e'},{x:1867,y:45,width:8,height:990,fill:'#699f3e'});
 if(design==='footer')decorations.push({x:0,y:1040,width:1920,height:40,fill:'#608f9a'});
 if(split)decorations.push({x:0,y:0,width:560,height:1080,fill:'#608f9a'});
 decorations.push(split?{x:585,y:110,width:3,height:160,fill:'#608f9a'}:{x:130,y:titleElement.y+titleElement.height+20,width:160,height:3,fill:light?'#699f3e':'#608f9a'});
 const pages:PreparedAnnouncementPage[]=[];
 for(let start=0;start<bodyLines.length;start+=maxLines){
  const part=bodyLines.slice(start,start+maxLines);
  pages.push({background,color,titleElement,bodyElement,qrElement:input.qrCode?{x:1500,y:410,width:280,height:280}:undefined,titleFontSize,bodyFontSize,titleHeight,bodyHeight:part.length*lineHeight,titleText:titleLines.map(line=>line.text).join('\n'),bodyText:part.map(line=>line.source).join(''),bodyLines:part.map(line=>line.text),titleRichLines:titleLines.map(line=>line.runs),bodyRichLines:part.map(line=>line.runs),decorations});
 }
 return pages;
}
export function announcementTextElement(id:string,name:string,box:Box,text:string,size:number,color:string,weight:number,richLines?:AnnouncementRichLines):SlideElement{
 return {id,type:'text',name,...box,rotation:0,opacity:1,locked:true,visible:true,zIndex:2,properties:{text,fontFamily:'Cera Pro',fontSize:size,fontWeight:weight,color,align:'left',verticalAlign:'top',lineHeight:weight===600?1.25:1.3,padding:0,preparedAnnouncementText:true,...(richLines?{announcementRichLines:JSON.stringify(richLines)}:{})}};
}
