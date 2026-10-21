import {create} from 'zustand';
import type {BannerPosition} from './announcementBannerModel';
import {normalizeBannerPosition} from './bannerSettings';
export const useBannerSettings=create<{position:BannerPosition;ready:boolean;error:''|'load'|'save'}>(()=>({position:'bottom',ready:false,error:''}));
let loading:Promise<void>|undefined;
export function loadBannerSettings():Promise<void>{
  if(loading)return loading;
  loading=(async()=>{try{const value=await(window.desktop as any)?.deviceSettings?.readBannerPosition?.();useBannerSettings.setState({position:normalizeBannerPosition(value),ready:true,error:''})}catch{useBannerSettings.setState({ready:true,error:'load'})}})();
  return loading;
}
export async function saveBannerPosition(position:BannerPosition){
  try{const result=await(window.desktop as any)?.deviceSettings?.writeBannerPosition?.(position);if(result!==position)throw new Error('not saved');useBannerSettings.setState({position,error:''});return true}catch{useBannerSettings.setState({error:'save'});return false}
}
