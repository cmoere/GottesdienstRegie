import {usePlatform} from './PlatformContext';
import type {PlatformCapability} from './types';
export function CapabilityNotice({capability}:{capability:PlatformCapability}){
  const state=usePlatform().capabilities[capability];
  return state.availability==='available'?null:<div role="note" className="capability-notice"><span className="material-symbols-outlined" aria-hidden="true">info</span><span>{state.reason}</span></div>;
}
