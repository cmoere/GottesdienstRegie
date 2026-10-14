export interface LoginPreferences {openAtLogin:boolean;checkUpdatesAtLogin:boolean}
export function shouldCheckAfterWorkspace(args:string[],preferences:{automaticUpdates:boolean;checkUpdatesAtLogin:boolean}){return preferences.automaticUpdates||(args.includes('--login-startup')&&preferences.checkUpdatesAtLogin)}
export function loginItemSettings(preferences:LoginPreferences){return {openAtLogin:preferences.openAtLogin||preferences.checkUpdatesAtLogin,args:['--login-startup']}}
export function resolveLoginStartup(args:string[],preferences:LoginPreferences):'normal'|'background'|'exit'{
  if(!args.includes('--login-startup')||preferences.openAtLogin)return 'normal';
  return preferences.checkUpdatesAtLogin?'background':'exit';
}
export function validateLoginPreferences(input:unknown):Partial<LoginPreferences>{
  if(!input||typeof input!=='object')return {};
  const source=input as Record<string,unknown>,result:Partial<LoginPreferences>={};
  for(const key of ['openAtLogin','checkUpdatesAtLogin'] as const)if(typeof source[key]==='boolean')result[key]=source[key];
  return result;
}
interface BackgroundCheck {check:()=>Promise<{state:string;version?:string}>;notify:(version:string)=>void;shouldOpen:()=>boolean;openRequested?:Promise<void>;open:()=>void|Promise<void>;quit:()=>void}
export async function runBackgroundUpdateCheck(effects:BackgroundCheck,timeoutMs=30000){
  let timer:ReturnType<typeof setTimeout>|undefined;
  let status:{state:string;version?:string}|undefined;
  const pending:Array<Promise<{state:string;version?:string}|undefined>>=[effects.check(),new Promise<undefined>(resolve=>{timer=setTimeout(()=>resolve(undefined),timeoutMs)})];
  if(effects.openRequested)pending.push(effects.openRequested.then(()=>undefined));
  try{status=await Promise.race(pending)}catch{}finally{clearTimeout(timer)}
  if(effects.shouldOpen()){await effects.open();return}
  try{if(status?.state==='available'&&status.version)effects.notify(status.version)}finally{effects.quit()}
}
