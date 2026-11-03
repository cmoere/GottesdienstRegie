import {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {LocalSlideDraftDialog} from '../../src/localSlides/LocalSlideDraftDialog';
import {usePresentation} from '../../src/store';
import {usePreferences} from '../../src/preferences';
import {useLiveOutputPreview} from '../../src/liveOutputPreview';
import {OutputTimingPanel} from '../../src/OutputTimingPanel';
import {useOutputPaintReport,type PendingOutputPaint} from '../../src/outputPaintReport';
import {useScheduledOutputSlide,outputPresentationDelay} from '../../src/outputPresentation';
import {SlideRenderer} from '../../src/SlideRenderer';
import {startRouteProbe} from '../../src/audio/RouteProbe';
import {defaultAudioRouting} from '../../src/audioRouting';
import {initializePresentationStartup,prepareStartupSession} from '../../src/presentationStartup';
import '../../src/styles.css';import '../../src/cera-pro.css';import '../../src/operator-design.css';
const bridge=window.desktop!,output=location.hash==='#output';
usePreferences.setState({language:'de',germanRegion:null,aiEnabled:true} as any);
usePresentation.getState().newDocument('Native v97 drafting','2026-11-03');
(window as any).v97={
 state:()=>({items:usePresentation.getState().items,history:usePresentation.getState().history.length,onAir:usePresentation.getState().onAir}),
 preview:async(slide:any)=>{usePresentation.setState({onAir:true});await new Promise(resolve=>setTimeout(resolve,outputPresentationDelay(slide)));useLiveOutputPreview.setState({slide})},
 undo:()=>usePresentation.getState().undo(),
 startup:async()=>{const start=performance.now();await initializePresentationStartup(prepareStartupSession(Promise.resolve('session'),[()=>new Promise(()=>{})]),Promise.resolve('document'),Promise.resolve(null),()=>{});return performance.now()-start},
 audio:async()=>{const controller=new AbortController(),probe=await startRouteProbe(defaultAudioRouting,'background',controller.signal);await new Promise(resolve=>setTimeout(resolve,150));const level=probe.sample();controller.abort();return{level,after:probe.sample()}},
};
function OutputFixture(){
 const [slide,setSlide]=useScheduledOutputSlide(),[pending,setPending]=useState<PendingOutputPaint|null>(null);
 const report=(receipt:any)=>{void bridge.outputTiming?.report(receipt)};
 useEffect(()=>{const apply=(state:any)=>{if(!state)return;setPending({slide:state.slide,delivery:state.delivery,receivedAtMs:Date.now()});setSlide(state.slide)};const off=(bridge as any).onOutputState(apply);void(bridge as any).getOutputState().then(apply);return off},[setSlide]);
 // Keep the callback stable across the scheduled slide state update.
 useOutputPaintReport(slide,pending,report);
 return <div style={{width:'100vw',height:'100vh',containerType:'size'}}>{slide&&<SlideRenderer slide={slide}/>}</div>;
}
function OperatorFixture(){const [open,setOpen]=useState(true);return <><OutputTimingPanel/>{open&&<LocalSlideDraftDialog sectionId="service" close={()=>setOpen(false)}/>}</>}
createRoot(document.getElementById('root')!).render(output?<OutputFixture/>:<OperatorFixture/>);
