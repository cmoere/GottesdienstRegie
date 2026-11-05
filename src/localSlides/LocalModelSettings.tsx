import {useEffect,useState} from 'react';
import {useI18n} from '../i18n';
import {usePresentation} from '../store';
import type {LocalModelsStatus,LocalModelId} from '../../electron/localSlides/LocalModelManager';
export function LocalModelSettings(){
 const {tx}=useI18n(),api=window.desktop?.localModels,onAir=usePresentation(state=>state.onAir),[status,setStatus]=useState<LocalModelsStatus>(),[error,setError]=useState(false);
 useEffect(()=>{let active=true,pending=false;const refresh=async()=>{if(!api||pending)return;pending=true;try{const next=await api.status();if(active)setStatus(next)}catch{if(active)setError(true)}finally{pending=false}};void refresh();const timer=setInterval(()=>void refresh(),2000);return()=>{active=false;clearInterval(timer)}},[api]);
 if(!api)return null;
 const action=async(operation:()=>Promise<void>,downloadId?:LocalModelId)=>{setError(false);try{await operation();setStatus(await api.status())}catch{if(downloadId){try{const current=await api.status();setStatus(current);if(current.models.find(model=>model.id===downloadId)?.enabled===false)return}catch{}}setError(true)}};
 const modelLabel=(id:LocalModelId)=>id==='text'?tx('Text und Gestaltung'):id==='live'?tx('Textmodell für ON AIR'):id==='liveImage'?tx('Bildmodell für ON AIR'):tx('Bilder und Motive');
 return <section className="settings-group local-model-settings"><h3>{tx('Lokale KI-Modelle')}</h3>
  <label><input type="checkbox" checked={status?.autoDownload??false} disabled={!status} onChange={event=>void action(()=>api.configure(event.target.checked))}/>{tx('Automatisch herunterladen, sobald die Anwendung bereit und OFF AIR ist.')}</label>
  <p>{tx('Entfernte Modelle bleiben deaktiviert, bis du sie erneut herunterlädst.')}</p>
  {status?.models.map(model=><div key={model.id} className="local-model-row"><strong>{modelLabel(model.id)}</strong><span>{(model.totalBytes/1000000000).toFixed(2)} GB</span><span>{model.state==='ready'?tx('Bereit'):model.state==='downloading'?tx('Download läuft …'):model.state==='error'?tx('Das lokale Modell ist derzeit nicht verfügbar.'):tx('Nicht installiert')}</span>
   {model.state==='downloading'&&<progress aria-label={modelLabel(model.id)} max={model.totalBytes} value={model.downloadedBytes}/>}
   {model.state==='downloading'?<button onClick={()=>void action(()=>api.cancelDownload(model.id))}>{tx('Download abbrechen')}</button>:model.state==='ready'?<button disabled={onAir} onClick={()=>void action(()=>api.remove(model.id))}>{tx('Modell entfernen')}</button>:<button disabled={onAir||Boolean(status.activeModel)} onClick={()=>void action(()=>api.download(model.id),model.id)}>{tx('Herunterladen')}</button>}
  </div>)}
  {error&&<p role="alert">{tx('Das lokale Modell ist derzeit nicht verfügbar.')}</p>}
 </section>;
}
