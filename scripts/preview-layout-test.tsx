import React from 'react';
import {createRoot} from 'react-dom/client';
import {ProductionWorkspace,ProductionTimeline} from '../src/ProductionWorkspace';
import {usePresentation} from '../src/store';
import entrySource from '../src/main.tsx?raw';
import 'material-symbols/outlined.css';

// Use the app's actual ordered CSS imports: loading only the inner workspace
// styles previously missed a later shared-device override of the shell rows.
async function mount(){
 for(const match of entrySource.matchAll(/import '\.\/([^']+\.css)';/g)){
  await import(/* @vite-ignore */ '/src/'+match[1]);
 }
 const state=usePresentation.getState();
 localStorage.setItem('gottesdienstregie.timeline.expanded','false');
 localStorage.setItem('gottesdienstregie.timeline.height','190');
 document.documentElement.dataset.theme='light';
 state.newDocument('Vorschau-Layouttest');
 state.addItem('content',{title:'Testinhalt',section:'',body:'Sichtbare Vorschau'});
 state.setMode('preview');
 state.setPreviewLayout('single');
 (window as any).previewLayoutState=()=>usePresentation.getState();
 function Shell(){
  const state=usePresentation();
  return <div className={`app production-app mode-${state.mode}`}>
   <div className="menubar">Datei · Bearbeiten · Präsentation</div>
   <div className="toolbar">Bearbeiten / Vorschau</div>
   {state.mode==='edit'&&<><div className="output-tabs">MAIN</div><div className="format-toolbar">Textgestaltung</div></>}
   <div className="main">
    <aside className="service"><header>Ablauf</header><div className="service-list">{Array.from({length:18},(_,index)=><div className="service-item" key={index}><span/><span/><b>Element {index+1}</b></div>)}</div></aside>
    <div className="workspace-quick-host"><ProductionWorkspace canEdit/></div>
   </div>
   <ProductionTimeline/>
   <div className="status"><span>BEREIT</span><span>GESPEICHERT</span><i/><span>STATUS UNTEN</span></div>
  </div>;
 }
 createRoot(document.getElementById('root')!).render(<Shell/>);
}
void mount();
