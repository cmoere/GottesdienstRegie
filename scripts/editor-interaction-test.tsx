import React from 'react';
import {createRoot} from 'react-dom/client';
import {ProductionWorkspace} from '../src/ProductionWorkspace';
import {usePresentation} from '../src/store';
import '../src/styles.css';
import '../src/shared-device.css';
import '../src/preview-workspace.css';
import {WindowControls} from '../src/WindowControls';
const state=usePresentation.getState();state.newDocument('Drag test');state.addItem('content',{title:'Text',section:'',body:'Test'});state.setMode('edit');
(window as any).editorState=()=>usePresentation.getState();
(window as any).websiteTest=()=>{const state=usePresentation.getState();state.newDocument('Web test');state.addItem('web',{title:'Web',section:'',body:'',metadata:{url:'about:blank'}});state.addElement('web');const current=usePresentation.getState(),page=current.items[0].slides[0],web=page.elements.find(element=>element.type==='web')!;current.updateElement(web.id,{properties:{...web.properties,src:'about:blank',allowForms:false,referrerPolicy:'strict-origin-when-cross-origin'}})};
if(location.search.includes('window-controls')){
 (window as any).desktop={operator:{fullscreen:async()=>true,onFullscreen:()=>()=>{},control:(action:string)=>(window as any).lastWindowAction=action}};
 createRoot(document.getElementById('root')!).render(<div className="production-app"><div className="menubar"><WindowControls/><div className="sync-control"><button>Sync</button></div></div><div className="top-profile-root"><button className="top-profile-button"><span className="material-symbols-outlined">account_circle</span><span>Sehr langer Benutzername für die Kollisionsprüfung</span><span className="material-symbols-outlined">arrow_drop_down</span></button></div></div>);
}else createRoot(document.getElementById('root')!).render(<div style={{height:'900px'}}><ProductionWorkspace canEdit/></div>);
