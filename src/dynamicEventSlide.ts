export type LatestPublicEvent={title:string;effectiveStart:string;effectiveLocation?:string};
let latestPublicEvent:LatestPublicEvent|null=null;
export function setLatestPublicEvent(event:LatestPublicEvent|null){latestPublicEvent=event}
export function getLatestPublicEvent(){return latestPublicEvent}

export function eventSlideContent(properties:Record<string,unknown>){
  const title=String(properties.eventTitle??properties.title??'').trim();
  const location=String(properties.eventLocation??properties.location??'').trim();
  const raw=String(properties.eventStart??properties.start??'').trim();
  let date='';
  if(raw){const value=new Date(raw);if(!Number.isNaN(value.getTime()))date=new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(value).replace(',', ' ·');}
  return title?{title,details:[date,location].filter(Boolean).join(' · ')}:{title:'Keine kommenden Veranstaltungen',details:''};
}
