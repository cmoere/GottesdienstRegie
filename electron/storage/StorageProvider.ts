export type StorageKind='image'|'video'|'audio'|'pdf';
export interface StorageObject{id:string;name:string;path:string;kind:StorageKind;size:number;checksum:string;downloadUrl:string;updatedAt?:string}
export interface StorageStatus{provider:string;online:boolean;writable:boolean;message:string}
export interface StorageProvider{status():Promise<StorageStatus>;list():Promise<StorageObject[]>;upload(input:{name:string;kind:StorageKind;checksum:string;data:Buffer}):Promise<StorageObject>}
