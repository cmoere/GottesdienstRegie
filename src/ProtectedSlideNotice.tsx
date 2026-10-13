import {useEffect,useRef} from 'react';
export function ProtectedSlideNotice({onClose}:{onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{dialog.current?.showModal()},[]);
 return <dialog className="protected-slide-notice" ref={dialog} onCancel={event=>{event.preventDefault();onClose()}} aria-labelledby="protected-slide-title"><h2 id="protected-slide-title">Automatische Nachprogrammfolie</h2><p>Diese Systemfolie wird automatisch vorbereitet. Sie kann nicht bearbeitet, verschoben oder entfernt werden.</p><p>Für Beispieldaten wähle „Testbetrieb vorbereiten“. Die Vorschau bleibt geöffnet.</p><button autoFocus onClick={onClose}>OK</button></dialog>;
}
