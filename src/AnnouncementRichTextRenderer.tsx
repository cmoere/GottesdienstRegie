import {readAnnouncementRichLines} from './announcementRichText';

export function AnnouncementRichText({value,text}:{value:unknown;text:string}){
 const lines=readAnnouncementRichLines(value);
 if(!lines)return <>{text}</>;
 return <>{lines.map((line,index)=><div key={index} style={{height:'1lh',whiteSpace:'pre'}}>{line.length?line.map((run,n)=><span key={n} style={{fontWeight:run.bold?700:undefined,fontStyle:run.italic?'italic':undefined,textDecoration:run.underline?'underline':undefined}}>{run.text}</span>):'\u00a0'}</div>)}</>;
}
