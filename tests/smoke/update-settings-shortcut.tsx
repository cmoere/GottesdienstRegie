import {useCallback,useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {SettingsModal} from '../../src/App';
import {useUpdateSettingsRequest} from '../../src/useUpdateSettingsRequest';
import 'material-symbols/outlined.css';import '../../src/cera-pro.css';import '../../src/styles.css';import '../../src/settings-v08.css';import '../../src/update-controls.css';
const stats={statusReads:0,download:0,cancel:0};
(window as any).shortcutStats=stats;
window.desktop={displays:async()=>[],onDisplaysChanged:()=>()=>{},device:{get:async()=>null},updates:{currentVersion:async()=>'0.92.0',metadata:async()=>null,previous:async()=>null,status:async()=>{stats.statusReads++;return{state:'downloading',version:'0.93.0',percent:42}},onStatus:()=>()=>{},onOpenSettings:(callback:()=>void)=>{(window as any).requestUpdateSettings=callback;return()=>{delete(window as any).requestUpdateSettings}},download:async()=>{stats.download++},cancelDownload:async()=>{stats.cancel++}}} as any;
function Fixture(){
 const[open,setOpen]=useState(true),[request,setRequest]=useState(0);
 const showUpdates=useCallback(()=>{setRequest(value=>value+1);setOpen(true)},[]);
 useUpdateSettingsRequest(showUpdates);
 useEffect(()=>{if(!open)setRequest(0)},[open]);
 return <>{open?<SettingsModal close={()=>setOpen(false)} canConfigure={true} openUpdatesRequest={request}/>:<button id="reopen" onClick={()=>setOpen(true)}>Einstellungen öffnen</button>}</>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
