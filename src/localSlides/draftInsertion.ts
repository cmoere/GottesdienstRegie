import {createServiceItem,usePresentation,type ServiceItem,type SlideElement} from '../store';
import {usePreferences} from '../preferences';
import {parseSlideDraft,type SlideDraft} from '../../shared/localSlideDraft';
export type DraftLayout='light'|'dark'|'accent';
export function buildDraftItem(topic:string,drafts:SlideDraft[],sectionId:string,layout:DraftLayout):ServiceItem{
 const checked=drafts,item=createServiceItem('content',{title:topic.slice(0,180),sectionId,metadata:{aiGenerated:true}}),font=usePreferences.getState().defaultFont||'Cera Pro';
 const text=(value:string,y:number,height:number,size:number,bold:boolean):SlideElement=>({id:crypto.randomUUID(),type:'text',name:bold?'Titel':'Text',x:120,y,width:1680,height,rotation:0,opacity:1,locked:false,visible:true,zIndex:bold?2:1,properties:{text:value,fontFamily:font,fontSize:size,fontWeight:bold?600:400,fontStyle:'normal',color:layout==='dark'?'#ffffff':'#101820',align:'left',verticalAlign:'top',lineHeight:1.2,letterSpacing:0,padding:12}});
 item.slides=checked.map((draft,order)=>{
  const elements=[text(draft.title,90,220,88,true),text(draft.body,350,610,64,false)];
  if(layout==='accent')elements.unshift({id:crypto.randomUUID(),type:'shape',name:'Kopfbereich',x:0,y:0,width:1920,height:300,rotation:0,opacity:1,locked:false,visible:true,zIndex:0,properties:{fill:'#608f9a',shape:'rectangle'}});
  return{...item.slides[0],id:crypto.randomUUID(),itemId:item.id,order,title:draft.title,body:draft.body,background:layout==='dark'?'#18242a':'#ffffff',elements};
 });return item;
}
export function insertDraftItem(item:ServiceItem,presentationId:string,sectionId:string,afterId?:string){
 try{parseSlideDraft(JSON.stringify({slides:item.slides.map(slide=>({title:slide.title,body:slide.body}))}),item.slides.length)}catch{return false}
 return usePresentation.getState().insertDraftContent(item,presentationId,sectionId,afterId);
}
