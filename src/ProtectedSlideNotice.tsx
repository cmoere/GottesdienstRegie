import {useI18n} from './i18n';
import {useEffect,useRef} from 'react';
export function ProtectedSlideNotice({onClose}:{onClose:()=>void}){
 const {tx}=useI18n();
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{dialog.current?.showModal()},[]);
 return <dialog className="protected-slide-notice" ref={dialog} onCancel={event=>{event.preventDefault();onClose()}} aria-labelledby="protected-slide-title"><h2 id="protected-slide-title">{tx("Automatische Nachprogrammfolie")}</h2><p>{tx("Diese Systemfolie wird automatisch vorbereitet. Sie kann nicht bearbeitet, verschoben oder entfernt werden.")}</p><p>{tx("Für Beispieldaten wähle „Testbetrieb vorbereiten“. Die Vorschau bleibt geöffnet.")}</p><button autoFocus onClick={onClose}>{tx("OK")}</button></dialog>;
}
