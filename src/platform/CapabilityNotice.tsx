import {usePlatform} from './PlatformContext';
import type {PlatformCapability} from './types';
import {DESKTOP_RELEASE_URL} from '../platformLinks';
export function CapabilityNotice({capability}:{capability:PlatformCapability}){
  const platform=usePlatform();
  const state=platform.capabilities[capability];
  return state.availability==='available'?null:<div role="note" className="capability-notice"><span className="material-symbols-outlined" aria-hidden="true">info</span><span>{state.reason} {platform.target==='web'&&<a href={DESKTOP_RELEASE_URL} target="_blank" rel="noopener noreferrer">Desktop-App herunterladen</a>}</span></div>;
}
