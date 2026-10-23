export const DEFAULT_TECHNICAL_ENGLISH='Technical difficulties\nThank you for your patience.';
export function technicalIssueLanguage(activatedAt:number|undefined,now:number):'de'|'en'{
 return typeof activatedAt==='number'&&Number.isFinite(activatedAt)&&activatedAt>=0&&Number.isFinite(now)&&Math.floor(Math.max(0,now-activatedAt)/8000)%2===1?'en':'de';
}
export function technicalEnglishText(value:unknown):string{
 return typeof value==='string'&&value.trim()&&value.length<=5000?value:DEFAULT_TECHNICAL_ENGLISH;
}
