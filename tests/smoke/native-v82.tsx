import React from 'react';
import {createRoot} from 'react-dom/client';
import {OutputComposition} from '../../src/OutputComposition';
import {CountdownView} from '../../src/CountdownView';
import {countdownPresets} from '../../src/countdownPresets';
import {TestModeWatermark} from '../../src/TestModeWatermark';
import {BannerSession} from '../../src/announcementBannerSession';
import {isBannerAllowed} from '../../src/announcementBannerModel';
import '../../src/cera-pro.css';
import '../../src/styles.css';
const root=createRoot(document.getElementById('root')!);
const settle=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
const session=new BannerSession();
let banner:any=null;
async function show(design='clear',position:'top'|'bottom'='bottom',test=true,website=false){
  await document.fonts.load('400 44px "Cera Pro"');await document.fonts.ready;
  banner={revision:1,position,reserved:true,items:[{id:'demo',text:'Herzlich willkommen zum Gottesdienst. Anschließend laden wir herzlich zum Gemeindecafé ein.',priority:'normal'}],textWidth:2000,cycleStartedAtMs:Date.now()-19000,reducedMotion:false};
  const preset=countdownPresets.find(p=>p.durationSeconds===300&&p.designId===design)!;
  root.render(<div style={{position:'relative',width:'100vw',height:'100vh'}}><OutputComposition banner={banner} testOverlay={<TestModeWatermark role="main" visible={test}/>}>{website?<iframe title="Website" srcDoc="<html><body style='margin:0;background:#608f9a;height:100vh;display:grid;place-items:center;font:80px sans-serif'>Gemeindeseite</body></html>" style={{width:'100%',height:'100%',border:0}}/>:<CountdownView presetId={preset.id} durationMs={300000} startedAtMs={100000} nowMs={125000}/>}</OutputComposition></div>);
  await settle();return true;
}
async function update(){
  const before=document.querySelector('iframe');banner={...banner,revision:2,position:'top'};
  root.render(<div style={{position:'relative',width:'100vw',height:'100vh'}}><OutputComposition banner={banner} testOverlay={<TestModeWatermark role="main" visible/>}><iframe title="Website" srcDoc="<html><body>Gemeindeseite</body></html>" style={{width:'100%',height:'100%',border:0}}/></OutputComposition></div>);
  await settle();return before===document.querySelector('iframe');
}
function flow(){
  const input={items:[{id:'a',text:'Erste Meldung',priority:'normal' as const}],textWidths:[600],nowMs:1000,takeKey:'pre',allowed:true,enabled:true,position:'bottom' as const,reducedMotion:false};
  const start=session.update(input),next=session.update({...input,takeKey:'post',nowMs:2000});
  return {sameAnchor:start?.cycleStartedAtMs===next?.cycleStartedAtMs,service:isBannerAllowed({liveSection:'service',quickType:null,countdownActive:false}),black:isBannerAllowed({liveSection:'post',quickType:'black',countdownActive:false}),countdown:isBannerAllowed({liveSection:'service',quickType:'countdown',countdownActive:true})};
}
(window as any).v82={show,update,flow};
