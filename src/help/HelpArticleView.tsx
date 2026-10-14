import type {HelpArticle} from './index';
import {getHelpArticle} from './index';
import './help-article.css';
const labels:Record<string,[string,string]>={de:['Auf dieser Seite','Passende Themen'],gsw:['Auf dieser Seite','Passende Themen'],en:['On this page','Related topics'],da:['På denne side','Relaterede emner'],sv:['På den här sidan','Relaterade ämnen'],no:['På denne siden','Relaterte emner'],fi:['Tällä sivulla','Aiheeseen liittyvää'],nl:['Op deze pagina','Verwante onderwerpen'],fr:['Sur cette page','Sujets connexes'],es:['En esta página','Temas relacionados'],it:['In questa pagina','Argomenti correlati'],pl:['Na tej stronie','Powiązane tematy'],'pt-BR':['Nesta página','Tópicos relacionados'],uk:['На цій сторінці','Пов’язані теми'],ru:['На этой странице','Связанные темы'],tr:['Bu sayfada','İlgili konular'],ar:['في هذه الصفحة','مواضيع ذات صلة']};
export function HelpArticleView({article,locale,onOpenTopic,screenshot}:{article:HelpArticle;locale:string;onOpenTopic?:(id:string)=>void;screenshot?:{src:string;caption:string;alt:string}}){
  const [contents,related]=labels[locale]??labels.en;
  const sections=article.body.split(/\n(?=## )/).map((text,index)=>{const title=text.match(/^## (.+)\n/)?.[1],body=title?text.slice(text.indexOf('\n')+1):text;return {title,body,id:`help-${article.id.replace(/[^\p{L}\p{N}-]/gu,'-')}-${index}`}});
  return <div className="help-article-view" lang={locale} dir={locale==='ar'?'rtl':'ltr'}>
    <header className="help-article-heading"><h2>{article.title}</h2></header>
    {sections.some(section=>section.title)&&<nav className="help-article-toc" aria-label={contents}><strong>{contents}</strong>{sections.filter(section=>section.title).map(section=><a key={section.id} href={`#${section.id}`}>{section.title}</a>)}</nav>}
    {screenshot&&<figure className="help-screenshot focus-center"><div><img loading="lazy" src={screenshot.src} alt={screenshot.alt}/></div><figcaption>{screenshot.caption}</figcaption></figure>}
    {sections.map(section=><section key={section.id} id={section.id} className="help-article-section">{section.title&&<h3>{section.title}</h3>}{section.body.trim().split(/\n\s*\n/).filter(Boolean).map((paragraph,index)=>{
      const rows=paragraph.split('\n');
      if(rows.every(row=>/^\d+[.)]\s/.test(row)))return <ol key={index}>{rows.map((row,n)=><li key={n}>{row.replace(/^\d+[.)]\s/,'')}</li>)}</ol>;
      if(paragraph.startsWith('> '))return <aside className="help-article-note" key={index}>{paragraph.replace(/^> /gm,'')}</aside>;
      return <p key={index}>{paragraph}</p>;
    })}</section>)}
    {Boolean(article.related?.length)&&<nav className="help-related-topics" aria-label={related}><h3>{related}</h3>{article.related!.map(id=><button key={id} onClick={()=>onOpenTopic?.(id)}>{getHelpArticle(id,locale)?.title??id}</button>)}</nav>}
  </div>;
}
