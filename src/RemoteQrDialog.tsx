import {useI18n} from "./i18n";
import {useEffect,useState} from 'react';
import QRCode from 'qrcode';

export function RemoteQrDialog({url,name,onClose}:{url:string;name:string;onClose:()=>void}){
 const {tx}=useI18n();
 const [image,setImage]=useState(''),[error,setError]=useState(false);
 useEffect(()=>{let active=true;setImage('');setError(false);void QRCode.toDataURL(url,{width:640,margin:4,errorCorrectionLevel:'M'}).then(value=>{if(active)setImage(value)}).catch(()=>{if(active)setError(true)});return()=>{active=false}},[url]);
 useEffect(()=>{const close=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose()};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[onClose]);
 return <div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
  <section className="modal remote-qr-dialog" role="dialog" aria-modal="true" aria-labelledby="remote-qr-title" style={{maxWidth:520,padding:24}}>
   <h3 id="remote-qr-title">{name}</h3><p>{tx("Mit der Kamera des Geräts scannen. Beide Geräte müssen im selben lokalen Netzwerk sein.")}</p>
   {image?<img src={image} alt={tx("QR-Code für {value1}",{value1:String(name)})} style={{display:'block',width:'min(100%, 340px)',height:'auto',margin:'16px auto'}}/>:<p role="status">{error?tx("QR-Code konnte nicht erstellt werden. Bitte den Link kopieren."):tx("QR-Code wird erstellt …")}</p>}
   <p style={{overflowWrap:'anywhere',userSelect:'text',fontSize:13}}>{url}</p>
   <p>{tx("Ein Steuerungslink erteilt Zugriff mit den freigegebenen Rechten. Teile ihn nur mit der vorgesehenen Person.")}</p>
   <footer><button onClick={()=>void navigator.clipboard.writeText(url)}>{tx("URL kopieren")}</button><button autoFocus onClick={onClose}>{tx("Schließen")}</button></footer>
  </section>
 </div>;
}
