import type {PlatformServices} from '../PlatformServices';
import {webCapabilities} from '../capabilities';
import {CapabilityUnavailableError} from '../types';

const unsupported=(capability:'outputMain'|'updates')=>new CapabilityUnavailableError(capability,webCapabilities[capability]);
export function createWebServices():PlatformServices{
  const noData=()=>Promise.reject(new Error('WEB_SERVICE_NOT_CONFIGURED'));
  return {
    target:'web',capabilities:webCapabilities,
    auth:{login:noData,verifyTwoFactor:noData,cancelTwoFactor:async()=>{},restore:async()=>null,logout:async()=>{}},
    presentations:{list:noData,load:noData,create:noData,save:noData},
    media:{list:noData,importFiles:noData,remove:noData,status:noData},
    desktop:{
      displays:async()=>{throw unsupported('outputMain')},identifyDisplays:async()=>{throw unsupported('outputMain')},
      preflight:async()=>{throw unsupported('outputMain')},goOnAir:async()=>{throw unsupported('outputMain')},
      goOffAir:async()=>{throw unsupported('outputMain')},sendLiveSlide:async()=>{throw unsupported('outputMain')},
      openExternal:async url=>{window.open(url,'_blank','noopener,noreferrer');return true},
      updates:{currentVersion:async()=>{throw unsupported('updates')},check:async()=>{throw unsupported('updates')},download:async()=>{throw unsupported('updates')},install:async()=>{throw unsupported('updates')}}
    }
  };
}
