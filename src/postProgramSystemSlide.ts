import type {ServiceItem,ServiceSection} from './store';

export const POST_PROGRAM_SYSTEM_ID='system-post-program-room-notice';
export const isPostProgramSystemItem=(item?:Pick<ServiceItem,'id'|'metadata'>)=>Boolean(item&&(item.id===POST_PROGRAM_SYSTEM_ID||item.metadata?.automaticRoomNotice===true));
export function ensurePostProgramSection(sections:ServiceSection[]):ServiceSection[]{
 return sections.some(section=>section.id==='post')?sections:[...sections,{id:'post',title:'NACHPROGRAMM',order:Math.max(0,...sections.map(section=>section.order))+1,type:'postLoop',autoLoop:true,supportsLoopItems:true}];
}

// Canonical system-owned content. User edits and imported copies cannot change it.
export function ensurePostProgramSystemSlide(items:ServiceItem[]):ServiceItem[]{
 const stamp='2026-10-10T00:00:00.000Z',id=POST_PROGRAM_SYSTEM_ID;
 const system:ServiceItem={id,type:'infoCard',itemCategory:'loop',placementPolicy:'loopOnly',title:'Nächste Veranstaltung / Raum verlassen',section:'NACHPROGRAMM',sectionId:'post',order:0,enabled:true,plannedDuration:15000,metadata:{automaticRoomNotice:true},autoAdvance:true,repeat:true,timing:{mode:'slide-duration',slideDurationSeconds:15,autoAdvance:true,repeat:true,shuffle:false,mediaDurationSeconds:0,totalDurationSeconds:15},notes:'',stageDirection:'',createdAt:stamp,updatedAt:stamp,slides:[{id:id+'-slide',itemId:id,order:0,enabled:true,title:'Automatischer Raumhinweis',body:'',background:'#000000',elements:[],transition:'fade',transitionDuration:500,notes:'',timing:{durationSeconds:15}}]};
 const rest=items.filter(item=>!isPostProgramSystemItem(item));
 const index=rest.findIndex(item=>item.sectionId==='post');
 rest.splice(index<0?rest.length:index,0,system);
 return rest.map((item,order)=>({...item,order:item===system?-1:order}));
}
