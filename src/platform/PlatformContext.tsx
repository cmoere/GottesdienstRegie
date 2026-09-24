import {createContext,useContext,type PropsWithChildren} from 'react';
import type {PlatformServices} from './PlatformServices';

const PlatformContext=createContext<PlatformServices|null>(null);
export function PlatformProvider({services,children}:PropsWithChildren<{services:PlatformServices}>){
  return <PlatformContext.Provider value={services}>{children}</PlatformContext.Provider>;
}
export function usePlatform(){
  const value=useContext(PlatformContext);
  if(!value)throw new Error('PLATFORM_PROVIDER_MISSING');
  return value;
}
