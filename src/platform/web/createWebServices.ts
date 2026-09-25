import type {PlatformServices} from '../PlatformServices';
import {webCapabilities} from '../capabilities';
import {CapabilityUnavailableError} from '../types';
import {createLocalPresentationService} from './LocalPresentationService';

const unsupported=(capability:'outputMain'|'updates')=>new CapabilityUnavailableError(capability,webCapabilities[capability]);
export function createWebServices():PlatformServices{
  const noData=()=>Promise.reject(new Error('WEB_SERVICE_NOT_CONFIGURED'));
  const session={user:{uid:'web-local',email:'web-editor@localhost',firstname:'Web',lastName:'Editor',role:'editor',appAccess:{gottesdienstRegie:{enabled:true,authMode:'sso' as const,role:'editor' as const,permissions:{presentationView:true,presentationCreate:true,presentationEdit:true}}}},permissions:['presentationView','presentationCreate','presentationEdit'],expiresAt:Number.MAX_SAFE_INTEGER};
  return {
    target:'web',capabilities:webCapabilities,
    auth:{login:async()=>session,verifyTwoFactor:noData,cancelTwoFactor:async()=>{},restore:async()=>session,logout:async()=>{}},
    presentations:createLocalPresentationService(localStorage),
    media:{list:noData,importFiles:noData,remove:noData,markUsed:noData,status:noData},
    desktop:{
      displays:async()=>{throw unsupported('outputMain')},identifyDisplays:async()=>{throw unsupported('outputMain')},
      preflight:async()=>{throw unsupported('outputMain')},goOnAir:async()=>{throw unsupported('outputMain')},
      goOffAir:async()=>{throw unsupported('outputMain')},sendLiveSlide:async()=>{throw unsupported('outputMain')},
      openExternal:async url=>{window.open(url,'_blank','noopener,noreferrer');return true},
      updates:{currentVersion:async()=>{throw unsupported('updates')},check:async()=>{throw unsupported('updates')},download:async()=>{throw unsupported('updates')},install:async()=>{throw unsupported('updates')}}
    }
  };
}
