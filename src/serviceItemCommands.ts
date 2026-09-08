import { usePresentation, type ServiceItem, type Slide } from './store';

let itemClipboard:ServiceItem[]=[];

const xml=(value:unknown)=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]!));
export function slideSvgDataUrl(slide:Slide){
  const background=slide.backgroundImage?`<image href="${xml(slide.backgroundImage)}" width="1920" height="1080" preserveAspectRatio="xMidYMid slice"/>`:`<rect width="1920" height="1080" fill="${xml(slide.background||'#000')}"/>`;
  const elements=[...slide.elements].filter(element=>element.visible).sort((a,b)=>a.zIndex-b.zIndex).map(element=>{
    const p=element.properties;
    if((element.type==='image'||element.type==='video')&&p.src)return `<image href="${xml(p.src)}" x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" preserveAspectRatio="xMidYMid slice" opacity="${element.opacity}"/>`;
    if(element.type==='shape')return `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" rx="${Number(p.radius??0)}" fill="${xml(p.fill??'#68aab5')}" stroke="${xml(p.stroke??'none')}" stroke-width="${Number(p.strokeWidth??0)}" opacity="${element.opacity}"/>`;
    if(element.type==='line')return `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${Math.max(2,element.height)}" fill="${xml(p.fill??'#fff')}" opacity="${element.opacity}"/>`;
    if(element.type!=='text')return '';
    const text=String(p.text??slide.body??''),lines=text.split(/\n/),size=Number(p.fontSize??72),lineHeight=size*Number(p.lineHeight??1.15),anchor=p.align==='left'?'start':p.align==='right'?'end':'middle',x=anchor==='start'?element.x+Number(p.padding??0):anchor==='end'?element.x+element.width-Number(p.padding??0):element.x+element.width/2,y=element.y+element.height/2-(lines.length-1)*lineHeight/2;
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" fill="${xml(p.color??'#fff')}" font-family="${xml(p.fontFamily??'Cera Pro')}" font-size="${size}" font-weight="${xml(p.fontWeight??600)}" opacity="${element.opacity}">${lines.map((line,index)=>`<tspan x="${x}" dy="${index?lineHeight:0}">${xml(line)}</tspan>`).join('')}</text>`;
  }).join('');
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">${background}${elements}</svg>`)))}`;
}

export const serviceItemCommands={
  canPaste:()=>itemClipboard.length>0,
  copy:(ids:string[])=>{const state=usePresentation.getState();itemClipboard=state.items.filter(item=>ids.includes(item.id)).map(item=>structuredClone(item))},
  cut:(ids:string[])=>{serviceItemCommands.copy(ids);usePresentation.getState().removeItems(ids)},
  paste:(afterId:string)=>{if(itemClipboard.length)usePresentation.getState().insertServiceItems(itemClipboard,afterId)},
  duplicate:(ids:string[])=>usePresentation.getState().duplicateItems(ids),
  remove:(ids:string[])=>usePresentation.getState().removeItems(ids),
  hide:(ids:string[],hidden:boolean)=>usePresentation.getState().setItemsEnabled(ids,!hidden),
  group:(ids:string[])=>usePresentation.getState().groupItems(ids),
  ungroup:(ids:string[])=>usePresentation.getState().ungroupItems(ids),
  linked:(id:string,sectionId?:string)=>usePresentation.getState().createLinkedItem(id,sectionId),
  rename:(id:string)=>{const state=usePresentation.getState(),item=state.items.find(entry=>entry.id===id);if(!item)return;const title=prompt('Element umbenennen',item.title)?.trim();if(title)state.updateItem(id,{title})},
  undo:()=>usePresentation.getState().undo(),
  redo:()=>usePresentation.getState().redo(),
  slideFor:(id:string)=>{const state=usePresentation.getState(),item=state.items.find(entry=>entry.id===id);return item?.slides.find(slide=>slide.id===state.selectedSlideId)??item?.slides[0]}
};
