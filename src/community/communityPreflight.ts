export type CommunityPreflightSnapshot={mode:'online'|'offline-cache'|'empty'|'error';updatedAt?:number;events:Array<{id?:string;eventKey?:string}>;announcements:Array<{id?:string;messageId?:string}>};
export type CommunityLoopItem={id:string;type:string;target?:string};
export interface CommunityPreflightResult{ready:boolean;warnings:string[];eventCount:number;announcementCount:number;linkedEventResolved:boolean}

export function communityPreflight(snapshot:CommunityPreflightSnapshot,linkedEventKey:string|undefined,loopItems:CommunityLoopItem[]):CommunityPreflightResult{
  const warnings:string[]=[];
  if(snapshot.mode==='offline-cache')warnings.push(`Offline · letzter Stand ${snapshot.updatedAt?new Date(snapshot.updatedAt).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}):'—'} Uhr`);
  else if(snapshot.mode==='empty'||snapshot.mode==='error')warnings.push('Gemeindedaten sind derzeit nicht verfügbar.');
  const linkedEventResolved=!linkedEventKey||snapshot.events.some(event=>(event.id??event.eventKey)===linkedEventKey);
  if(linkedEventKey&&!linkedEventResolved)warnings.push('Die verknüpfte Veranstaltung wurde nicht gefunden.');
  for(const item of loopItems){
    const empty=item.type==='announcement'?snapshot.announcements.length===0:item.type==='event'?snapshot.events.length===0:false;
    if(empty)warnings.push(`Das optionale Loop-Element ${item.id} hat keine gültigen Inhalte und wird übersprungen.`);
  }
  return{ready:true,warnings,eventCount:snapshot.events.length,announcementCount:snapshot.announcements.length,linkedEventResolved};
}
