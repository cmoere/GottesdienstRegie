import type {QuickScreenType} from './preferences';
const shortcuts:Partial<Record<QuickScreenType,string>>={logo:'F2',black:'F3',empty:'F4',noText:'F5',amen:'F6',countdown:'F7',bible:'F9'};
export function quickScreenShortcut(type:QuickScreenType):string{return shortcuts[type]??''}
export function quickScreenTypeForKey(key:string):QuickScreenType|undefined{const normalized=key.toUpperCase();return (Object.entries(shortcuts).find(([,value])=>value===normalized)?.[0]) as QuickScreenType|undefined}
export function normalizeBibleDisplayText(value:string):string{return value.replace(/\bGOtt\b/g,'Gott')}
export function shouldRenderOperatorQuick(mode:'edit'|'preview',type:QuickScreenType|undefined):boolean{return mode==='preview'&&Boolean(type)}
