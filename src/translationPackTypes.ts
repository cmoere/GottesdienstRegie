export type TranslationPackStatus='not-downloaded'|'queued'|'downloading'|'ready'|'error'|'update-available';
export interface TranslationPackDescriptor{key:string;source:string;target:string;model:string;revision:string;status:TranslationPackStatus;size?:number;downloadedBytes?:number;error?:string;requiredFiles?:string[]}
export interface TranslationPackProgress{key:string;status:TranslationPackStatus;downloadedBytes:number;totalBytes?:number;percent:number;error?:string}
export interface TranslationPackCapability{supported:boolean;descriptor?:TranslationPackDescriptor}
