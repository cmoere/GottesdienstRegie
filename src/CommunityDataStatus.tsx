export function CommunityDataStatus({connection}:{connection:{connected:boolean;mode:string;updatedAt?:number}|null}){
 const valid=Number.isFinite(connection?.updatedAt)&&Number(connection?.updatedAt)>0;
 const time=valid?new Date(connection!.updatedAt!).toLocaleString('de-DE',{timeZone:'Europe/Berlin',weekday:'short',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}):'';
 const text=connection?.connected?`Gemeindedaten online · ${valid?'zuletzt aktualisiert '+time:'werden geladen'}`:connection?.mode==='offline-cache'?`Gemeindedaten offline · letzter Stand ${time||'unbekannt'}`:'Gemeindedaten nicht verfügbar';
 return <span className="community-data-status" title={text}>{text}</span>;
}
