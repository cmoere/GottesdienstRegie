import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ItemType = 'song'|'bible'|'content'|'media';
export interface Slide { id:string; title:string; body:string; background:string }
export interface ServiceItem { id:string; type:ItemType; title:string; section:string; slides:Slide[]; disabled?:boolean }
interface State {
  title:string; items:ServiceItem[]; selectedItemId:string; selectedSlideId:string; mode:'edit'|'preview'; previewLayout:'single'|'grid'; gridSize:number; onAir:boolean; mainDisplayId?:number; saveState:'saved'|'saving';
  select:(itemId:string, slideId?:string)=>void; setMode:(mode:'edit'|'preview')=>void; setPreviewLayout:(layout:'single'|'grid')=>void; setGridSize:(n:number)=>void;
  addItem:(type:ItemType,copy?:{title:string;section:string;body:string})=>void; reorder:(active:string, over:string)=>void; updateSlide:(patch:Partial<Slide>)=>void; setMainDisplay:(id?:number)=>void; setOnAir:(value:boolean)=>void;
}
const id = () => crypto.randomUUID();
const initial:ServiceItem[] = [
  {id:'welcome',type:'content',title:'Willkommen',section:'ANKOMMEN',slides:[{id:'welcome-1',title:'Willkommen',body:'Schön, dass du da bist.',background:'#31515a'}]},
  {id:'song-1',type:'song',title:'Großer Gott, wir loben dich',section:'GOTTESDIENST',slides:[{id:'song-1a',title:'Vers 1',body:'Großer Gott, wir loben dich\nHerr, wir preisen deine Stärke',background:'#394755'},{id:'song-1b',title:'Vers 2',body:'Alles, was dich preisen kann\nKerubim und Serafinen',background:'#394755'}]},
  {id:'sermon',type:'content',title:'Predigt',section:'GOTTESDIENST',slides:[{id:'sermon-1',title:'Predigt',body:'Hoffnung, die trägt',background:'#5a4937'}]}
];
export const usePresentation = create<State>()(persist((set,get)=>({
  title:'Sonntagsgottesdienst',items:initial,selectedItemId:'welcome',selectedSlideId:'welcome-1',mode:'edit',previewLayout:'single',gridSize:180,onAir:false,saveState:'saved',
  select:(selectedItemId,slideId)=>{const item=get().items.find(i=>i.id===selectedItemId);set({selectedItemId,selectedSlideId:slideId??item?.slides[0]?.id});},
  setMode:mode=>set({mode}),setPreviewLayout:previewLayout=>set({previewLayout}),setGridSize:gridSize=>set({gridSize}),
  addItem:(type,copy)=>set(s=>{const itemId=id();const slideId=id();const names={song:'Neuer Song',bible:'Bibelstelle',content:'Neuer Inhalt',media:'Neues Medium'};const title=copy?.title??names[type],section=copy?.section??'GOTTESDIENST',body=copy?.body??'Inhalt bearbeiten';const item={id:itemId,type,title,section,slides:[{id:slideId,title,body,background:'#3b4652'}]};return {items:[...s.items,item],selectedItemId:itemId,selectedSlideId:slideId};}),
  reorder:(active,over)=>set(s=>{const from=s.items.findIndex(i=>i.id===active),to=s.items.findIndex(i=>i.id===over);if(from<0||to<0)return s;const items=[...s.items];const [moved]=items.splice(from,1);items.splice(to,0,moved);return {items};}),
  updateSlide:patch=>set(s=>({saveState:'saving',items:s.items.map(i=>({...i,slides:i.slides.map(sl=>sl.id===s.selectedSlideId?{...sl,...patch}:sl)}))})),
  setMainDisplay:mainDisplayId=>set({mainDisplayId}),setOnAir:onAir=>set({onAir})
}),{name:'gottesdienstregie2.presentation',partialize:s=>({...s,onAir:false,saveState:'saved'})}));
