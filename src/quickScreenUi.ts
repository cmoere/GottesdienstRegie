import type {QuickScreenType,QuickScreenConfig} from './preferences';
import {AppClock} from './community/AppClock';
const shortcuts:Partial<Record<QuickScreenType,string>>={logo:'F2',black:'F3',empty:'F4',noText:'F5',amen:'F6',countdown:'F7',bible:'F9'};
export function quickScreenShortcut(type:QuickScreenType):string{return shortcuts[type]??''}
export function quickScreenTypeForKey(key:string):QuickScreenType|undefined{const normalized=key.toUpperCase();return (Object.entries(shortcuts).find(([,value])=>value===normalized)?.[0]) as QuickScreenType|undefined}
export function normalizeBibleDisplayText(value:string):string{return value.replace(/\bGOtt\b/g,'Gott')}
export function shouldRenderOperatorQuick(mode:'edit'|'preview',type:QuickScreenType|undefined):boolean{return mode==='preview'&&Boolean(type)}
export function quickOverridesRoomNotice(quick:QuickScreenConfig|null):boolean{return quick?.type==='screenTest'||quick?.id==='technical-issue'}
export async function applyQuickScreen(quick:QuickScreenConfig|null,actions:{onAir:boolean;openBible:()=>void;setQuick:(quick:QuickScreenConfig|null)=>void;sendQuick:(roles:string[],quick:QuickScreenConfig|null)=>Promise<unknown>;now?:()=>number}){
  if(quick?.type==='bible'&&!quick.pages?.some(page=>page.some(line=>line.trim()))&&!quick.text?.trim()){actions.openBible();return}
  const now=(actions.now??(()=>AppClock.now().getTime()))();
  const next=quick?.id==='technical-issue'&&quick.type==='custom'?{...quick,activatedAtMs:typeof quick.activatedAtMs==='number'&&Number.isFinite(quick.activatedAtMs)&&quick.activatedAtMs>=0&&quick.activatedAtMs<=now+60000?quick.activatedAtMs:now}:quick?.type==='countdown'?{...quick,startedAtMs:now}:quick;
  actions.setQuick(next);
  if(actions.onAir)await actions.sendQuick(next?.targets??['main'],next);
}

const builtinOperatorNames:Record<string,string>={"screen-test":"Bildschirmtest","technical-issue":"Technische Störung","logo":"Logo","black":"Schwarz","empty":"Leer","no-text":"Ohne Text","amen":"Amen","countdown":"Countdown","bible":"Bibel einblenden"};
/** Localize only unchanged built-in control names; saved/custom names and output stay verbatim. */
export function operatorQuickScreenName(quick:Pick<QuickScreenConfig,"id"|"name">,copy:(source:string)=>string):string{const original=Object.hasOwn(builtinOperatorNames,quick.id)?builtinOperatorNames[quick.id]:undefined;return original===quick.name?copy(original):quick.name}
