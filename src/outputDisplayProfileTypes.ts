export type OutputDisplayRole='operator'|'main'|'stage'|'notes'|'livestream'|'lobby';
export interface OutputDisplayIdentity {label:string;pixelWidth:number;pixelHeight:number}
export interface OutputDisplayAssignment {role:OutputDisplayRole;lastDisplayId:number;identity:OutputDisplayIdentity}
export interface OutputDisplayProfile {version:1;assignments:OutputDisplayAssignment[]}
export interface OutputDisplayWriteOptions {clearRoles?:OutputDisplayRole[]}
export interface OutputDisplayProfileState {
  profile:OutputDisplayProfile|null;
  assignments:Record<string,string>;
  unresolved:{role:OutputDisplayRole;lastDisplayId:number;label:string;reason:'missing'|'ambiguous'}[];
}
