import {useEffect,useState} from 'react';

export interface RegisteredDevice{id:string;organizationId:string;organizationName:string;name:string;type:'shared'|'personal';platform:string;registeredAt:string;lastSeenAt:string;status:'online'|'locked'}
const organizationName='Philippus Gemeinde Bielefeld e. V.';

export function DeviceSetup({complete}:{complete:(device:RegisteredDevice)=>void}){
  const [name,setName]=useState('Regie-PC Saal'),[type,setType]=useState<'shared'|'personal'>('shared'),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function submit(event:React.FormEvent){event.preventDefault();setBusy(true);setError('');try{const device=await (window.desktop as any)?.device?.register({organizationName,name,type}) as RegisteredDevice|undefined;if(!device)throw new Error('Geräteregistrierung ist in dieser Umgebung nicht verfügbar.');complete(device)}catch(reason){setError(reason instanceof Error?reason.message:String(reason))}finally{setBusy(false)}}
  return <main className="device-setup"><form onSubmit={submit}><span className="material-symbols-outlined">computer</span><small>ERSTE EINRICHTUNG</small><h1>GottesdienstRegie einrichten</h1><p>Registriere diesen Rechner einmal für die technische Konfiguration. Die Registrierung ersetzt niemals die persönliche Anmeldung.</p><label>Organisation<input readOnly aria-readonly="true" value={organizationName}/><small>Die Organisation ist für GottesdienstRegie fest vorgegeben.</small></label><label>Gerätename<input required maxLength={80} value={name} onChange={e=>setName(e.target.value)}/></label><fieldset><legend>Verwendung</legend><label><input type="radio" checked={type==='shared'} onChange={()=>setType('shared')}/> Gemeinsam genutztes Gerät</label><label><input type="radio" checked={type==='personal'} onChange={()=>setType('personal')}/> Persönliches Gerät</label></fieldset>{error&&<div className="error">{error}</div>}<button className="primary" disabled={busy||!name.trim()}>{busy?'GERÄT WIRD REGISTRIERT …':'GERÄT REGISTRIEREN'}</button><small>Nach der Registrierung meldet sich jeder Benutzer weiterhin mit seinem eigenen Konto an. Rechte werden nie aus der Geräte-ID abgeleitet.</small></form></main>
}

export function SharedDeviceSecurity({device}:{device:RegisteredDevice|null}){
  if(!device)return <section><h3>Gemeinsam genutztes Gerät</h3><p>Dieses Gerät ist noch nicht registriert.</p></section>;
  return <section className="device-settings"><h3>Gemeinsam genutztes Gerät</h3><div className="device-identity"><span className="material-symbols-outlined">desktop_windows</span><div><b>{device.name}</b><small>{device.organizationName} · {device.platform}</small><code>{device.id}</code></div><i className={device.status}>{device.status==='online'?'Online':'Gesperrt'}</i></div><p>Technische Display-, Audio-, Remote- und Monitor-Einstellungen bleiben bei einem Benutzerwechsel erhalten. Persönliche Sitzung und Zugangsdaten werden entfernt.</p></section>
}

export function useRegisteredDevice(){const [device,setDevice]=useState<RegisteredDevice|null|undefined>(undefined);useEffect(()=>{void (window.desktop as any)?.device?.get().then((value:RegisteredDevice|null)=>setDevice(value)).catch(()=>setDevice(null))},[]);return [device,setDevice] as const}
