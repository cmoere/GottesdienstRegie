import type {AuthSession,LoginResult} from '../auth';
import type {PresentationDocument} from '../store';
import type {CapabilityState,MediaAsset,MediaStorageStatus,PlatformCapability,PlatformTarget,PresentationSummary,SaveResult} from './types';

export interface AuthService{
  login(email:string,password:string,remember:boolean):Promise<LoginResult>;
  verifyTwoFactor(challengeId:string,code:string,recovery:boolean):Promise<AuthSession>;
  cancelTwoFactor(challengeId:string):Promise<void>;
  restore(activeSession?:boolean):Promise<AuthSession|null>;
  logout():Promise<void>;
}
export interface PresentationService{
  list(options?:{archived?:boolean;trashed?:boolean}):Promise<PresentationSummary[]>;
  load(id:string):Promise<{document:PresentationDocument;revision:string}|null>;
  create(input:{title?:string;date?:string;template?:PresentationDocument}):Promise<{document:PresentationDocument;revision:string}>;
  save(document:PresentationDocument,baseRevision?:string):Promise<SaveResult>;
}
export interface MediaService{
  list():Promise<MediaAsset[]>;
  importFiles(files?:ReadonlyArray<File>,onProgress?:(percent:number,fileName:string)=>void):Promise<MediaAsset[]>;
  remove(id:string):Promise<boolean>;
  status():Promise<MediaStorageStatus>;
}
export interface DesktopOnlyService{
  displays():Promise<DesktopDisplay[]>;
  identifyDisplays(assignments:Record<string,string>):Promise<boolean>;
  preflight(assignments:Record<string,string>,presentation:{hasPresentation:boolean;activeSlideCount:number;media:string[]}):Promise<DesktopPreflight>;
  goOnAir(assignments:Record<string,string>,payload:unknown):Promise<boolean>;
  goOffAir():Promise<boolean>;
  sendLiveSlide(payload:unknown):Promise<boolean>;
  openExternal(url:string):Promise<boolean>;
  updates:{currentVersion():Promise<string>;check():Promise<DesktopUpdateStatus>;download():Promise<boolean>;install():Promise<boolean>};
}
export interface PlatformServices{
  target:PlatformTarget;
  capabilities:Record<PlatformCapability,CapabilityState>;
  auth:AuthService;
  presentations:PresentationService;
  media:MediaService;
  desktop:DesktopOnlyService;
}
