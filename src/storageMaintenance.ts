export type StorageCategory = 'translation-packs' | 'transformers-cache' | 'media-cache' | 'thumbnails' | 'temporary-downloads' | 'web-cache';
export interface StorageCategorySnapshot { category: StorageCategory; bytes: number; files: number; error?: string }
export interface StorageSnapshot { totalBytes: number; categories: StorageCategorySnapshot[] }
export const storageCategoryLabels:Record<StorageCategory,string>={
  'translation-packs':'Heruntergeladene Übersetzungsmodelle','transformers-cache':'Modell-Zwischenspeicher','media-cache':'Medien-Zwischenspeicher',thumbnails:'Vorschaubilder','temporary-downloads':'Unvollständige Downloads','web-cache':'Web-Cache',
};
export function formatStorageBytes(bytes:number){if(bytes<1024)return `${bytes} B`;if(bytes<1024**2)return `${(bytes/1024).toFixed(1)} KB`;if(bytes<1024**3)return `${(bytes/1024**2).toFixed(1)} MB`;return `${(bytes/1024**3).toFixed(2)} GB`;}
