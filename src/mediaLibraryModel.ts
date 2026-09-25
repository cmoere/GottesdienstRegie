import type {CloudMediaAsset} from './platform/types';
export function validateMediaName(input:string){const value=input.trim();return !value?{ok:false as const,reason:'empty' as const}:value.length>300?{ok:false as const,reason:'too-long' as const}:{ok:true as const,value};}
export function isAiGenerated(asset:Pick<CloudMediaAsset,'aiGenerated'|'tags'>){return asset.aiGenerated===true||(asset.tags??[]).includes('KI-generiert');}
export function sortRecentlyUsed<T extends CloudMediaAsset>(items:T[]){return items.filter(item=>item.lastUsedAt).sort((a,b)=>String(b.lastUsedAt).localeCompare(String(a.lastUsedAt)));}
