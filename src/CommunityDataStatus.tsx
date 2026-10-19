import {useI18n} from './i18n';
export function CommunityDataStatus({connection}:{connection:{connected:boolean;mode:string;updatedAt?:number}|null}){
 const {t}=useI18n();
 const valid=Number.isFinite(connection?.updatedAt)&&Number(connection?.updatedAt)>0;
 const time=valid?new Date(connection!.updatedAt!).toLocaleString('de-DE',{timeZone:'Europe/Berlin',weekday:'short',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}):'';
 const text=connection?.connected?(valid?t('communityDataOnlineUpdated',{time}):t('communityDataOnlineLoading')):connection?.mode==='offline-cache'?(valid?t('communityDataOfflineUpdated',{time}):t('communityDataOfflineUnknown')):t('communityDataUnavailable');
 return <span className="community-data-status" title={text}>{text}</span>;
}
