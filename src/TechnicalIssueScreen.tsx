import type {QuickScreenConfig} from './preferences';
export function TechnicalIssueScreen({quick}:{quick:QuickScreenConfig}){
 const lines=(quick.text??'').split('\n'),title=lines.length>1?lines[0]:quick.name,description=lines.length>1?lines.slice(1).join('\n'):quick.text===quick.name?'':quick.text;
 return <section className="technical-issue-message"><span className="technical-issue-mark" aria-hidden="true"/><h1>{title}</h1>{description&&<p>{description}</p>}</section>;
}
