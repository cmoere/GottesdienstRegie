import React from 'react';
import {createRoot} from 'react-dom/client';
import {OrderOfService} from '../src/App';
import {usePresentation} from '../src/store';
import entrySource from '../src/main.tsx?raw';
import 'material-symbols/outlined.css';

async function mount(){
 for(const match of entrySource.matchAll(/import '\.\/([^']+\.css)';/g)) await import(/* @vite-ignore */ '/src/'+match[1]);
 document.documentElement.dataset.theme='light';
 const state=usePresentation.getState();
 state.newDocument('Loop-Menü-Test');
 usePresentation.setState({items:[],selectedItemId:'',selectedSlideId:''});
 state.updateSection('pre',{autoLoop:false,supportsLoopItems:false});
 (window as any).loopTestState=()=>usePresentation.getState();
 createRoot(document.getElementById('root')!).render(<div className="app production-app mode-preview">
  <div className="menubar">Datei</div><div className="toolbar">Vorschau</div>
  <div className="main"><OrderOfService canEdit onTake={()=>{}}/><div/></div>
 </div>);
}
void mount();
