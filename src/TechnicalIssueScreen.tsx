import type {QuickScreenConfig} from './preferences';
import {technicalEnglishText,technicalIssueLanguage} from './technicalIssueLanguage';
export function TechnicalIssueScreen({quick,now=0,staticPreview=false}:{quick:QuickScreenConfig;now?:number;staticPreview?:boolean}){
 const language=staticPreview?'de':technicalIssueLanguage(quick.activatedAtMs,now),text=language==='en'?technicalEnglishText(quick.technicalIssueEnglishText):typeof quick.text==='string'?quick.text:'Technische Störung\nWir bitten um etwas Geduld.';
 const lines=text.split('\n'),title=lines.length>1?lines[0]:language==='en'?'Technical difficulties':quick.name,description=lines.length>1?lines.slice(1).join('\n'):text===quick.name?'':text;
 return <section className="technical-issue-message" lang={language} style={{height:'100%'}}><span className="technical-issue-mark" aria-hidden="true"><svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="3"/><circle cx="24" cy="14" r="2.5" fill="currentColor"/><path d="M24 22v13" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg></span><h1>{title}</h1>{description&&<p>{description}</p>}</section>;
}
