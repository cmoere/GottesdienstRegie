import type {PostProgramEventRow} from './community/PostProgramRoomNoticeService';

// Fixed 1920px design coordinates; all outputs scale the same prepared pages.
// Preserve every character, including separators, across continuation pages.
let measurementContext:CanvasRenderingContext2D|null|undefined;
function textWidth(text:string,fontSize:number){
 if(typeof document!=='undefined'&&!navigator.userAgent.includes('jsdom')){
  const context=measurementContext??(measurementContext=document.createElement('canvas').getContext('2d'));
  if(context){context.font=`800 ${fontSize}px "Cera Pro", "Segoe UI", sans-serif`;return context.measureText(text).width}
 }
 return Array.from(text).length*fontSize;
}
export function wrapEventText(text:string,width:number,fontSize:number):string[]{
 const lines:string[]=[];let line='';
 for(const character of Array.from(text)){
  if(line&&textWidth(line+character,fontSize)>width){
   const boundary=line.lastIndexOf(' ');
   if(boundary>line.length/2){lines.push(line.substring(0,boundary+1));line=line.substring(boundary+1)}
   else{lines.push(line);line=''}
  }
  line+=character;
 }
 if(line||!lines.length)lines.push(line);
 return lines;
}
export type PreparedPostRow=PostProgramEventRow&{lines:number};
export function paginatePostEvents(events:PostProgramEventRow[]):PreparedPostRow[][]{
 const pages:PreparedPostRow[][]=[];let page:PreparedPostRow[]=[],used=0;
 for(const event of events){
  const titles=wrapEventText(event.title,565,53.76),rooms=wrapEventText(event.room,275,53.76);
  const count=Math.max(titles.length,rooms.length,2);
  for(let offset=0;offset<count;offset+=8){
   const title=titles.filter((_,i)=>i>=offset&&i<offset+8).join('\n');
   const room=rooms.filter((_,i)=>i>=offset&&i<offset+8).join('\n');
   const lines=Math.max(title.split('\n').length,room.split('\n').length,2)+1;
   if(used+lines>10&&page.length){pages.push(page);page=[];used=0}
   page.push({...event,title,room,lines});used+=lines;
  }
 }
 if(page.length)pages.push(page);
 return pages;
}
export function paginateReducedMotionEvents<T extends {title:string;details?:string}>(events:T[]):Array<Array<T&{eventNumber:number}>>{
 const pages:Array<Array<T&{eventNumber:number}>>=[];let page:Array<T&{eventNumber:number}>=[];
 events.forEach((event,index)=>{
  const lines=wrapEventText(event.title,660,45.12);
  for(let offset=0;offset<lines.length;offset+=4){
   page.push({...event,eventNumber:index+1,title:lines.filter((_,i)=>i>=offset&&i<offset+4).join('\n')});
   if(page.length===4){pages.push(page);page=[]}
  }
 });
 if(page.length)pages.push(page);
 return pages;
}
