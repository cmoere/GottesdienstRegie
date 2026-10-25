import { helpEnglish } from './english';
import {v91HelpGerman,v91HelpEnglish} from './v91';
import { helpWest } from './localesWest';
import translated from './translated.json';
import legacyTranslated from './legacyTranslated.json';
import {legacyGerman} from './legacyGerman';
import {helpEnhancementsEnglish} from './enhancementsEnglish';
import {helpEnhancementsGerman} from './enhancementsGerman';
import enhancementsDa from './enhancements/da.json';
import enhancementsPl from './enhancements/pl.json';
import enhancementsSv from './enhancements/sv.json';
import enhancementsFr from './enhancements/fr.json';
import enhancementsEs from './enhancements/es.json';
import enhancementsNo from './enhancements/no.json';
import enhancementsIt from './enhancements/it.json';
import enhancementsPtBr from './enhancements/pt-BR.json';
import enhancementsUk from './enhancements/uk.json';
import enhancementsRu from './enhancements/ru.json';
import enhancementsFi from './enhancements/fi.json';
import enhancementsTr from './enhancements/tr.json';
import enhancementsNl from './enhancements/nl.json';
import enhancementsAr from './enhancements/ar.json';

export type HelpArticle = { id: string; title: string; body: string; section?: boolean;related?:string[] };
export type HelpUI = { title: string; searchPlaceholder: string; noResults: string; screenshotLabel: string };
export const helpLanguages = ['de','gsw','en','da','sv','no','fi','nl','fr','es','it','pl','pt-BR','uk','ru','tr','ar'] as const;
export const stableGerman = Object.keys(helpEnglish);
const uiRows: Record<string, [string,string,string,string]> = {
  de: ['Hilfe','Hilfethemen durchsuchen …','Keine passenden Hilfethemen gefunden.','Beispielansicht'],
  gsw: ['Hilfe','Hilfethemen durchsuchen …','Keine passenden Hilfethemen gefunden.','Beispielansicht'],
  en: ['Help','Search help topics …','No matching help topics.','Example view'],
  da: ['Hjælp','Søg i hjælpeemner …','Ingen matchende hjælpeemner.','Eksempelvisning'],
  sv: ['Hjälp','Sök i hjälpavsnitt …','Inga matchande hjälpavsnitt.','Exempelvy'],
  no: ['Hjelp','Søk i hjelpeemner …','Ingen samsvarende hjelpeemner.','Eksempelvisning'],
  fi: ['Ohje','Hae ohjeaiheita …','Vastaavia ohjeaiheita ei löytynyt.','Esimerkkinäkymä'],
  nl: ['Help','Zoek in helponderwerpen …','Geen overeenkomende helponderwerpen.','Voorbeeldweergave'],
  fr: ['Aide','Rechercher dans l’aide …','Aucun sujet correspondant.','Exemple d’affichage'],
  es: ['Ayuda','Buscar temas de ayuda …','No hay temas coincidentes.','Vista de ejemplo'],
  it: ['Aiuto','Cerca negli argomenti …','Nessun argomento corrispondente.','Vista di esempio'],
  pl: ['Pomoc','Szukaj tematów pomocy …','Brak pasujących tematów.','Przykładowy widok'],
  'pt-BR': ['Ajuda','Pesquisar tópicos de ajuda …','Nenhum tópico correspondente.','Exemplo de visualização'],
  uk: ['Довідка','Пошук тем довідки …','Відповідних тем не знайдено.','Приклад вигляду'],
  ru: ['Справка','Поиск по справке …','Подходящие темы не найдены.','Пример отображения'],
  tr: ['Yardım','Yardım konularında ara …','Eşleşen yardım konusu bulunamadı.','Örnek görünüm'],
  ar: ['المساعدة','البحث في مواضيع المساعدة …','لم يتم العثور على مواضيع مطابقة.','عرض توضيحي'],
};
const sectionIds = new Set(['SCHNELLSTART','LIVE-BETRIEB','AUDIO','PRÄSENTATION','SYSTEM']);
const sourcePacks: Record<string, Record<string, {title:string;body:string;related?:string[]}>> = { ...translated, ...helpWest, en:helpEnglish };
// Assemble into separate maps: hot reloads must never append guidance to source packs.
const packs=Object.fromEntries(Object.entries(sourcePacks).map(([locale,pack])=>[locale,{...pack}]));
const enhancements:Record<string,typeof helpEnhancementsEnglish>={en:helpEnhancementsEnglish,de:helpEnhancementsGerman,da:enhancementsDa,pl:enhancementsPl,sv:enhancementsSv,fr:enhancementsFr,es:enhancementsEs,no:enhancementsNo,it:enhancementsIt,'pt-BR':enhancementsPtBr,uk:enhancementsUk,ru:enhancementsRu,fi:enhancementsFi,tr:enhancementsTr,nl:enhancementsNl,ar:enhancementsAr};
// These old instructions predate independent test operation, protected post-program
// content and the current countdown/update workflow. Current articles replace them.
const retiredLegacy=new Set(['ON AIR','Pre-Service & Post-Service','Vorschau','MAIN / STAGE / LIVESTREAM','Timer','Updates','Loop-Elemente','Audio Browser','Einstellungen','Erste Schritte']);
for(const [locale,pack] of Object.entries(packs)){
  const legacy:Record<string,{body:string}>=locale==='de'
    ? Object.fromEntries(Object.entries(legacyGerman).map(([id,body])=>[id,{body}]))
    : (legacyTranslated as Record<string,Record<string,{body:string}>>)[locale]??{};
  for(const [id,article] of Object.entries(pack)){
    const oldParagraphs=(legacy[id]?.body??'').split('\n\n');
    // The old Unsplash opening described a removed key-entry UI. Keep its useful
    // selection/rights/troubleshooting guidance, not obsolete credential setup.
    const paragraphs=[...(retiredLegacy.has(id)?[]:id==='Unsplash'?oldParagraphs.slice(1):oldParagraphs),...article.body.split('\n\n')].filter(Boolean);
    const extra=enhancements[locale]?.[id];
    pack[id]={...article,body:[...new Set(paragraphs)].join('\n\n')+(extra?'\n\n'+extra.body:''),related:extra?.related};
  }
}
for(const [locale,additions]of Object.entries({de:v91HelpGerman,en:v91HelpEnglish}))for(const [id,body]of Object.entries(additions))if(packs[locale][id])packs[locale][id]={...packs[locale][id],body:packs[locale][id].body+'\n\n'+body};
// Swiss Standard German: avoids claiming an automatically generated dialect translation.
packs.gsw = Object.fromEntries(Object.entries(packs.de).map(([id,a])=>[id,{...a,title:a.title.replaceAll('ß','ss'),body:a.body.replaceAll('ß','ss')}]));
const catalogs = new Map<string, {topics:HelpArticle[];ui:HelpUI}>();
export function getHelpCatalog(language: string) {
  const locale = Object.hasOwn(packs,language) ? language : 'en';
  let catalog = catalogs.get(locale);
  if (!catalog) {
    const [title,searchPlaceholder,noResults,screenshotLabel] = uiRows[locale];
    catalog = {
      topics: stableGerman.map(id => ({id, ...packs[locale][id], section:sectionIds.has(id)})),
      ui: {title,searchPlaceholder,noResults,screenshotLabel},
    };
    catalogs.set(locale,catalog);
  }
  return catalog;
}
export function getHelpArticle(id: string, language: string) {
  return getHelpCatalog(language).topics.find(article=>article.id===id);
}
