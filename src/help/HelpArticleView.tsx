import type {HelpArticle} from './index';
import {getHelpArticle} from './index';
import './help-article.css';
import type {GermanRegionId} from '../../shared/regional/catalog';
import type {Language} from '../preferences';
import {locales} from '../i18nBase';
import {resolveRegionalText} from '../regional/resources';
export function HelpArticleView({article,locale,germanRegion=null,onOpenTopic,screenshot}:{article:HelpArticle;locale:string;germanRegion?:GermanRegionId|null;onOpenTopic?:(id:string)=>void;screenshot?:{src:string;caption:string;alt:string}}){
  const language=Object.hasOwn(locales,locale)?locale as Language:'en';
  const t=(key:'helpContents'|'helpRelatedTopics')=>resolveRegionalText({language,germanRegion},key);
  const contents=t('helpContents'),related=t('helpRelatedTopics');
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
    {Boolean(article.related?.length)&&<nav className="help-related-topics" aria-label={related}><h3>{related}</h3>{article.related!.map(id=><button key={id} onClick={()=>onOpenTopic?.(id)}>{getHelpArticle(id,language,germanRegion)?.title??id}</button>)}</nav>}
  </div>;
}
