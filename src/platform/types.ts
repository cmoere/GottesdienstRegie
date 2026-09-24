import type {PresentationDocument} from '../store';

export type PlatformTarget='desktop'|'web';
export type CapabilityAvailability='available'|'unavailable'|'disconnected';
export interface CapabilityState{availability:CapabilityAvailability;reason?:string}
export type PlatformCapability='auth'|'presentations'|'media'|'outputMain'|'outputStage'|'outputLivestream'|'updates'|'localTranslation'|'videoInput'|'audioRouting';

export interface PresentationSummary{id:string;title:string;date:string;createdAt:string;updatedAt:string;archived:boolean;trashed:boolean;itemCount:number;slideCount:number}
export interface MediaAsset{id:string;name:string;fileName:string;url:string;kind:'image'|'video'|'audio'|'pdf';extension:string;size:number;checksum:string;createdAt:string;updatedAt:string;favorite:boolean;tags:string[];syncState:'local-only'|'uploading'|'synced'|'error';github?:{repository:string;path:string;sha:string;downloadUrl:string}}
export interface OnlineMediaAsset{id:string;name:string;path:string;kind:'image'|'video'|'audio'|'pdf';size:number;checksum:string;downloadUrl:string;updatedAt?:string}
export interface CloudMediaAsset extends OnlineMediaAsset{favorite?:boolean;tags?:string[];createdAt?:string;extension?:string;visibility?:'private'|'team'|'community'}
export interface MediaStorageStatus{provider:string;online:boolean;writable:boolean;message:string}
export interface SaveResult{summary:PresentationSummary;revision:string}

export class RevisionConflictError extends Error{
  constructor(public readonly local:PresentationDocument,public readonly remote:PresentationDocument){
    super('REVISION_CONFLICT');
    this.name='RevisionConflictError';
  }
}

export class CapabilityUnavailableError extends Error{
  constructor(public readonly capability:PlatformCapability,public readonly state:CapabilityState){
    super(state.reason??`${capability} ist auf dieser Plattform nicht verfügbar.`);
    this.name='CapabilityUnavailableError';
  }
}
