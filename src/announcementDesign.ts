import type {SlideElement} from './store';
export const ANNOUNCEMENT_DESIGNS=['classic','light','accent','split'] as const;
export type AnnouncementDesign=(typeof ANNOUNCEMENT_DESIGNS)[number];
export const ANNOUNCEMENT_DESIGN_LABELS:Record<AnnouncementDesign,string>={classic:'Klar',light:'Hell',accent:'Akzent',split:'Seitenspalte'};
export function announcementDesign(value:unknown):AnnouncementDesign{return ANNOUNCEMENT_DESIGNS.includes(value as AnnouncementDesign)?value as AnnouncementDesign:'classic'}
type Box={x:number;y:number;width:number;height:number};
export type PreparedAnnouncementPage={background:string;color:string;titleElement:Box;bodyElement:Box;qrElement?:Box;titleFontSize:number;bodyFontSize:number;titleHeight:number;bodyHeight:number;titleText:string;bodyText:string;bodyLines:string[];decorations:Array<Box&{fill:string}>};
let context:CanvasRenderingContext2D|null|undefined;
function width(text:string,size:number,weight:number){
 if(typeof document!=='undefined'&&!navigator.userAgent.includes('jsdom')){
  context??=document.createElement('canvas').getContext('2d');
  if(context){context.font=`${weight} ${size}px Inter, sans-serif`;return context.measureText(text).width}
 }
 return Array.from(text).length*size*.68;
}
function lines(text:string,maxWidth:number,size:number,weight:number){
 const result:Array<{text:string;source:string}>=[];let line='';
 const push=(source:string)=>result.push({text:source.replace(/\n$/,'').trimEnd(),source});
 for(const character of Array.from(text)){
  if(character==='\n'){push(line+'\n');line='';continue}
  if(line&&width(line+character,size,weight)>maxWidth){
   const boundary=line.lastIndexOf(' ');
   if(boundary>0){push(line.slice(0,boundary+1));line=line.slice(boundary+1)}
   else{push(line);line=''}
  }
  line+=character;
 }
 if(line||!result.length)push(line);
 return result;
}

// Layout is prepared in the operator at 1920×1080 and shared with every output.
// Source segments retain all characters; added visual line breaks never remove text.
export function prepareAnnouncementPages(input:{title:string;body:string;qrCode:boolean;design:unknown}):PreparedAnnouncementPage[]{
 const design=announcementDesign(input.design),split=design==='split',light=design==='light';
 const background=light?'#f4f7f8':'#18232f',color=light?'#18232f':'#ffffff';
 const x=split?610:130,bodyWidth=(input.qrCode?1410:1790)-x;
 const titleWidth=split?490:1660;
 let titleFontSize=56,titleLines=lines(input.title,titleWidth-24,titleFontSize,600);
 while(titleLines.length>3&&titleFontSize>44){titleFontSize-=4;titleLines=lines(input.title,titleWidth-24,titleFontSize,600)}
 const oversizedTitle=titleLines.length>4;
 if(oversizedTitle)titleLines=lines('Information',titleWidth-24,titleFontSize,600);
 const titleHeight=Math.max(titleFontSize*1.25,titleLines.length*titleFontSize*1.25);
 const titleElement={x:split?90:130,y:110,width:titleWidth,height:Math.ceil(titleHeight+16)};
 const bodyY=split?110:titleElement.y+titleElement.height+44;
 const bodyElement={x,y:bodyY,width:bodyWidth,height:970-bodyY};
 const bodyFontSize=44,lineHeight=bodyFontSize*1.3,maxLines=Math.max(1,Math.floor(bodyElement.height/lineHeight)-1);
 const fullBody=oversizedTitle?input.title+'\n\n'+input.body:input.body;
 const bodyLines=lines(fullBody,bodyWidth-24,bodyFontSize,400);
 const decorations:Array<Box&{fill:string}>=[];
 if(design==='accent')decorations.push({x:0,y:0,width:1920,height:26,fill:'#608f9a'},{x:130,y:titleElement.y+titleElement.height+20,width:1660,height:3,fill:'#608f9a'});
 if(split)decorations.push({x:0,y:0,width:560,height:1080,fill:'#608f9a'});
 if(light)decorations.push({x:130,y:titleElement.y+titleElement.height+20,width:1660,height:3,fill:'#c6d9de'});
 const pages:PreparedAnnouncementPage[]=[];
 for(let start=0;start<bodyLines.length;start+=maxLines){
  const part=bodyLines.slice(start,start+maxLines);
  pages.push({background,color,titleElement,bodyElement,qrElement:input.qrCode?{x:1500,y:410,width:280,height:280}:undefined,titleFontSize,bodyFontSize,titleHeight,bodyHeight:part.length*lineHeight,titleText:titleLines.map(line=>line.text).join('\n'),bodyText:part.map(line=>line.source).join(''),bodyLines:part.map(line=>line.text),decorations});
 }
 return pages;
}
export function announcementTextElement(id:string,name:string,box:Box,text:string,size:number,color:string,weight:number):SlideElement{
 return {id,type:'text',name,...box,rotation:0,opacity:1,locked:true,visible:true,zIndex:2,properties:{text,fontFamily:'Inter',fontSize:size,fontWeight:weight,color,align:'left',verticalAlign:'top',lineHeight:weight===600?1.25:1.3,padding:0,preparedAnnouncementText:true}};
}
