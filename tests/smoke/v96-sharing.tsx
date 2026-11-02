import {RemoteCenter} from '../../src/RemoteCenter';import '../../src/shared-device.css';
import '../../src/styles.css';
import React from 'react';import {createRoot} from 'react-dom/client';import {ScreenSharingController,ScreenSharingPanel,ScreenSharingOutput,useScreenShare} from '../../src/ScreenSharing';import {OutputComposition} from '../../src/OutputComposition';import {TestModeWatermark} from '../../src/TestModeWatermark';import '../../src/operator-design.css';import '../../src/outputComposition.css';
document.body.style.margin='0';document.body.style.overflow='hidden';
const main=location.hash==='#main';(window as any).shareState=()=>{const s=useScreenShare.getState();return{state:s.state,stream:!!s.stream,error:s.error}};
createRoot(document.getElementById('root')!).render(main?<div style={{width:'100vw',height:'100vh',background:'#163820'}}><OutputComposition banner={null} testOverlay={<TestModeWatermark role="main" visible/>}><div id="normal-slide">Normal slide</div><ScreenSharingOutput/><div id="quick" hidden style={{position:'absolute',inset:0,background:'#000',zIndex:10}}>Quick</div></OutputComposition></div>:<><ScreenSharingController/><RemoteCenter/></>);
