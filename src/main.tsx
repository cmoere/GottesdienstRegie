import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './cera-pro.css';
import 'material-symbols/outlined.css';
import { App } from './App';
import './styles.css';
import './settings-v08.css';
import './v09.css';
import './v010.css';
import './auth.css';
import './media-browser.css';
import './audio-browser.css';
import './background-audio.css';
import './background-audio-fixes.css';
import './audio-routing.css';
import './menu-help-fixes.css';
import './media-browser-fixes.css';
import './update-controls.css';
import './preview-workspace.css';
import './refinements.css';
import './help-v032.css';
import './v033.css';
import './history-rewards.css';
import './shared-device.css';
import './song-editor.css';

class AppErrorBoundary extends React.Component<React.PropsWithChildren,{error:string|null}>{
  state:{error:string|null}={error:null};
  static getDerivedStateFromError(error:unknown){return {error:error instanceof Error?error.message:String(error)}}
  componentDidCatch(error:unknown){console.error('GottesdienstRegie renderer error',error)}
  render(){return this.state.error?<main className="fatal-render-error"><div><span className="material-symbols-outlined">error</span><h1>GottesdienstRegie konnte die Oberfläche nicht laden</h1><p>{this.state.error}</p><button onClick={()=>location.reload()}>ERNEUT LADEN</button></div></main>:this.props.children}
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><AppErrorBoundary><App /></AppErrorBoundary></React.StrictMode>);
