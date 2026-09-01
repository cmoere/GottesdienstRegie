import fs from 'node:fs/promises';
import path from 'node:path';

export type WindowStartMode='fullscreen'|'maximized'|'window'|'restore';
export type OperatorDisplayTarget='primary'|'last';
export interface AppPreferencesData{
  windowStartMode:WindowStartMode;
  operatorDisplayTarget:OperatorDisplayTarget;
  automaticUpdates:boolean;
  autoDownloadUpdates:boolean;
  lastDisplayId?:number;
  lastWindowState?:'fullscreen'|'maximized'|'window';
  bounds?:{x:number;y:number;width:number;height:number};
}

const defaults:AppPreferencesData={windowStartMode:'fullscreen',operatorDisplayTarget:'primary',automaticUpdates:true,autoDownloadUpdates:true};

export class AppPreferences{
  private value:AppPreferencesData={...defaults};
  constructor(private readonly file:string){}
  async load(){try{this.value={...defaults,...JSON.parse(await fs.readFile(this.file,'utf8'))}}catch{}return this.get()}
  get(){return structuredClone(this.value)}
  async update(patch:Partial<AppPreferencesData>){this.value={...this.value,...patch};await fs.mkdir(path.dirname(this.file),{recursive:true});const temporary=`${this.file}.tmp`;await fs.writeFile(temporary,JSON.stringify(this.value,null,2),'utf8');try{await fs.rename(temporary,this.file)}catch{await fs.unlink(this.file).catch(()=>{});await fs.rename(temporary,this.file)}return this.get()}
}
