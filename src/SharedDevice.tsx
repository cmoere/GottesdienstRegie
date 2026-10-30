import {useI18n} from "./i18n";
import {useEffect,useState} from 'react';

export interface RegisteredDevice{id:string;organizationId:string;organizationName:string;name:string;type:'shared'|'personal';platform:string;registeredAt:string;lastSeenAt:string;status:'online'|'locked'}
const organizationName='Philippus Gemeinde Bielefeld e. V.';

export function DeviceSetup({complete}:{complete:(device:RegisteredDevice)=>void}){
 const {tx}=useI18n();
  const [name,setName]=useState('Regie-PC Saal'),[type,setType]=useState<'shared'|'personal'>('shared'),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function submit(event:React.FormEvent){event.preventDefault();setBusy(true);setError('');try{const device=await (window.desktop as any)?.device?.register({organizationName,name,type}) as RegisteredDevice|undefined;if(!device)throw new Error('Geräteregistrierung ist in dieser Umgebung nicht verfügbar.');complete(device)}catch(reason){setError(reason instanceof Error?reason.message:String(reason))}finally{setBusy(false)}}
  return <main className="device-setup"><form onSubmit={submit}><span className="material-symbols-outlined">computer</span><small>{tx("ERSTE EINRICHTUNG")}</small><h1>{tx("GottesdienstRegie einrichten")}</h1><p>{tx("Registriere diesen Rechner einmal für die technische Konfiguration. Die Registrierung ersetzt niemals die persönliche Anmeldung.")}</p><label>{tx("Organisation")}<input readOnly aria-readonly="true" value={organizationName}/><small>{tx("Die Organisation ist für GottesdienstRegie fest vorgegeben.")}</small></label><label>{tx("Gerätename")}<input required maxLength={80} value={name} onChange={e=>setName(e.target.value)}/></label><fieldset><legend>{tx("Verwendung")}</legend><label><input type="radio" checked={type==='shared'} onChange={()=>setType('shared')}/> {" "}{tx("Gemeinsam genutztes Gerät")}</label><label><input type="radio" checked={type==='personal'} onChange={()=>setType('personal')}/> {" "}{tx("Persönliches Gerät")}</label></fieldset>{error&&<div className="error">{tx(error)}</div>}<button className="primary" disabled={busy||!name.trim()}>{busy?tx("GERÄT WIRD REGISTRIERT …"):tx("GERÄT REGISTRIEREN")}</button><small>{tx("Nach der Registrierung meldet sich jeder Benutzer weiterhin mit seinem eigenen Konto an. Rechte werden nie aus der Geräte-ID abgeleitet.")}</small></form></main>
}

export function SharedDeviceSecurity({device}:{device:RegisteredDevice|null}){
 const {tx}=useI18n();
  if(!device)return <section><h3>{tx("Gemeinsam genutztes Gerät")}</h3><p>{tx("Dieses Gerät ist noch nicht registriert.")}</p></section>;
  return <section className="device-settings"><h3>{tx("Gemeinsam genutztes Gerät")}</h3><div className="device-identity"><span className="material-symbols-outlined">desktop_windows</span><div><b>{device.name}</b><small>{device.organizationName} · {device.platform}</small><code>{device.id}</code></div><i className={device.status}>{device.status==='online'?tx("Online"):tx("Gesperrt")}</i></div><p>{tx("Technische Display-, Audio-, Remote- und Monitor-Einstellungen bleiben bei einem Benutzerwechsel erhalten. Persönliche Sitzung und Zugangsdaten werden entfernt.")}</p></section>
}

export function useRegisteredDevice(){const [device,setDevice]=useState<RegisteredDevice|null|undefined>(undefined);useEffect(()=>{if(!window.desktop){const now=new Date().toISOString();setDevice({id:'web-browser',organizationId:'local',organizationName,name:'Web-Editor',type:'personal',platform:navigator.platform,registeredAt:now,lastSeenAt:now,status:'online'});return}void (window.desktop as any).device?.get().then((value:RegisteredDevice|null)=>setDevice(value)).catch(()=>setDevice(null))},[]);return [device,setDevice] as const}
