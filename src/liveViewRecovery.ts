import {useSyncExternalStore} from 'react';
let revision=0;const listeners=new Set<()=>void>();
export const getLiveViewRevision=()=>revision;
export function resetLiveView(){revision++;for(const listener of listeners)listener()}
export function useLiveViewRevision(){return useSyncExternalStore(listener=>{listeners.add(listener);return()=>{listeners.delete(listener)}},getLiveViewRevision,getLiveViewRevision)}
